/*
 * Line planner data model.
 *
 * A "line" is the plan for a single trainer fight: which of your Pokémon leads,
 * and turn by turn what it does, branching wherever the fight can realistically
 * go a different way (no KO, a crit, the opponent switching).
 *
 * Nodes hold only what the player decides. Anything derivable - damage rolls,
 * KO chance, who moves first, and the boosts/hazards in play - is recomputed
 * rather than stored, so editing a Pokémon in the Box updates every line using
 * it, and rewiring a branch re-derives the state underneath it.
 */

var LINES = {};

/*
 * Why a branch exists. These are directional: a fight can fork because of
 * something you did or something they did, and "they miss" is a very different
 * plan from "you miss".
 */
const EDGE_CONDITIONS = {
    youko: {id: "youko", name: "You KO", color: "good", side: "you"},
    younoko: {id: "younoko", name: "You don't KO", color: "bad", side: "you"},
    youmiss: {id: "youmiss", name: "You miss", color: "bad", side: "you"},
    youcrit: {id: "youcrit", name: "You crit", color: "good", side: "you"},
    youcritko: {id: "youcritko", name: "You crit KO", color: "good", side: "you"},
    /*
     * Sleep and freeze break on their own schedule and can do it on the very
     * first turn, so the honest way to plan around them is a branch rather than
     * a turn count.
     */
    youwake: {id: "youwake", name: "You wake / thaw", color: "good", side: "you"},
    // A planned trade: let something die to get a free switch-in.
    sac: {id: "sac", name: "Sacrifice", color: "warn", side: "you"},
    theyko: {id: "theyko", name: "They KO you", color: "bad", side: "them"},
    yousurvive: {id: "yousurvive", name: "You survive", color: "good", side: "them"},
    theymiss: {id: "theymiss", name: "They miss", color: "good", side: "them"},
    theycrit: {id: "theycrit", name: "They crit", color: "bad", side: "them"},
    theycritko: {id: "theycritko", name: "They crit KO", color: "bad", side: "them"},
    theywake: {id: "theywake", name: "They wake / thaw", color: "bad", side: "them"},
    theyswitch: {id: "theyswitch", name: "They switch out", color: "warn", side: "them"},
    theysetup: {id: "theysetup", name: "They set up", color: "warn", side: "them"},
    always: {id: "always", name: "Then", color: "neutral", side: ""},
    custom: {id: "custom", name: "", color: "neutral", side: ""}
};

// Conditions were non-directional before; keep old saved lines working.
const LEGACY_CONDITIONS = {
    ko: "youko",
    noko: "younoko",
    faint: "theyko",
    crit: "youcrit",
    miss: "youmiss",
    foeswitch: "theyswitch"
};

/*
 * Platinum Kaizo strips the self-inflicted stat drops from these moves (see the
 * deletes in calc/src/data/moves.ts). Worth flagging, because anyone arriving
 * from the base game will plan around a drawback that isn't there - and the
 * enemy AI gets the same benefit.
 */
const NO_DROP_MOVES = ["superpower", "overheat", "psychoboost", "dracometeor", "leafstorm"];

const MAX_BOOST = 6;

/*
 * Sleep is random in the middle but pinned at both ends: a Pokemon cannot wake
 * on the turn it falls asleep, and after four turns it is awake no matter what.
 * Those two are guaranteed, so a plan can rest on them - which is why the wake
 * is modelled rather than left entirely to a branch.
 *
 * The turns in between are a genuine coin flip and stay one: the badge counts
 * up, and an early wake is still a branch.
 */
const SLEEP_MAX_TURNS = 4;

/*
 * Screens run out; entry hazards don't. Both live in the side's `hazards` map,
 * but a hazard's value counts layers while a screen's counts the turns it has
 * left - so the two are told apart by this list rather than by their value.
 *
 * Five turns, or eight if whoever set it was holding a Light Clay. Straight from
 * the game's own move text; a plan resting on a screen that quietly expired two
 * turns ago is worse than one that never assumed a screen at all.
 */
const SCREENS = {
    isReflect: "Reflect",
    isLightScreen: "Light Screen"
};

const SCREEN_TURNS = 5;
const SCREEN_TURNS_LIGHT_CLAY = 8;
const LIGHT_CLAY = "lightclay";

/*
 * Everything on a side whose stored value is a countdown rather than a layer
 * count. A superset of SCREENS, because Tailwind counts down the same way but is
 * not a screen: Brick Break doesn't break it and Defog doesn't clear it, so the
 * two lists have to stay separate even though they tick together.
 */
const TAILWIND = "isTailwind";
const TIMED_SIDE = {
    isReflect: "Reflect",
    isLightScreen: "Light Screen",
    isTailwind: "Tailwind"
};

/*
 * Binding moves run 2-5 turns, so 5 is a ceiling as much as confusion's is: the
 * grip is gone after it either way. A Grip Claw doesn't extend that in this game
 * - its own text says "last for 5 turns" - it removes the early release, so the
 * hold is exactly 5 rather than anywhere from 2.
 */
const GRIP_CLAW = "gripclaw";
const TRAP_MAX_TURNS = 5;

function newLineId() {
    return `line-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function newLine(trainerName) {
    return {
        id: newLineId(),
        name: trainerName,
        game: GAME.id,
        trainer: trainerName,
        notes: "",
        nodes: {},
        edges: {},
        view: {x: 0, y: 0}
    };
}

/*
 * A node is one decision point: your Pokémon, theirs, what you do, and which of
 * their moves you're planning around. `mon` refers to a Box entry by its
 * "Species (Set)" key so the node keeps tracking that Pokémon as you level it.
 *
 * `stateOverride` breaks inheritance when set, for when a line starts mid-fight
 * or a branch converges from somewhere the graph doesn't model.
 */
function newNode(x, y) {
    return {
        id: `node-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        x: x,
        y: y,
        /*
         * A slot per Pokémon out on each side. Singles use index 0 only;
         * doubles, tag and two-trainer fights use both. Kept as arrays so the
         * two cases are the same code rather than a special case each.
         */
        mons: ["", ""],
        foes: ["", ""],
        // Each slot acts independently: attack or switch, a switch costing that
        // slot its turn.
        actions: [{type: "move", value: ""}, {type: "move", value: ""}],
        foeActions: [{type: "move", value: ""}, {type: "move", value: ""}],
        /*
         * Which opposing slot each slot is attacking, or null for "whoever is
         * across". In a 2v2 every position is adjacent to every other, so a
         * single-target move can be aimed at either opponent - focusing both of
         * yours onto one of theirs is most of what makes a double a double.
         *
         * Kept beside the actions rather than on them because actions are
         * replaced wholesale in half a dozen places, and an aim stored inside one
         * would be silently thrown away by any of them.
         */
        aimedAt: {you: [null, null], them: [null, null]},
        note: "",
        /*
         * Status carried into this turn rather than caused by it - for walking
         * in pre-slept or pre-poisoned so the AI can't land something worse.
         * Applied after inheritance, so setting it on the first turn carries it
         * down the whole line.
         */
        statusSeed: {you: ["", ""], them: ["", ""]},
        /*
         * Volatiles carried into this turn, alongside the status above. Kept as
         * its own field rather than folded into statusSeed so lines saved before
         * it existed still load - a missing one simply reads as none.
         */
        volatileSeed: {you: [[], []], them: [[], []]},
        // The other half of the toggle: volatiles this turn ends, as opposed to
        // ones it starts. Only the ones actually switched off are listed.
        volatileClear: {you: [[], []], them: [[], []]},
        /*
         * Slots that never got their move off - KO'd before acting, flinched,
         * fully paralysed, confused into itself, or simply missed. The planner
         * has no speed or damage data, so it cannot work this out; you say it,
         * and the effects of that slot's move are skipped when the turn folds
         * in. Outspeeding a lead to deny Stealth Rock is the usual reason.
         */
        skipped: {you: [false, false], them: [false, false]},
        /*
         * Stat stages this turn applies on top of what it inherited. A delta
         * rather than an absolute, so it composes with the boosts derived from
         * earlier turns instead of pinning them.
         *
         * This is the escape hatch for everything the move table deliberately
         * won't promise: a secondary-effect drop that actually landed, a move
         * whose text didn't parse, or a line that starts mid-fight already set
         * up.
         */
        boostSeed: {you: [{}, {}], them: [{}, {}]},
        /*
         * Health stated outright, as a percentage, or null to inherit whatever
         * the plan worked out. Unlike boostSeed this is an absolute rather than a
         * delta, because its whole job is to collapse a range back to a point:
         * for a line that starts mid-fight, or for one where the band has widened
         * past the point of being useful and you know what actually happened.
         */
        hpSeed: {you: [null, null], them: [null, null]},
        stateOverride: null,
        // Move pickers start open so a fresh turn can be filled in, then get
        // collapsed away once it's decided.
        movesOpen: true,
        // Folds away everything that follows this turn.
        collapsed: false
    };
}

/*
 * Ids are unique per edge rather than derived from the node pair: several
 * different outcomes can lead to the same follow-up turn ("You KO" and "They
 * miss" both continuing into the same plan), and a pair-derived id made the
 * second branch silently overwrite the first.
 */
function newEdge(from, to, condition) {
    return {
        id: `edge-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        from: from,
        to: to,
        condition: condition || "always",
        label: ""
    };
}

/*
 * Two branches between the same pair of turns are useful when they mean
 * different things ("You KO" and "They miss" both continuing into the same
 * plan), but two saying the *same* thing is just a duplicate with no meaning.
 *
 * Scoped to the pair on purpose: the same condition between different turns is
 * completely normal, and most lines repeat "You KO" all over the place.
 */
function findDuplicateEdge(line, from, to, condition, label, exceptId) {
    var wanted = (label || "").trim().toLowerCase();
    return Object.values(line.edges).find(function(edge) {
        if (edge.id === exceptId) return false;
        if (edge.from !== from || edge.to !== to) return false;
        if (conditionFor(edge).id !== condition) return false;
        return (edge.label || "").trim().toLowerCase() === wanted;
    }) || null;
}

function conditionFor(edge) {
    var id = LEGACY_CONDITIONS[edge.condition] || edge.condition;
    return EDGE_CONDITIONS[id] || EDGE_CONDITIONS.always;
}

/* --------------------------------------------------------------- fight state */

/*
 * Only one non-volatile status at a time (`status`), which is what makes
 * deliberately statusing your own Pokémon a real tactic: a sleeping or poisoned
 * mon cannot then be paralysed or burned. Volatiles like confusion sit
 * alongside it, so they're tracked separately.
 */
const STATUSES = {
    slp: {id: "slp", name: "Asleep", short: "SLP"},
    psn: {id: "psn", name: "Poisoned", short: "PSN"},
    tox: {id: "tox", name: "Badly Poisoned", short: "TOX"},
    brn: {id: "brn", name: "Burned", short: "BRN"},
    par: {id: "par", name: "Paralyzed", short: "PAR"},
    frz: {id: "frz", name: "Frozen", short: "FRZ"}
};

/*
 * Volatiles sit alongside the non-volatile status rather than competing with it,
 * and they clear when the Pokemon leaves the field.
 *
 * Only conditions that actually exist in this game are listed. Platinum Kaizo
 * deletes Taunt, Nightmare and Heal Block outright (see the deletes in
 * calc/src/data/moves.ts), so there is no way to be taunted here and offering it
 * would only invite plans that can't happen.
 */
/*
 * `maxTurns` is the point at which the condition is guaranteed gone, the way
 * sleep is after four. Confusion runs 2-5, Encore 4-8, Disable 4-7 - random in
 * the middle, certain at the end - so the planner ends them there rather than
 * carrying them down a line forever. Encore can also break early when the
 * encored move runs out of PP, which isn't tracked, so its ceiling is the only
 * half of it worth relying on.
 *
 * The rest have no turn limit at all: Leech Seed and Torment last until the
 * target switches out, Attract until either side leaves, and a Substitute until
 * something breaks it. Leaving the field already clears all of them.
 */
const VOLATILES = {
    confusion: {id: "confusion", name: "Confused", short: "CNF", maxTurns: 5},
    encore: {id: "encore", name: "Encored - locked into its last move", short: "ENC", maxTurns: 8},
    leechseed: {id: "leechseed", name: "Seeded - loses HP each turn to the other side", short: "SEED"},
    disable: {id: "disable", name: "Disabled - its last move is unusable", short: "DIS", maxTurns: 7},
    torment: {id: "torment", name: "Tormented - cannot use the same move twice in a row", short: "TOR"},
    attract: {id: "attract", name: "Infatuated - may not act", short: "ATT"},
    substitute: {id: "substitute", name: "Behind a Substitute", short: "SUB"},
    /*
     * The two that hand a sixteenth back every turn. `regen` is the denominator,
     * carried here beside `maxTurns` because it is the same kind of fact: a rule
     * about the condition rather than anything the move text has to be parsed
     * for. Neither ever expires; both go when the Pokemon leaves the field, which
     * is what Ingrain's self-trap is there to prevent.
     */
    aquaring: {id: "aquaring", name: "Aqua Ring - recovers 1/16 each turn", short: "RING", regen: 16},
    ingrain: {id: "ingrain", name: "Ingrained - recovers 1/16 each turn, and cannot switch out", short: "ROOT", regen: 16}
};

/*
 * Held items that cure a status the moment it lands, and are used up doing it.
 * This is deterministic, unlike sleep timers, so it can be modelled honestly -
 * and it matters: Roark's Cranidos holds a Lum Berry, so a plan built on
 * poisoning it simply doesn't work.
 */
const STATUS_CURES = {
    lumberry: {statuses: "all", volatiles: ["confusion"], name: "Lum Berry"},
    lavacookie: {statuses: "all", name: "Lava Cookie"},
    oldgateau: {statuses: "all", name: "Old Gateau"},
    cheriberry: {statuses: ["par"], name: "Cheri Berry"},
    chestoberry: {statuses: ["slp"], name: "Chesto Berry"},
    // Pecha covers the badly-poisoned case too.
    pechaberry: {statuses: ["psn", "tox"], name: "Pecha Berry"},
    rawstberry: {statuses: ["brn"], name: "Rawst Berry"},
    aspearberry: {statuses: ["frz"], name: "Aspear Berry"},
    persimberry: {statuses: [], volatiles: ["confusion"], name: "Persim Berry"}
};

// Sentinel for "this status ends on this turn", as opposed to naming a new one.
const STATUS_CURED = "cured";

/*
 * With two Pokémon out per side, "the side's boosts" stops meaning anything -
 * boosts, status and volatiles all belong to a particular Pokémon. So they live
 * in a per-Pokémon record, keyed by the same reference a slot holds, and the
 * side keeps only what is genuinely shared: hazards and screens.
 *
 * This also makes switching fall out for free. Nothing needs copying between
 * slots; a Pokémon simply keeps its own record, and boosts are cleared when it
 * leaves the field while its status stays with it.
 */
function emptyMonState() {
    // statusTurns counts how long the current status has been sitting there,
    // which is what tells you whether a sleep is about to run out.
    // `perish` is turns left on a Perish Song before this Pokemon faints, 0 for
    // no song. A counter rather than a volatile, because the number is the plan.
    /*
     * `trapped` is {expires, turns, fixed} or null. `turns` counts turns
     * elapsed, not remaining - a binding move runs 2-5 turns at random, so like
     * sleep the number is a gauge rather than a promise. `fixed` is set only
     * when a Grip Claw pins it to exactly 5, which is the one case a plan can
     * actually rely on.
     */
    /*
     * `hp` is null until something takes a chunk out of this Pokemon, meaning
     * "at full, whatever full is" - which saves needing its max HP, and so its
     * whole set, before anything has happened to it.
     *
     * Once damaged it is {min, max, full} in real HP points. A range rather than
     * a number because a damage roll is 85-100%: the honest carry is the band,
     * widening by the spread on every hit, exactly the way sleep and the binding
     * moves are a gauge rather than a promise. The branch conditions are what
     * narrow it again - see applyOutcome.
     */
    return {boosts: {}, status: "", statusTurns: 0, volatiles: {},
            // Turns elapsed per volatile, for the three that run out on their own.
            volatileTurns: {},
            hp: null,
            // End-of-turn ticks a badly-poisoned Pokemon has taken; the damage
            // ramps with it, and leaving the field puts it back to zero.
            toxicTicks: 0,
            /*
             * Turns on which this Pokemon has had the chance to act. Zero means
             * it is acting for the first time since it came in, which is the
             * whole of Fake Out's condition. A turn spent switching in doesn't
             * count - it never got to move - so a Pokemon can still Fake Out on
             * the turn after it arrives.
             */
            turnsActive: 0,
            perish: 0, perishDone: false, trapped: null};
}

/*
 * HP helpers. `full` is carried on the record rather than looked up because the
 * card needs it to draw a bar, and rebuilding a whole calc Pokemon just to ask
 * its max HP would be wasteful.
 */
function hpOf(mon) {
    return mon && mon.hp ? mon.hp : null;
}

// Dead on every roll. `min` is the worst case, so this is certainty, not a risk.
function isFainted(mon) {
    var hp = hpOf(mon);
    return !!(hp && hp.max <= 0);
}

// Could be dead, could not - which is precisely what a KO branch is drawn for.
function mayHaveFainted(mon) {
    var hp = hpOf(mon);
    return !!(hp && hp.min <= 0 && hp.max > 0);
}

/*
 * Takes a damage range off a Pokemon. The worst case for its survival is the
 * biggest roll, so `min` loses `hi` and `max` loses `lo` - which is what makes
 * the band widen by the roll spread on every hit.
 */
function damageMon(mon, lo, hi, full) {
    if (!mon.hp) mon.hp = {min: full, max: full, full: full};
    // Nothing further reaches something already gone on every roll.
    if (mon.hp.max <= 0) return;
    mon.hp.min -= hi;
    mon.hp.max -= lo;
    if (mon.hp.min < 0) mon.hp.min = 0;
    if (mon.hp.max < 0) mon.hp.max = 0;
}

/*
 * Healing, the same arithmetic the other way, capped at full - and refused to
 * anything already gone.
 *
 * That guard is the whole reason this isn't a one-liner. End-of-turn effects
 * resolve in a fixed order, so a Pokémon can be killed by the sandstorm and then
 * "healed" by its Leftovers a step later unless something stops it. It faints
 * where it fainted; the Leftovers never happen.
 *
 * The half-dead case is the interesting one. A band straddling zero means it
 * survived on some rolls and not others, so the healing applies only to the
 * rolls where there was still somebody to heal: the top of the band moves and
 * the bottom stays at nothing.
 */
function healMon(mon, lo, hi) {
    if (!mon.hp) return;
    if (mon.hp.max <= 0) return;
    if (mon.hp.min > 0) mon.hp.min = Math.min(mon.hp.full, mon.hp.min + lo);
    mon.hp.max = Math.min(mon.hp.full, mon.hp.max + hi);
}

/*
 * Turn order.
 *
 * Priority bracket first, then speed - and Platinum Kaizo rebalanced the
 * brackets, so they are read from the move table rather than assumed. This game
 * puts Trick Room and Block at +7, Tailwind at +5, Fake Out at +3, and gives the
 * hazard moves +1, none of which match the base game. Hardcoding vanilla values
 * here would quietly get the order wrong in exactly the fights that turn on it.
 */
function movePriority(moveName) {
    var move = findMove(moveName);
    return (move && move.priority) || 0;
}

/*
 * Things that make the order genuinely unknowable rather than merely unknown.
 * A Quick Claw is a flat 20% to jump the whole queue, so a plan can no more rely
 * on the holder moving last than it can on a sleep breaking early - and a slot
 * that might have moved first must never be denied its move.
 */
const QUICK_CLAW = "quickclaw";
// Abilities and items that always move last inside their bracket.
const GOES_LAST_ABILITY = "stall";
const GOES_LAST_ITEMS = ["laggingtail", "fullincense"];
const TRICK_ROOM = "trickroom";

/*
 * Every slot's action for this turn, fastest first, grouped so that anything
 * genuinely simultaneous stays together.
 *
 * The grouping is the important part: two Pokemon on the same priority and the
 * same speed move in an order nothing here can know, so they are handed the same
 * snapshot of the fight and cannot deny each other.
 */
function turnOrder(line, parent, onField, state, slots) {
    var actions = [];
    /*
     * Trick Room already up flips the speed comparison - and only the speed one.
     * Priority brackets still win outright, which is why a Quick Attack still
     * goes first under it.
     *
     * Read off the state at the top of the turn rather than watched for during
     * it: gen 4 settles turn order once, before anything moves, and never
     * revisits it. A Trick Room cast *this* turn therefore changes nothing until
     * the next one, which is exactly what this gets right by not looking.
     */
    var reversed = !!state.trickRoom;

    ["you", "them"].forEach(function(side) {
        for (var i = 0; i < slots; i++) {
            if (switchTargetAt(parent, side, i)) continue;
            if (!monAt(onField, side, i)) continue;
            var move = moveAt(parent, side, i);
            var holder = activeHolder(line, onField, side, i);
            var item = toID((holder && holder.item) || "");
            var ability = toID((holder && holder.ability) || "");
            actions.push({
                side: side,
                slot: i,
                priority: movePriority(move),
                speed: typeof speedFor === "function" ? speedFor(line, onField, state, side, i) : 0,
                last: ability === GOES_LAST_ABILITY || GOES_LAST_ITEMS.indexOf(item) >= 0,
                unsure: item === QUICK_CLAW
            });
        }
    });

    actions.sort(function(a, b) {
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.last !== b.last) return a.last ? 1 : -1;
        return reversed ? a.speed - b.speed : b.speed - a.speed;
    });

    var groups = [];
    actions.forEach(function(action) {
        var group = groups[groups.length - 1];
        var tied = group && group[0].priority === action.priority &&
            group[0].last === action.last && group[0].speed === action.speed;
        if (tied) group.push(action);
        else groups.push([action]);
    });
    return groups;
}

/*
 * Fake Out is the one move in this game whose flinch is a certainty rather than
 * a chance, which is what makes it modellable at all - the percentage flinchers
 * (Bite, Rock Slide, Air Slash) are deliberately left alone for the same reason
 * a 10% burn is. It is also the only move that fails on its own schedule:
 *
 *   "Causes the target to flinch. Fails if used after the user's first turn on
 *    the field."
 *
 * 121 of this game's 2121 trainer sets carry it, and at +3 priority in Kaizo it
 * nearly always resolves first - so a lead that Fake Outs really does take the
 * other side's whole first turn away.
 *
 * Neither half of this is in the generated tables: the effect text isn't in the
 * "Has a 100% chance to..." form gen-move-effects.js matches, and flinch isn't a
 * volatile the planner tracks (it lasts a fraction of a turn, not turns).
 */
const FAKE_OUT = "fakeout";
// Inner Focus simply refuses to flinch.
const FLINCH_PROOF_ABILITY = "innerfocus";

// Whether a move does nothing at all this turn, before anything is applied.
function moveFailsNow(state, node, side, slot, moveName) {
    var move = findMove(moveName);
    if (!move || move.id !== FAKE_OUT) return false;
    var mon = monState(state, side, monAt(node, side, slot));
    return (mon.turnsActive || 0) > 0;
}

function flinchesTarget(moveName) {
    var move = findMove(moveName);
    return !!(move && move.id === FAKE_OUT);
}

function canBeFlinched(line, node, state, side, slot) {
    var ref = monAt(node, side, slot);
    if (!ref) return false;
    if (isFainted(monState(state, side, ref))) return false;
    var holder = activeHolder(line, node, side, slot);
    return toID((holder && holder.ability) || "") !== FLINCH_PROOF_ABILITY;
}

/*
 * Resolves every slot's move in turn order, folding in effects and damage.
 *
 * `alreadyGone` is who was dead before the turn started; those never act. Within
 * the turn, a slot is denied only when something strictly faster has already
 * killed it *on every roll* - a certainty, the same class of fact as sleep
 * ending after four turns. A kill that only lands on some rolls stays a branch,
 * because that is exactly what "You KO / You don't KO" is drawn for.
 *
 * `onDenied` is how the card finds out; the fold itself ignores it.
 */
function resolveMoves(line, parent, onField, state, crits, alreadyGone, slots, onDenied) {
    // Slots a flinch has already taken the turn away from.
    var flinched = {};

    turnOrder(line, parent, onField, state, slots).forEach(function(group) {
        /*
         * One snapshot per group, taken before any of its members move. Slots on
         * the same priority and speed are simultaneous, so neither can be denied
         * by the other's damage - or by its flinch.
         */
        var goneBefore = {};
        group.forEach(function(action) {
            goneBefore[action.side + action.slot] =
                isFainted(monState(state, action.side, monAt(onField, action.side, action.slot)));
        });
        var newFlinches = {};

        group.forEach(function(action) {
            var side = action.side;
            var i = action.slot;
            var other = side === "you" ? "them" : "you";
            if (alreadyGone[side][i]) return;
            if (!actedAt(parent, side, i)) return;

            /*
             * Outsped and killed outright. A Quick Claw holder is spared, since
             * it may well have moved first and nothing here can say it didn't.
             */
            if (goneBefore[side + i] && !action.unsure) {
                if (onDenied) onDenied(side, i, "outsped");
                return;
            }
            // Flinched by something that already moved this turn.
            if (flinched[side + i] && !action.unsure) {
                if (onDenied) onDenied(side, i, "flinched");
                return;
            }

            var move = moveAt(parent, side, i);
            if (!move) return;
            /*
             * A Fake Out that isn't this Pokemon's first turn out does nothing
             * whatsoever - no damage, no flinch. It still costs the turn.
             */
            if (moveFailsNow(state, onField, side, i, move)) {
                if (onDenied) onDenied(side, i, "failed");
                return;
            }

            // The aim is a decision on the turn, so it is read from `parent`;
            // `onField` only knows who is standing where after the switches.
            var targets = targetsOf(onField, side, i, move, aimAt(parent, side, i));
            applyMoveEffect(move, state, side, i, targets, line, onField);
            /*
             * Damage is folded in by planner-calc.js, which owns everything that
             * touches the calculator. Absent, the plan still derives every other
             * kind of state - HP is simply never subtracted.
             */
            if (typeof foldDamage === "function") {
                foldDamage(line, onField, state, side, i, targets, move, crits);
            }

            /*
             * Held back until the group finishes, so a flinch can only take the
             * turn from something strictly slower. Two Pokemon moving at the same
             * instant can't flinch one another out of a move.
             */
            if (flinchesTarget(move)) {
                targets.forEach(function(target) {
                    if (canBeFlinched(line, onField, state, other, target)) {
                        newFlinches[other + target] = true;
                    }
                });
            }
        });

        for (var key in newFlinches) flinched[key] = true;
    });
}

/*
 * Which of a turn's own slots lose their move to being outsped and killed, for
 * the card to show. Runs the same resolution against a throwaway copy, so what
 * is drawn and what is folded can't disagree.
 */
function deniedByOrder(line, node, state) {
    var denied = {};
    if (typeof foldDamage !== "function" || blindMode()) return denied;
    var slots = slotCount(line);
    var scratch = normalizeState(cloneState(state));
    var alreadyGone = {you: [], them: []};
    ["you", "them"].forEach(function(side) {
        for (var i = 0; i < slots; i++) {
            alreadyGone[side][i] = isFainted(monState(scratch, side, monAt(node, side, i)));
        }
    });
    resolveMoves(line, node, node, scratch, {}, alreadyGone, slots, function(side, slot, reason) {
        denied[side + slot] = reason;
    });
    return denied;
}

/*
 * End-of-turn damage and healing: weather, Leftovers, Leech Seed and status.
 *
 * @smogon/calc computes one move against one target and stops, so none of this
 * comes free with the damage - but without it an HP bar drifts further from the
 * truth every turn, and drifts worst in exactly the long fights most worth
 * planning. The fractions and the exception lists are taken from calc's own
 * getEndOfTurn (calc/src/desc.ts) so that the planner's HP and the calculator's
 * KO chances can't disagree about the same fight.
 *
 * Every one of these is a fixed fraction of max HP rather than a roll, so unlike
 * move damage they shift both ends of the band equally and never widen it.
 */
const SAND_IMMUNE_TYPES = ["rock", "ground", "steel"];
// Abilities that shrug the weather off, sand and hail respectively.
const SAND_IMMUNE_ABILITIES = ["magicguard", "overcoat", "sandforce", "sandrush", "sandveil"];
const HAIL_IMMUNE_ABILITIES = ["magicguard", "overcoat", "snowcloak"];

// Gen 4 truncates each fraction, and never to less than a single point.
function chip(full, denominator) {
    return Math.max(1, Math.floor(full / denominator));
}

function applyResiduals(line, node, state) {
    /*
     * Wish first, before anything else takes a bite - it is collected at the end
     * of the turn after it was made, by whoever is standing in the slot then.
     * Counted down here rather than on the Pokemon, the way Perish Song is
     * counted on the Pokemon, because this one genuinely belongs to the slot.
     */
    /*
     * The queue is drained in two passes, because its two members sit at
     * opposite ends of the turn. Wish resolves before the weather is even
     * announced; Future Sight and Doom Desire land right at the back, after the
     * poison and the burn have taken their share. So a Wish can save something
     * from a sandstorm, and a Future Sight cannot be outrun by one.
     */
    function drainPending(kind) {
        ["you", "them"].forEach(function(side) {
            var queued = state[side].pending || [];
            for (var slot = 0; slot < 2; slot++) {
                var list = queued[slot] || [];
                queued[slot] = list.filter(function(item) {
                    if (item.kind !== kind) return true;
                    item.turns -= 1;
                    if (item.turns > 0) return true;

                    var target = ensureHp(line, node, state, side, slot);
                    // Nobody standing there means it simply goes to waste.
                    if (target) {
                        if (kind === "heal") healMon(target, item.amount, item.amount);
                        else damageMon(target, item.amount, item.amount, target.hp.full);
                    }
                    return false;
                });
            }
        });
    }

    drainPending("heal");

    ["you", "them"].forEach(function(side) {
        var other = side === "you" ? "them" : "you";
        for (var slot = 0; slot < 2; slot++) {
            var ref = monAt(node, side, slot);
            if (!ref) continue;
            var mon = monState(state, side, ref);
            // The ramp only belongs to a poison that is still there.
            if (mon.status !== "tox") mon.toxicTicks = 0;
            // Nothing left to take off something already gone.
            if (isFainted(mon)) continue;

            var holder = activeHolder(line, node, side, slot);
            var ability = toID((holder && holder.ability) || "");
            var item = toID((holder && holder.item) || "");
            /*
             * Magic Guard takes nothing from any of this - weather, status,
             * Leech Seed, the lot - so it short-circuits the whole block.
             */
            if (ability === "magicguard") continue;

            var record = ensureHp(line, node, state, side, slot);
            if (!record) continue;
            var full = record.hp.full;
            var types = ((speciesAt(line, node, side, slot) || {}).types) || [];
            var goggles = item === "safetygoggles";

            function hurt(fraction) { damageMon(record, chip(full, fraction), chip(full, fraction), full); }
            function heal(fraction) { healMon(record, chip(full, fraction), chip(full, fraction)); }

            /*
             * Weather first. Sand Veil earns its place here rather than only in
             * the evasion it is famous for - Roark's Gible sits in his gym's
             * sandstorm taking nothing from it.
             */
            if (state.weather === "Sand") {
                if (!types.some(function(t) { return SAND_IMMUNE_TYPES.indexOf(t) >= 0; }) &&
                    SAND_IMMUNE_ABILITIES.indexOf(ability) < 0 && !goggles) hurt(16);
            } else if (state.weather === "Hail") {
                if (ability === "icebody") heal(16);
                else if (types.indexOf("ice") < 0 && HAIL_IMMUNE_ABILITIES.indexOf(ability) < 0 && !goggles) hurt(16);
            } else if (state.weather === "Sun") {
                if (ability === "dryskin" || ability === "solarpower") hurt(8);
            } else if (state.weather === "Rain") {
                if (ability === "dryskin") heal(8);
                else if (ability === "raindish") heal(16);
            }

            /*
             * Aqua Ring and Ingrain hand back a sixteenth every turn. Small, and
             * over a long fight worth more than it looks - which is the entire
             * case for a Pokemon that carries either.
             */
            for (var v in mon.volatiles) {
                if (mon.volatiles[v] && VOLATILES[v] && VOLATILES[v].regen) heal(VOLATILES[v].regen);
            }

            // Then the item, which in this generation resolves before status.
            if (item === "leftovers") heal(16);
            else if (item === "blacksludge") types.indexOf("poison") >= 0 ? heal(16) : hurt(8);
            else if (item === "stickybarb") hurt(8);

            /*
             * Leech Seed moves HP rather than destroying it: whatever the seeded
             * Pokemon loses, whoever is opposite gains. A Big Root on the one
             * being fed makes the transfer bigger without costing the other side
             * any more.
             */
            if (mon.volatiles.leechseed) {
                var drain = chip(full, 8);
                damageMon(record, drain, drain, full);
                var fedSlot = monAt(node, other, slot) ? slot : 0;
                var fed = ensureHp(line, node, state, other, fedSlot);
                var fedHolder = activeHolder(line, node, other, fedSlot);
                if (fed && !isFainted(fed)) {
                    var gain = toID((fedHolder && fedHolder.item) || "") === "bigroot"
                        ? Math.trunc(drain * 5324 / 4096)
                        : drain;
                    // Liquid Ooze turns the drink into a drink of poison.
                    if (toID((fedHolder && fedHolder.ability) || "") === "liquidooze") {
                        damageMon(fed, gain, gain, fed.hp.full);
                    } else {
                        healMon(fed, gain, gain);
                    }
                }
            }

            // Status last, and only one of these can ever apply.
            if (mon.status === "psn") {
                ability === "poisonheal" ? heal(8) : hurt(8);
            } else if (mon.status === "tox") {
                if (ability === "poisonheal") heal(8);
                else {
                    /*
                     * Toxic keeps its own count rather than reading statusTurns.
                     * That one is incremented at the top of a turn, so it is
                     * already 1 for a poison carried in but still 0 for one a
                     * move landed this turn - two different numbers for what is
                     * equally the first tick. Counting the ticks themselves is
                     * the thing that is actually being asked for.
                     */
                    mon.toxicTicks = (mon.toxicTicks || 0) + 1;
                    var toxic = chip(full, 16) * mon.toxicTicks;
                    damageMon(record, toxic, toxic, full);
                }
            } else if (mon.status === "brn") {
                // Gen 4 burns for a full 1/8; it was only softened to 1/16 in gen 7.
                ability === "heatproof" ? hurt(16) : hurt(8);
            }
        }
    });

    /*
     * Last of all, the attacks that were aimed two turns ago. Being at the back
     * is what makes them so hard to play around: whatever the weather and the
     * poison have already taken comes off first, and this lands on the remainder.
     */
    drainPending("damage");
}

/* ------------------------------------------------------------- validation */

/*
 * Things wrong with a turn, in the terms a plan cares about.
 *
 * Every one of these is a *certainty* rather than a suspicion. A warning that
 * fires on a maybe is worse than none at all: it trains you to ignore the ones
 * that matter, and half of what this planner tracks is deliberately uncertain.
 * So nothing here fires on a damage roll going one way or the other, only on
 * something that cannot be true however the rolls fall.
 *
 * Nothing is ever corrected. These are notes on your plan, not a plan of their
 * own - the line the roadmap draws around auto-generated lines applies here too.
 */
function validateNode(line, node, state) {
    var warnings = [];
    var slots = slotCount(line);
    var seen = {};

    ["you", "them"].forEach(function(side) {
        var other = side === "you" ? "them" : "you";
        for (var slot = 0; slot < slots; slot++) {
            var ref = monAt(node, side, slot);
            if (!ref) continue;

            function warn(text) { warnings.push({side: side, slot: slot, text: text}); }
            var who = speciesAt(line, node, side, slot);
            var name = (who && who.name) || ref;

            // The same Pokemon cannot be in both slots at once.
            if (seen[side + ref]) warn(`${name} is on this turn twice - it can only be in one slot`);
            seen[side + ref] = true;

            // Something you have already lost for good.
            if (side === "you" && !isPartnerSlot(line, side, slot)) {
                var entry = boxEntry(ref);
                if (entry && entry.dead) warn(`${name} is dead in the Box, so it can't be in this fight`);
            }

            var mon = monState(state, side, ref);
            var move = moveAt(node, side, slot);
            var switching = switchTargetAt(node, side, slot);

            /*
             * Dead coming into the turn. Only ever true once HP is being
             * carried, so this stays quiet in blind mode of its own accord.
             */
            if (isFainted(mon)) {
                if (move) warn(`${name} has already fainted, so it can't use ${move}`);
                continue;
            }

            if (!move && !switching) {
                warn(`${name} has no move chosen`);
                continue;
            }
            if (!move) continue;

            /*
             * A move it no longer has - usually because the Box was edited.
             *
             * Compared by identity rather than by string, because the same move
             * has two spellings here: a set carries the game's own name while the
             * dex carries its display name, and "Self-Destruct" and "Selfdestruct"
             * are the same move. Matching on text would report every one of those
             * as forgotten, which is exactly the false positive this whole block
             * is supposed to avoid.
             */
            var entrySet = slotSet(line, node, side, slot);
            var known = entrySet && entrySet.set && entrySet.set.moves;
            var chosen = findMove(move);
            if (known && chosen) {
                var hasIt = known.some(function(m) {
                    var known_ = findMove(m);
                    return known_ && known_.id === chosen.id;
                });
                if (!hasIt) warn(`${name} doesn't know ${chosen.name} any more`);
            }

            // Attacking something that is already gone.
            var aimed = targetsOf(node, side, slot, move, aimAt(node, side, slot));
            var allDead = aimed.length && aimed.every(function(t) {
                var target = monAt(node, other, t);
                return target && isFainted(monState(state, other, target));
            });
            if (allDead) warn(`${name} is attacking something that has already fainted`);
        }
    });
    return warnings;
}

/*
 * Whether a branch says something the arithmetic rules out.
 *
 * Only the impossible is flagged, never the unlikely: "You KO" is wrong only if
 * the move cannot kill on *any* roll, and "You don't KO" only if it kills on
 * every one. Anything in between is exactly what a branch is for.
 */
const OUTCOME_NEEDS_KILL = {youko: "you", youcritko: "you", theyko: "them", theycritko: "them"};
const OUTCOME_NEEDS_SURVIVAL = {younoko: "you", yousurvive: "them"};

function validateEdge(line, edge) {
    if (typeof plannerDamage !== "function") return null;
    var node = line.nodes[edge.from];
    if (!node) return null;

    var condition = conditionFor(edge);
    var killer = OUTCOME_NEEDS_KILL[condition.id] || OUTCOME_NEEDS_SURVIVAL[condition.id];
    if (!killer) return null;
    var needsKill = !!OUTCOME_NEEDS_KILL[condition.id];

    var state = computeNodeState(line, edge.from);
    var slots = slotCount(line);
    /*
     * In a double any of the attacking side's slots could be the one the branch
     * is about, so it is only a contradiction when *none* of them can manage it.
     */
    var anyPossible = false;
    var anyChecked = false;

    for (var slot = 0; slot < slots; slot++) {
        var move = moveAt(node, killer, slot);
        if (!move || !actedAt(node, killer, slot)) continue;
        if (switchTargetAt(node, killer, slot)) continue;
        var damage = plannerDamage(line, node, state, killer, slot, move,
            condition.id === "youcritko" || condition.id === "theycritko" ||
            condition.id === "youcrit" || condition.id === "theycrit");
        if (!damage) continue;
        anyChecked = true;
        if (needsKill ? damage.mayKill : !damage.kills) anyPossible = true;
    }

    /*
     * Worded around the move that was actually picked, because that is all this
     * looks at. Something on that side may well have another move that kills;
     * the branch is only impossible for the one the plan commits to.
     */
    if (!anyChecked || anyPossible) return null;
    return needsKill
        ? `"${condition.name}" can't happen here: the move selected on that side does not kill on any roll.`
        : `"${condition.name}" can't happen here: the attack kills on every roll.`;
}

/*
 * A branch condition is a statement about which way a roll went, so it is also
 * the thing that narrows the HP range back down. That is what stops the band
 * widening forever: every fork in the plan prunes it.
 *
 *   You KO / You crit KO / Sacrifice   -> pinned to nothing left
 *   They KO you / They crit KO
 *   You don't KO / You survive         -> floor lifted off zero
 *
 * A miss is deliberately not here. "Its move never went off" is already the
 * per-slot `skipped` toggle, and two mechanisms for one fact would double-count.
 */
const OUTCOME_FAINTS = {youko: "them", youcritko: "them", sac: "you", theyko: "you", theycritko: "you"};
const OUTCOME_SURVIVES = {younoko: "them", yousurvive: "you"};

// Whose move the branch says landed a critical hit, if either.
function critSides(condition) {
    if (!condition) return {};
    if (condition.id === "youcrit" || condition.id === "youcritko") return {you: true};
    if (condition.id === "theycrit" || condition.id === "theycritko") return {them: true};
    return {};
}

/*
 * The HP record for a slot, created at full if nothing has touched it yet. Full
 * comes from the calc layer, since max HP means knowing the whole set; without
 * it there is no scale to express damage on, so the caller leaves the slot be.
 */
function ensureHp(line, node, state, side, slot) {
    // No health is tracked at all in blind mode, so there is no scale to put a
    // Pokemon on - which also stops the residuals and the hazards from writing
    // a record that would then have nothing to show it in.
    if (blindMode()) return null;
    var ref = monAt(node, side, slot);
    if (!ref) return null;
    var mon = monState(state, side, ref);
    if (mon.hp) return mon;
    var full = typeof maxHpFor === "function" ? maxHpFor(line, node, state, side, slot) : 0;
    if (!full) return null;
    mon.hp = {min: full, max: full, full: full};
    return mon;
}

function applyOutcome(condition, state, onField, line) {
    if (!condition) return;
    var faints = OUTCOME_FAINTS[condition.id];
    var survives = OUTCOME_SURVIVES[condition.id];
    var side = faints || survives;
    if (!side) return;

    var slots = [0, 1].filter(function(i) { return monAt(onField, side, i); });

    /*
     * The slots the outcome is genuinely about are the ones whose range straddles
     * zero - it could have died, it could have held on - because that uncertainty
     * is the only thing a branch can resolve. In singles there is never more than
     * one, and in a double it is nearly always the one being attacked.
     */
    var uncertain = slots.filter(function(i) {
        return mayHaveFainted(monState(state, side, monAt(onField, side, i)));
    });

    /*
     * With nothing uncertain the branch disagrees with the arithmetic - a KO the
     * numbers say couldn't have happened, or couldn't have failed to. The
     * statement still wins, because that is how every other seed here works: you
     * are recording what happened, not asking to be second-guessed. It applies to
     * one slot only, so a double doesn't lose both Pokemon to a single label.
     */
    var affected = uncertain.length ? uncertain : slots.filter(function(i) {
        return !isFainted(monState(state, side, monAt(onField, side, i)));
    }).slice(0, 1);

    affected.forEach(function(i) {
        var mon = ensureHp(line, onField, state, side, i);
        if (!mon) return;
        if (faints) {
            mon.hp.min = 0;
            mon.hp.max = 0;
        } else if (mon.hp.min <= 0) {
            mon.hp.min = 1;
        }
    });
}

function emptySide() {
    /*
     * Things already on their way to a slot, one list per slot. They belong to
     * the *slot* rather than to any Pokemon, which is the whole point of every
     * move that queues one: Wish, switch, and the arrival collects the healing;
     * Future Sight, and whatever they bring in two turns later takes the hit.
     *
     * Each entry is {turns, amount, kind, name}, with the amount fixed at the
     * moment the move was used - half of the *user's* max HP for a Wish, and for
     * Future Sight the damage worked out against whoever was standing there then.
     */
    return {hazards: {}, pending: [[], []]};
}

// The record for one Pokémon, created the first time anything touches it.
function monState(state, side, ref) {
    if (!ref) return emptyMonState();
    if (!state.mons[side][ref]) state.mons[side][ref] = emptyMonState();
    return state.mons[side][ref];
}

/*
 * `you` and `them` describe whichever Pokémon is currently out. Anything on a
 * side that outlives a switch - hazards - stays there; boosts and volatiles are
 * lost the moment something else comes in.
 *
 * A non-volatile status is different again: it belongs to the Pokémon, not the
 * slot, so it has to be remembered per Pokémon and comes back with it.
 */
function emptyState() {
    return {
        you: emptySide(),
        them: emptySide(),
        // Per-Pokémon boosts, status and volatiles, keyed by slot reference.
        mons: {you: {}, them: {}},
        weather: "",
        /*
         * Trick Room, which belongs to the field rather than to either side, the
         * way weather does. A plain boolean because this game made it a toggle
         * rather than a timer - "Reverses the speed order of the battle until the
         * move is used again", where the base game gives it five turns. So there
         * is no counter to keep and no expiry to model; casting it again turns it
         * back off.
         */
        trickRoom: false,
        /*
         * Where the weather came from: "battle" for weather the fight starts in,
         * otherwise whichever move or ability set it. Only the card reads this,
         * to say why there is sand on a turn nobody asked for sand on.
         */
        weatherSource: "",
        ambiguous: false,
        // A curing berry only works once, so spent ones are remembered per Pokémon.
        itemsUsed: {you: {}, them: {}}
    };
}

// Older saved overrides predate these.
function normalizeState(state) {
    if (state.trickRoom === undefined) state.trickRoom = false;
    ["you", "them"].forEach(function(side) {
        if (!state[side]) return;
        if (!state[side].pending) state[side].pending = [[], []];
        // An override saved while Wish had its own field still carries one.
        if (state[side].wish) {
            state[side].wish.forEach(function(wish, slot) {
                if (wish) state[side].pending[slot].push(
                    {turns: wish.turns, amount: wish.amount, kind: "heal", name: "Wish"});
            });
            delete state[side].wish;
        }
    });
    if (!state.mons) state.mons = {you: {}, them: {}};
    if (!state.mons.you) state.mons.you = {};
    if (!state.mons.them) state.mons.them = {};
    if (!state.itemsUsed) state.itemsUsed = {you: {}, them: {}};
    if (!state.itemsUsed.you) state.itemsUsed.you = {};
    if (!state.itemsUsed.them) state.itemsUsed.them = {};
    return state;
}

function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}

/*
 * `guard` is the ability of whoever is being boosted. Several abilities refuse
 * stat drops inflicted by the opponent - Clear Body and White Smoke refuse all
 * of them, Hyper Cutter only Attack, Keen Eye only accuracy - and a drop that
 * never lands changes the plan.
 */
function addBoosts(target, boosts, guard) {
    var blocked = guard && guard.blocksDrops;
    for (var stat in boosts) {
        if (boosts[stat] < 0 && blocked &&
            (blocked === "all" || blocked.indexOf(stat) >= 0)) continue;
        var next = (target[stat] || 0) + boosts[stat];
        target[stat] = Math.max(-MAX_BOOST, Math.min(MAX_BOOST, next));
    }
}

function findMove(name) {
    if (!name) return null;
    return Object.values(MOVES).find(x => x.calcName === name || x.name === name) || null;
}

/*
 * The full set behind a slot, from whichever roster owns it, with the species
 * name alongside it - a Box entry is keyed by a reference that survives
 * evolution, so the species has to come off the entry rather than off the key.
 *
 * The damage adapter needs the whole set (level, IVs, EVs, nature) rather than
 * just the ability and item, so the roster dispatch lives here and activeHolder
 * reads it too.
 */
function slotSet(line, node, side, slot) {
    var ref = monAt(node, side, slot);
    if (!ref) return null;

    // Your own Box, only for slots you actually control.
    if (side === "you" && !isPartnerSlot(line, side, slot)) {
        var entry = boxEntry(ref);
        return entry ? {species: entry.species, set: entry.set} : null;
    }

    var set = side === "you"
        ? trainerSet(trainerForSlot(line, side, slot), ref)
        : foeSetFor(line, node, ref);
    // Trainer rosters are keyed by species, so the reference is the name.
    return set ? {species: ref, set: set} : null;
}

/*
 * What the active Pokémon on a side is holding, and who it is. Your side reads
 * from the Box; theirs from the trainer's set for that fight.
 */
function activeHolder(line, node, side, slot) {
    var ref = monAt(node, side, slot);
    if (!ref) return null;
    var entry = slotSet(line, node, side, slot);

    /*
     * An unresolvable Box reference means the slot is genuinely empty - that
     * Pokémon has left the Box. A trainer set that doesn't resolve still names
     * somebody, so it keeps its id and simply holds nothing.
     */
    if (side === "you" && !isPartnerSlot(line, side, slot)) {
        return entry ? {id: ref, item: entry.set.item, ability: entry.set.ability} : null;
    }
    return {id: ref, item: entry ? entry.set.item : "", ability: entry ? entry.set.ability : ""};
}

/*
 * The planner-relevant half of an ability - status protection, stat-drop
 * protection, switch-in effects, trapping. Anything that only changes damage is
 * absent on purpose; @smogon/calc already handles those.
 */
function abilityEffect(abilityName) {
    if (!abilityName || typeof ABILITY_EFFECTS === "undefined") return null;
    return ABILITY_EFFECTS[toID(abilityName)] || null;
}

function abilityOf(line, node, side, slot) {
    var holder = activeHolder(line, node, side, slot);
    if (!holder || !holder.ability) return null;
    var ability = typeof ABILITIES === "undefined" ? null : ABILITIES[toID(holder.ability)];
    return {
        id: toID(holder.ability),
        name: ability ? ability.name : holder.ability,
        text: ability && ability.desc ? String(ability.desc.battle || "") : "",
        effect: abilityEffect(holder.ability)
    };
}

// Whether an ability stops a status landing at all.
function abilityBlocksStatus(holder, status, volatile_, state) {
    var fx = holder && abilityEffect(holder.ability);
    if (!fx) return false;
    // Leaf Guard only holds while its weather is up.
    if (fx.requiresWeather && (!state || state.weather !== fx.requiresWeather)) return false;
    if (status) return (fx.blocksStatus || []).indexOf(status) >= 0;
    return (fx.blocksVolatiles || []).indexOf(volatile_) >= 0;
}

/*
 * Spends a curing item if the Pokémon holds one that covers what it just
 * caught. Returns true when the status was cured, so the caller knows not to
 * apply it.
 */
function tryCureWithItem(state, side, holder, status, volatile_) {
    if (!holder || !holder.item) return false;
    var cure = STATUS_CURES[toID(holder.item)];
    if (!cure) return false;
    if (state.itemsUsed[side][holder.id]) return false;

    var covers = status
        ? (cure.statuses === "all" || (cure.statuses || []).indexOf(status) >= 0)
        : (cure.volatiles || []).indexOf(volatile_) >= 0;
    if (!covers) return false;

    state.itemsUsed[side][holder.id] = cure.name;
    return true;
}

/*
 * Applies one move.
 *
 * `from` is the slot using it; `targets` are the opposing slots it lands on.
 * A spread move names both of them, which is the thing that makes a double
 * genuinely different from two 1v1 plans running side by side.
 */
function applyMoveEffect(moveName, state, actor, from, targets, line, node) {
    var move = findMove(moveName);
    if (!move) return;

    /*
     * Trick Room is handled before the generated table is consulted, because it
     * isn't in it: what it does is reverse the field's speed order, which is not
     * one of the effects gen-move-effects.js extracts. A toggle rather than a
     * timer in this game, so casting it again simply turns it off.
     *
     * This takes effect from the *next* turn. Gen 4 fixes turn order at the top
     * of a turn and never revisits it - speed changing part-way through changes
     * nothing until the following turn - so the turn Trick Room lands on still
     * runs in the order it was already going to.
     */
    if (move.id === TRICK_ROOM) state.trickRoom = !state.trickRoom;

    var fx = typeof MOVE_EFFECTS === "undefined" ? null : MOVE_EFFECTS[move.id];
    if (!fx) return;

    var otherSide = actor === "you" ? "them" : "you";
    var userHolder = activeHolder(line, node, actor, from);
    var user = monState(state, actor, monAt(node, actor, from));

    if (fx.self) addBoosts(user.boosts, fx.self, abilityEffect(userHolder && userHolder.ability));

    targets.forEach(function(slot) {
        var ref = monAt(node, otherSide, slot);
        if (!ref) return;
        /*
         * A type the move simply doesn't work on - Leech Seed against a Grass
         * type, and nothing else in this game. Its own text says so, and the
         * planner used to seed them happily, which let a plan rest on something
         * the game refuses outright.
         */
        if (fx.failsAgainstType) {
            var victim = speciesAt(line, node, otherSide, slot);
            if (victim && (victim.types || []).indexOf(fx.failsAgainstType) >= 0) return;
        }
        var holder = activeHolder(line, node, otherSide, slot);
        var target = monState(state, otherSide, ref);
        var guard = abilityEffect(holder && holder.ability);

        if (fx.target) addBoosts(target.boosts, fx.target, guard);

        /*
         * A status has to get past two things before it sticks: an ability that
         * refuses it outright, and a held item that cures it on arrival. And a
         * Pokémon already carrying a non-volatile status can't take another -
         * the mechanic behind pre-statusing your own to lock out worse ones.
         */
        if (fx.targetStatus && !target.status &&
            !abilityBlocksStatus(holder, fx.targetStatus, "", state) &&
            !tryCureWithItem(state, otherSide, holder, fx.targetStatus)) {
            target.status = fx.targetStatus;
            target.statusTurns = 0;
        }
        /*
         * A Grip Claw pins a binding move to exactly 5 turns; without one it is
         * 2-5 and nothing here should pretend otherwise. Re-trapping an already
         * trapped Pokemon restarts the count.
         */
        if (fx.trapsTarget) {
            target.trapped = {
                expires: fx.trapsTarget.expires,
                turns: 0,
                // Grip Claw removes the early release rather than extending it.
                guaranteed: !!(fx.trapsTarget.expires && userHolder &&
                    toID(userHolder.item || "") === GRIP_CLAW)
            };
        }
        if (fx.targetVolatiles) {
            fx.targetVolatiles.forEach(function(v) {
                if (abilityBlocksStatus(holder, "", v, state)) return;
                if (tryCureWithItem(state, otherSide, holder, "", v)) return;
                target.volatiles[v] = true;
            });
        }
    });

    if (fx.selfStatus && !user.status &&
        !abilityBlocksStatus(userHolder, fx.selfStatus, "", state) &&
        !tryCureWithItem(state, actor, userHolder, fx.selfStatus)) {
        user.status = fx.selfStatus;
        user.statusTurns = 0;
    }

    // Substitute is the one volatile a move puts on its own user.
    if (fx.selfVolatiles) {
        fx.selfVolatiles.forEach(function(v) {
            if (VOLATILES[v]) user.volatiles[v] = true;
        });
    }

    // Ingrain roots its user down: it heals every turn and can never leave.
    if (fx.trapsSelf) {
        user.trapped = {expires: fx.trapsSelf.expires, turns: 0, guaranteed: false, self: true};
    }

    /*
     * Roost stops its user being a Flying type for the rest of the turn, which is
     * what lets it Roost into a Rock or Electric move and live. Recorded against
     * the slot rather than the Pokemon, and wiped at the end of the turn, because
     * that is exactly how long it lasts.
     */
    if (fx.selfLosesType) {
        if (!state.losesType) state.losesType = {};
        state.losesType[actor + from] = fx.selfLosesType;
    }

    /*
     * Wish is set on the slot and collected a turn later, so what it heals is
     * whoever is standing there by then - and how much is fixed now, at half of
     * the *user's* max HP.
     */
    if (fx.wish) {
        var wisher = ensureHp(line, node, state, actor, from);
        if (wisher) {
            state[actor].pending[from].push({
                turns: fx.wish.delay,
                amount: Math.floor(wisher.hp.full * fx.wish.fraction[0] / fx.wish.fraction[1]),
                kind: "heal",
                name: move.name
            });
        }
    }

    /*
     * Pain Split levels the two health bars: both end on the average of what
     * they had. Neither an attack nor a heal - which of the two it is depends
     * entirely on who was worse off, which is why something frail and nearly
     * dead uses it to drag a healthy Pokemon down to meet it.
     *
     * Both bands are averaged end for end, so the result is as uncertain as the
     * two that went into it.
     */
    if (fx.painSplit) {
        targets.forEach(function(slot) {
            var mine = ensureHp(line, node, state, actor, from);
            var theirs = ensureHp(line, node, state, otherSide, slot);
            if (!mine || !theirs) return;
            var lo = Math.floor((mine.hp.min + theirs.hp.min) / 2);
            var hi = Math.floor((mine.hp.max + theirs.hp.max) / 2);
            [mine, theirs].forEach(function(record) {
                // Neither can end up above its own maximum.
                record.hp.min = Math.min(lo, record.hp.full);
                record.hp.max = Math.min(hi, record.hp.full);
            });
        });
    }

    // Hazards and screens are the side's, not any one Pokémon's.
    if (fx.hazard) {
        var field = fx.hazard.field;
        state[otherSide].hazards[field] =
            Math.min((state[otherSide].hazards[field] || 0) + 1, fx.hazard.max);
    }
    /*
     * Defog takes the target's side back to nothing - hazards and screens alike,
     * which is what its text says and what gen 4 does. It is the only move that
     * removes hazards here: Platinum Kaizo deletes Rapid Spin.
     */
    /*
     * Perish Song is heard by everything on the field, the user included, so it
     * is applied to both sides rather than to `targets`. An existing count is
     * never raised - hearing the song twice doesn't buy anybody time.
     */
    if (fx.perish) {
        ["you", "them"].forEach(function(side) {
            var refs = (side === "you" ? node.mons : node.foes) || [];
            refs.forEach(function(ref) {
                if (!ref) return;
                var heard = monState(state, side, ref);
                if (!heard.perish || fx.perish < heard.perish) heard.perish = fx.perish;
            });
        });
    }

    if (fx.clearsTarget) {
        // Defog takes hazards and screens. Tailwind is neither, and rides it out.
        var keptTailwind = state[otherSide].hazards[TAILWIND];
        state[otherSide].hazards = {};
        if (keptTailwind) state[otherSide].hazards[TAILWIND] = keptTailwind;
    }

    // Brick Break only breaks the screens; hazards on that side stay put.
    if (fx.clearsScreens) {
        for (var screen in SCREENS) delete state[otherSide].hazards[screen];
    }

    /*
     * Healing a fixed fraction of the user's own max HP. The drain moves are not
     * here - they heal a share of the damage dealt, which comes off the damage
     * itself in planner-calc.js rather than from a number in the table.
     *
     * Synthesis, Moonlight and Morning Sun swing on the weather: two thirds in
     * sun, a quarter in anything else at all. In a fight that starts in sand -
     * 235 of them do - that is the difference between a recovery move and a
     * wasted turn, so it is worth getting right rather than averaging.
     */
    if (fx.selfHeal) {
        var healed = ensureHp(line, node, state, actor, from);
        if (healed) {
            var share = fx.selfHeal.fraction;
            if (fx.selfHeal.sun) {
                if (state.weather === "Sun") share = fx.selfHeal.sun;
                else if (state.weather) share = fx.selfHeal.otherWeather;
            }
            // Integer arithmetic throughout; see the note in gen-move-effects.js.
            var amount = Math.floor(healed.hp.full * share[0] / share[1]);
            healMon(healed, amount, amount);
        }
    }

    /*
     * Tailwind, and nothing else in this game. Kept out of the screen list on
     * purpose: Brick Break doesn't break it and Defog doesn't blow it away.
     */
    if (fx.sideCondition) {
        state[actor].hazards[fx.sideCondition.field] = fx.sideCondition.turns;
    }

    // Light Clay is checked on the setter, not on whoever is out later.
    if (fx.screen) {
        state[actor].hazards[fx.screen] =
            userHolder && toID(userHolder.item || "") === LIGHT_CLAY
                ? SCREEN_TURNS_LIGHT_CLAY
                : SCREEN_TURNS;
    }
    if (fx.weather) {
        state.weather = fx.weather;
        state.weatherSource = "move";
    }
}

function parentEdges(line, nodeId) {
    return Object.values(line.edges).filter(e => e.to === nodeId);
}

function childEdges(line, nodeId) {
    return Object.values(line.edges).filter(e => e.from === nodeId);
}

/*
 * Which turns to draw, given that folded ones hide what follows them.
 *
 * Branches converge - two outcomes can lead into the same turn - so this can't
 * simply drop every descendant of a folded turn. Visibility spreads outwards
 * from the roots and stops at anything folded, which leaves a turn showing
 * whenever some other unfolded path still reaches it.
 *
 * Purely presentational: computeNodeState still walks the whole graph, so a
 * visible turn keeps the state its hidden ancestors gave it.
 */
function visibleNodes(line) {
    var visible = {};
    var queue = [];

    Object.keys(line.nodes).forEach(function(id) {
        if (!parentEdges(line, id).length) {
            visible[id] = true;
            queue.push(id);
        }
    });

    // A graph that is all cycles has no root to start from; show it all rather
    // than blanking the canvas.
    if (!queue.length) {
        Object.keys(line.nodes).forEach(function(id) { visible[id] = true; });
        return visible;
    }

    while (queue.length) {
        var id = queue.shift();
        if (line.nodes[id] && line.nodes[id].collapsed) continue;
        childEdges(line, id).forEach(function(edge) {
            if (visible[edge.to] || !line.nodes[edge.to]) return;
            visible[edge.to] = true;
            queue.push(edge.to);
        });
    }
    return visible;
}

// How many turns a given fold is actually hiding, for the badge on the card.
function hiddenBehind(line, nodeId, visible) {
    var seen = {};
    var queue = childEdges(line, nodeId).map(e => e.to);
    var count = 0;
    while (queue.length) {
        var id = queue.shift();
        if (seen[id] || !line.nodes[id]) continue;
        seen[id] = true;
        if (!visible[id]) count++;
        childEdges(line, id).forEach(e => queue.push(e.to));
    }
    return count;
}

/*
 * Walks back up to the root, accumulating whatever each turn left behind.
 *
 * A node reached by more than one branch has no single answer - the parents can
 * carry different boosts - so the first parent wins and the node is marked
 * ambiguous for the UI to flag. Pin a stateOverride to settle it.
 */
/*
 * Slot accessors. Every turn has two slots per side; singles simply leave the
 * second empty, so one code path covers both.
 */
function monAt(node, side, slot) {
    if (!node) return "";
    var list = side === "you" ? node.mons : node.foes;
    return (list && list[slot]) || "";
}

function actionAt(node, side, slot) {
    if (!node) return {type: "move", value: ""};
    var list = side === "you" ? node.actions : node.foeActions;
    return (list && list[slot]) || {type: "move", value: ""};
}

function switchTargetAt(node, side, slot) {
    var action = actionAt(node, side, slot);
    return action.type === "switch" ? action.value : "";
}

/*
 * Whether a slot's move actually went off. False means it was denied - KO'd
 * first, flinched, missed - and the turn folds in without its effects.
 */
function actedAt(node, side, slot) {
    var skipped = node && node.skipped && node.skipped[side];
    return !(skipped && skipped[slot]);
}

function moveAt(node, side, slot) {
    var action = actionAt(node, side, slot);
    return action.type === "move" ? action.value : "";
}

/*
 * The opposing slot this one is attacking, or null for "whoever is across".
 * Null rather than a number by default, so a plan that never says anything about
 * targeting behaves exactly as it did before aiming existed.
 */
function aimAt(node, side, slot) {
    var aim = node && node.aimedAt && node.aimedAt[side];
    var chosen = aim && aim[slot];
    return chosen === undefined ? null : chosen;
}

// How many slots a fight actually uses, so singles stay single.
function slotCount(line) {
    return battleFormat(line.trainer).slots;
}

/*
 * In a tag battle your second slot belongs to an ally you don't command. Its
 * Pokemon come from that trainer's party in the game data, not from your Box,
 * so anything reading a slot has to know which of the two it is looking at.
 */
function isPartnerSlot(line, side, slot) {
    return side === "you" && slot === 1 && battleFormat(line.trainer).id === "tag";
}

// The trainer whose party fills a given slot, or "" for your own Box.
function trainerForSlot(line, side, slot) {
    var format = battleFormat(line.trainer);
    if (side === "you") return isPartnerSlot(line, side, slot) ? format.partner : "";
    return format.trainers[Math.min(slot, format.trainers.length - 1)];
}

// A set belonging to a named trainer, for slots that aren't yours.
function trainerSet(trainerName, speciesName) {
    if (!trainerName || !speciesName) return null;
    var sets = GAME.setdex()[speciesName];
    return sets ? sets[trainerName] || null : null;
}

/*
 * The set for a particular opposing Pokemon. In a two-trainer fight the slots
 * belong to different trainers, so each is looked up against whichever of them
 * actually owns it.
 */
function foeSetFor(line, node, speciesName) {
    if (!speciesName) return null;
    var sets = GAME.setdex()[speciesName];
    if (!sets) return null;
    var trainers = battleFormat(line.trainer).trainers || [line.trainer];
    for (var i = 0; i < trainers.length; i++) {
        if (sets[trainers[i]]) return sets[trainers[i]];
    }
    return null;
}

/*
 * A status pinned onto this turn, either naming one carried in or saying that
 * whatever was there ends here.
 *
 * Sleep is the reason the second option exists: its duration is random and not
 * in the game data, so there is no honest number to expire it on. The counter
 * shows how long it has run and the player says when it broke.
 *
 * Applied to slot one, which is the Pokemon a seed is nearly always about.
 */
function applyStatusSeed(line, node, state) {
    if (!node) return state;
    ["you", "them"].forEach(function(side) {
    // Every slot, not just the first - a double has two Pokemon out per side
    // and both can walk in statused, boosted or confused.
    for (var slot = 0; slot < 2; slot++) {
        var who = monAt(node, side, slot);
        if (!who) continue;
        var seed = seedFor(node, "statusSeed", side, slot, "");
        var add = seedFor(node, "volatileSeed", side, slot, []);
        var clear = seedFor(node, "volatileClear", side, slot, []);
        var boosts = seedFor(node, "boostSeed", side, slot, {});
        var statedHp = seedFor(node, "hpSeed", side, slot, null);
        var hasBoosts = Object.keys(boosts).some(function(s) { return boosts[s]; });
        if (!seed && !add.length && !clear.length && !hasBoosts && statedHp === null) continue;
        var mon = monState(state, side, who);

        /*
         * A stated health collapses the range to a point - which is the whole
         * reason to state one. It is applied before anything else so a line that
         * opens mid-fight can set the scene in one place.
         */
        if (statedHp !== null) {
            var record = ensureHp(line, node, state, side, slot);
            if (record) {
                var points = Math.round(record.hp.full * Math.max(0, Math.min(100, statedHp)) / 100);
                record.hp.min = points;
                record.hp.max = points;
            }
        }

        /*
         * Through addBoosts so the +-6 ceiling still applies. No ability guard
         * passed: this is you stating what happened, not an opponent trying to
         * inflict it, so a Clear Body shouldn't refuse your own correction.
         */
        if (hasBoosts) addBoosts(mon.boosts, boosts);

        /*
         * "Ends on this turn" is about the non-volatile status and nothing else.
         * Volatiles run on their own schedules - an Encore expiring has nothing
         * to do with a sleep breaking - so each is turned off individually
         * rather than being swept away alongside the status.
         */
        if (seed === STATUS_CURED) {
            mon.status = "";
            mon.statusTurns = 0;
        } else if (seed) {
            mon.status = seed;
            mon.statusTurns = 0;
        }

        clear.forEach(function(id) { delete mon.volatiles[id]; });
        add.forEach(function(id) {
            if (VOLATILES[id]) mon.volatiles[id] = true;
        });
    }
    });
    return state;
}

/*
 * One slot's entry out of a per-slot seed. Tolerates the old per-side shape so
 * a line saved before the doubles fix still reads, in case one arrives from an
 * export rather than through loadLines' migration.
 */
function seedFor(node, field, side, slot, fallback) {
    var seed = node[field] && node[field][side];
    if (seed === undefined || seed === null) return fallback;
    if (!Array.isArray(seed)) return slot === 0 ? seed : fallback;
    // Per-slot arrays hold one entry per slot; the legacy volatile shape held ids.
    if (field === "statusSeed" || field === "boostSeed" || field === "hpSeed") {
        // Not `|| fallback`: a stated HP of 0 is a real answer, meaning fainted.
        return seed[slot] === undefined || seed[slot] === null ? fallback : seed[slot];
    }
    return Array.isArray(seed[0]) || seed.length === 0
        ? (seed[slot] || fallback)
        : (slot === 0 ? seed : fallback);
}

// The species in a slot, whichever roster it came from.
function speciesAt(line, node, side, slot) {
    var ref = monAt(node, side, slot);
    if (!ref) return null;
    if (side === "you" && !isPartnerSlot(line, side, slot)) {
        var entry = boxEntry(ref);
        return entry ? GAME.species()[toID(entry.species)] : null;
    }
    return GAME.species()[toID(ref)] || null;
}

/*
 * A grounded Poison type soaks Toxic Spikes up as it lands, clearing them for
 * good. Worth modelling because it is the only hazard removal in this game that
 * isn't a move - Rapid Spin doesn't exist here and Defog costs a turn - so it is
 * easy to plan around a layer that your own switch quietly deleted.
 *
 * Flying types and Levitate never touch the ground, so they neither absorb the
 * spikes nor are poisoned by them.
 */
function absorbToxicSpikes(line, node, state, side, slot) {
    if (!state[side].hazards.toxicSpikes) return;
    var species = speciesAt(line, node, side, slot);
    if (!species || !species.types) return;
    if (species.types.indexOf("poison") < 0) return;

    if (isGrounded(line, node, side, slot)) delete state[side].hazards.toxicSpikes;
}

/*
 * Whether a Pokemon is standing on the ground, which is what decides whether the
 * two spike layers reach it at all. Flying types and Levitate float over both.
 */
function isGrounded(line, node, side, slot) {
    var species = speciesAt(line, node, side, slot);
    if (!species || !species.types) return false;
    if (species.types.indexOf("flying") >= 0) return false;
    var holder = activeHolder(line, node, side, slot);
    return toID((holder && holder.ability) || "") !== "levitate";
}

/*
 * What a Pokemon walks into. Straight from the moves' own text:
 *
 *   Stealth Rock  1/8 of max HP, "affected by its defensive matchup against the
 *                 Rock type" - so a quarter of it for a Steel type and half its
 *                 health for a Charizard.
 *   Spikes        1/8, 1/6 or 1/4 by layer count, grounded Pokemon only.
 *   Toxic Spikes  poison for one layer, badly poisoned for two.
 *
 * The Toxic Spikes half is the one that had never done anything: the layers were
 * tracked, displayed and removable, but nothing was ever actually poisoned by
 * walking into them.
 */
const SPIKES_DENOMINATOR = [8, 6, 4];
const STEALTH_ROCK_DENOMINATOR = 8;

function applyEntryHazards(line, node, state, side, slot) {
    var ref = monAt(node, side, slot);
    if (!ref) return;
    var hazards = state[side].hazards;
    if (!hazards.isSR && !hazards.spikes && !hazards.toxicSpikes) return;

    var species = speciesAt(line, node, side, slot);
    var types = (species && species.types) || [];
    var holder = activeHolder(line, node, side, slot);
    var ability = toID((holder && holder.ability) || "");
    var grounded = isGrounded(line, node, side, slot);
    var mon = monState(state, side, ref);

    /*
     * Magic Guard turns all of this off - it takes no damage it wasn't dealt
     * directly. It does not stop Toxic Spikes, which poison rather than hurt.
     */
    if (hazards.isSR && ability !== "magicguard") {
        var record = ensureHp(line, node, state, side, slot);
        if (record) {
            /*
             * Rock's effectiveness against whatever walked in, from the same
             * table the damage calculator uses so the two can't disagree.
             */
            var chart = (typeof calc !== "undefined" && calc.TYPE_CHART && calc.TYPE_CHART[GAME.gen])
                ? calc.TYPE_CHART[GAME.gen].Rock : null;
            var multiplier = 1;
            if (chart) {
                types.forEach(function(t) {
                    var key = t.charAt(0).toUpperCase() + t.slice(1);
                    if (chart[key] !== undefined) multiplier *= chart[key];
                });
            }
            var rocks = Math.floor(record.hp.full * multiplier / STEALTH_ROCK_DENOMINATOR);
            if (rocks > 0) damageMon(record, rocks, rocks, record.hp.full);
        }
    }

    if (hazards.spikes && grounded && ability !== "magicguard") {
        var spiked = ensureHp(line, node, state, side, slot);
        if (spiked) {
            var layers = Math.min(hazards.spikes, SPIKES_DENOMINATOR.length);
            var hit = Math.floor(spiked.hp.full / SPIKES_DENOMINATOR[layers - 1]);
            if (hit > 0) damageMon(spiked, hit, hit, spiked.hp.full);
        }
    }

    /*
     * Toxic Spikes last, and only onto something already standing in them: a
     * grounded Poison type has soaked them up by now and never gets poisoned.
     * Steel types are immune to poison outright.
     */
    if (hazards.toxicSpikes && grounded && !mon.status &&
        types.indexOf("steel") < 0 && types.indexOf("poison") < 0 &&
        !abilityBlocksStatus(holder, hazards.toxicSpikes >= 2 ? "tox" : "psn", "", state)) {
        var status = hazards.toxicSpikes >= 2 ? "tox" : "psn";
        if (!tryCureWithItem(state, side, holder, status)) {
            mon.status = status;
            mon.statusTurns = 0;
            mon.toxicTicks = 0;
        }
    }
}

/*
 * Why a slot can't switch out, or null if it can.
 *
 * Move-trapping is recorded on the Pokemon, because it follows it. Ability
 * trapping is derived from whoever is standing opposite instead of stored,
 * because it ends the instant that Pokemon leaves the field - storing it would
 * mean remembering to unstore it in every path that changes a slot.
 */
function trapReason(line, node, state, side, slot) {
    var ref = monAt(node, side, slot);
    if (!ref) return null;

    var mon = monState(state, side, ref);
    if (mon.trapped) {
        return mon.trapped.expires
            ? {kind: "move", expires: true, turns: mon.trapped.turns || 0, guaranteed: mon.trapped.guaranteed}
            : {kind: "move", expires: false, self: !!mon.trapped.self};
    }

    var species = speciesAt(line, node, side, slot);
    if (!species || !species.types) return null;
    var holderAbility = activeHolder(line, node, side, slot);
    var levitates = toID(holderAbility && holderAbility.ability || "") === "levitate";

    var other = side === "you" ? "them" : "you";
    for (var i = 0; i < slotCount(line); i++) {
        var opponent = activeHolder(line, node, other, i);
        var fx = abilityEffect(opponent && opponent.ability);
        if (!fx || !fx.traps) continue;

        var caught = fx.traps === "all" ||
            (fx.traps === "steel" && species.types.indexOf("steel") >= 0) ||
            (fx.traps === "grounded" && species.types.indexOf("flying") < 0 && !levitates);
        if (caught) return {kind: "ability", by: fx.name, expires: false};
    }
    return null;
}

/*
 * What an ability does the moment its Pokemon lands: Intimidate drops the
 * Attack of everything opposite it, the weather abilities set the field.
 */
function applySwitchInAbility(line, node, state, side, slot) {
    /*
     * Absorption first, then what is left bites: a grounded Poison type clears
     * the Toxic Spikes as it lands and so is never poisoned by them.
     */
    absorbToxicSpikes(line, node, state, side, slot);
    applyEntryHazards(line, node, state, side, slot);
    var holder = activeHolder(line, node, side, slot);
    var fx = abilityEffect(holder && holder.ability);
    if (!fx || !fx.onSwitchIn) return;
    if (fx.onSwitchIn.weather) {
        state.weather = fx.onSwitchIn.weather;
        state.weatherSource = "ability";
    }
    if (!fx.onSwitchIn.opponentBoosts) return;

    // Intimidate hits every opposing slot, not just the one across from it.
    var otherSide = side === "you" ? "them" : "you";
    for (var i = 0; i < 2; i++) {
        var ref = monAt(node, otherSide, i);
        if (!ref) continue;
        var guard = abilityEffect((activeHolder(line, node, otherSide, i) || {}).ability);
        addBoosts(monState(state, otherSide, ref).boosts, fx.onSwitchIn.opponentBoosts, guard);
    }
}

/*
 * Which opposing slots a move lands on.
 *
 * Only genuine spread moves reach both. Everything else hits one, and *which*
 * one is a choice: in a 2v2 every position is adjacent to every other, so either
 * of your Pokemon can attack either of theirs. There is no "far" slot to be out
 * of reach - that only exists in triples. Focusing both of your attackers onto
 * one of their Pokemon is most of what makes a double a double, and pinning each
 * slot to the one across from it would rule that out entirely.
 *
 * `aim` is the stated choice, and it falls back to the slot across whenever
 * nothing was said or nobody is standing where it points.
 */
function targetsOf(node, actorSide, slot, moveName, aim) {
    var otherSide = actorSide === "you" ? "them" : "you";
    var move = findMove(moveName);
    var spread = move && /allAdjacentFoes|allAdjacent/i.test(move.target || "");
    if (spread) return [0, 1];
    if (aim !== null && aim !== undefined && monAt(node, otherSide, aim)) return [aim];
    if (monAt(node, otherSide, slot)) return [slot];
    return monAt(node, otherSide, 0) ? [0] : [1];
}

/*
 * A Pokemon leaving the field loses its boosts and volatiles. Natural Cure
 * takes its status with it too; otherwise the status waits for its return.
 */
function leaveField(line, parent, state, side, slot) {
    var ref = monAt(parent, side, slot);
    if (!ref) return;
    var mon = monState(state, side, ref);
    mon.boosts = {};
    mon.volatiles = {};
    mon.volatileTurns = {};
    // Coming back in is a fresh arrival, so Fake Out works again.
    mon.turnsActive = 0;
    // "unless they switch out" - leaving the field is the whole counterplay.
    mon.perish = 0;
    mon.perishDone = false;
    // Whatever was holding it isn't holding it any more.
    mon.trapped = null;
    /*
     * Badly poisoned damage ramps with a counter, and that counter - unlike the
     * status - resets when the Pokemon leaves the field, resuming at 1/16 when
     * it comes back. Sleep's count deliberately does not reset here: it carries
     * across a switch in this generation.
     */
    if (mon.status === "tox") {
        mon.statusTurns = 0;
        // The ramp restarts at 1/16 on the way back in - the point of the reset.
        mon.toxicTicks = 0;
    }
    var holder = activeHolder(line, parent, side, slot);
    var fx = abilityEffect(holder && holder.ability);
    if (fx && fx.curesOnSwitchOut) {
        mon.status = "";
        mon.statusTurns = 0;
    }
}

/*
 * Folds one turn into the running state, then hands over to the next.
 *
 * Ordering is the whole point. A switch resolves before any move does and costs
 * that slot its turn, so whoever comes in is the one that takes the other
 * side's attack. Every slot decides independently.
 *
 * Boosts and volatiles are cleared when a Pokemon leaves the field; its status
 * stays with it, because the record is the Pokemon's rather than the slot's.
 */
function applyTurn(line, parent, node, state, condition) {
    if (!parent) return state;
    var slots = slotCount(line);
    // Which side's move the branch says landed a critical hit, if either.
    var crits = critSides(condition);

    function eachSlot(fn) {
        ["you", "them"].forEach(function(side) {
            for (var i = 0; i < slots; i++) fn(side, i);
        });
    }

    // Declared switches happen first, so the newcomer is what gets hit.
    eachSlot(function(side, i) {
        if (!switchTargetAt(parent, side, i)) return;
        leaveField(line, parent, state, side, i);
        applySwitchInAbility(line, node, state, side, i);
    });

    // A status that survived the turn has been there one turn longer.
    eachSlot(function(side, i) {
        var ref = monAt(parent, side, i);
        if (!ref) return;
        var mon = monState(state, side, ref);
        if (!mon.status) return;
        mon.statusTurns = (mon.statusTurns || 0) + 1;
        // Four turns is the ceiling, so this wake needs no branch to express.
        if (mon.status === "slp" && mon.statusTurns >= SLEEP_MAX_TURNS) {
            mon.status = "";
            mon.statusTurns = 0;
        }
    });

    /*
     * Volatiles with a known ceiling age the same way and end when they hit it.
     * The ones without simply never tick, so nothing here can expire them.
     */
    eachSlot(function(side, i) {
        var ref = monAt(parent, side, i);
        if (!ref) return;
        var mon = monState(state, side, ref);
        if (!mon.volatileTurns) mon.volatileTurns = {};
        for (var id in mon.volatiles) {
            if (!mon.volatiles[id] || !VOLATILES[id] || !VOLATILES[id].maxTurns) continue;
            mon.volatileTurns[id] = (mon.volatileTurns[id] || 0) + 1;
            if (mon.volatileTurns[id] >= VOLATILES[id].maxTurns) {
                delete mon.volatiles[id];
                delete mon.volatileTurns[id];
            }
        }
    });

    /*
     * Perish ticks *before* the moves, unlike the screens below, because the two
     * count differently. A screen's five turns include the one it was cast on,
     * so that turn consumes a tick. Perish Song instead sets its count at the
     * end of the turn it is sung - the count still reads 3 on the turn after -
     * so the singing turn must not consume one.
     *
     * At zero the Pokemon faints. The slot is left filled rather than emptied,
     * so the plan still records what was out when it happened.
     */
    eachSlot(function(side, i) {
        var ref = monAt(parent, side, i);
        if (!ref) return;
        var mon = monState(state, side, ref);
        if (mon.perish > 0) {
            mon.perish -= 1;
            // Tells "never heard the song" apart from "the count just ran out".
            if (mon.perish === 0) mon.perishDone = true;
        }

        /*
         * A binding move that survived the turn has held one turn longer. Only
         * a Grip Claw's fixed 5 is released automatically; a 2-5 trap is never
         * ended on the planner's say-so, for the same reason a sleep isn't -
         * branch the early break instead of inventing a floor.
         */
        if (mon.trapped && mon.trapped.expires) {
            mon.trapped.turns = (mon.trapped.turns || 0) + 1;
            // Five turns is the ceiling with or without a Grip Claw.
            if (mon.trapped.turns >= TRAP_MAX_TURNS) mon.trapped = null;
        }
    });


    /*
     * Who is actually standing in each slot when the moves land. A slot that
     * switched has already been replaced, so anything aimed at it hits the
     * Pokemon that just came in - which is the free hit a switch pays for.
     */
    var onField = {
        mons: [0, 1].map(function(i) {
            return switchTargetAt(parent, "you", i)
                ? (monAt(node, "you", i) || switchTargetAt(parent, "you", i))
                : monAt(parent, "you", i);
        }),
        foes: [0, 1].map(function(i) {
            return switchTargetAt(parent, "them", i)
                ? (monAt(node, "them", i) || switchTargetAt(parent, "them", i))
                : monAt(parent, "them", i);
        })
    };

    /*
     * Who was already gone before a single move went off this turn, kept apart
     * from the deaths that happen during it. The two mean different things: this
     * lot never act at all, whereas something killed mid-turn only loses its move
     * if whatever killed it was genuinely faster - which resolveMoves works out
     * from the turn order rather than from the order of a loop.
     */
    var alreadyGone = {you: [], them: []};
    eachSlot(function(side, i) {
        alreadyGone[side][i] = isFainted(monState(state, side, monAt(onField, side, i)));
    });

    // Then the moves, fastest first, of whichever slots did not switch.
    resolveMoves(line, parent, onField, state, crits, alreadyGone, slots);

    /*
     * Roost's type change lasted exactly this turn, so it goes no further. Wiped
     * after the moves have all resolved, which is the window it covers.
     */
    state.losesType = null;

    /*
     * A turn on which a Pokemon had the chance to act. The slot that switched is
     * skipped: it spent the turn arriving and never got to move, which is why a
     * Pokemon can still Fake Out on the turn *after* it comes in.
     */
    eachSlot(function(side, i) {
        if (switchTargetAt(parent, side, i)) return;
        var ref = monAt(onField, side, i);
        if (!ref) return;
        var mon = monState(state, side, ref);
        mon.turnsActive = (mon.turnsActive || 0) + 1;
    });

    /*
     * Screens burn a turn each time one passes, and vanish at zero.
     *
     * After the moves, not before: the five turns include the one the screen was
     * set on, so putting Reflect up on turn 1 covers turns 1-5 and it is gone by
     * turn 6. Ticking first would have quietly bought an extra turn of it.
     */
    ["you", "them"].forEach(function(side) {
        var hazards = state[side].hazards;
        for (var field in TIMED_SIDE) {
            if (!hazards[field]) continue;
            hazards[field] -= 1;
            if (hazards[field] <= 0) delete hazards[field];
        }
    });


    /*
     * Then everything the turn takes off without anybody choosing it: weather,
     * status, Leech Seed, and whatever the held item gives back.
     */
    applyResiduals(line, onField, state);

    /*
     * Last, what the branch out of this turn says actually happened - which is
     * the only thing that ever narrows an HP range back down. After the moves and
     * the residuals so it has the turn's full arithmetic to narrow, and before
     * the switches below so a Pokemon that died is recorded as dead rather than
     * as having left the field.
     */
    applyOutcome(condition, state, onField, line);

    // Anything that changed without being declared a switch happens between turns.
    eachSlot(function(side, i) {
        if (switchTargetAt(parent, side, i)) return;
        var was = monAt(parent, side, i);
        var now = monAt(node, side, i);
        if (!now || now === was) return;
        leaveField(line, parent, state, side, i);
        applySwitchInAbility(line, node, state, side, i);
    });
    return state;
}

/*
 * The state a turn inherits, before its own carried-in status and volatiles are
 * folded in. Split out because the turn editor has to tell a volatile that
 * arrived from an earlier turn apart from one this turn adds - which is what
 * lets its toggles turn something off as well as on.
 */
function inheritedState(line, nodeId, seen) {
    var node = line.nodes[nodeId];
    if (!node) return emptyState();
    if (node.stateOverride) {
        return normalizeState(cloneState(node.stateOverride));
    }

    seen = seen || {};
    if (seen[nodeId]) return emptyState();
    seen[nodeId] = true;

    var parents = parentEdges(line, nodeId);
    if (!parents.length) {
        var fresh = emptyState();
        /*
         * Weather the route or the room already had. Applied before the leads,
         * so a Drizzle or Sand Stream Pokemon still overrides it the moment it
         * comes out - which is what happens in game.
         */
        var standing = battleWeather(line.trainer);
        if (standing) {
            fresh.weather = standing;
            fresh.weatherSource = "battle";
        }
        // Whoever leads brings their switch-in ability with them.
        for (var i = 0; i < slotCount(line); i++) {
            applySwitchInAbility(line, node, fresh, "you", i);
            applySwitchInAbility(line, node, fresh, "them", i);
        }
        return fresh;
    }

    var parent = line.nodes[parents[0].from];
    /*
     * Always a copy: the parent's state may be the shared one in STATE_CACHE, and
     * applyTurn mutates whatever it is handed. Owning the copy here is what makes
     * the cache safe to hand out at all.
     */
    var state = normalizeState(cloneState(computeNodeState(line, parents[0].from, seen)));
    if (parents.length > 1) state.ambiguous = true;
    /*
     * The branch that leads here says which way the fight actually went, and that
     * is the only thing that narrows a damage roll back down - so the edge is
     * carried into the turn rather than being purely decorative on the canvas.
     */
    applyTurn(line, parent, node, state, conditionFor(parents[0]));
    return state;
}

/*
 * Every turn's state is a fresh walk back to the root, so drawing a whole line
 * is quadratic in its length. Phase one left that alone - it measured in single
 * figures of milliseconds. Folding damage into every turn changed the sum: each
 * turn now runs a calculation per move, so the same quadratic walk costs whole
 * seconds on a long line.
 *
 * Hence a memo, but a strictly per-render one: renderLine clears it before it
 * draws anything, so an entry never outlives the plan it was computed from and
 * there is no hand invalidation to get wrong. Only complete, top-level results
 * are written; a recursive call carries `seen` and may return a state truncated
 * part-way round a cycle, which is not an answer worth keeping.
 */
var STATE_CACHE = {};

function invalidateNodeStates() {
    STATE_CACHE = {};
}

function computeNodeState(line, nodeId, seen) {
    if (STATE_CACHE[nodeId]) return STATE_CACHE[nodeId];
    var state = applyStatusSeed(line, line.nodes[nodeId], inheritedState(line, nodeId, seen));
    if (!seen) STATE_CACHE[nodeId] = state;
    return state;
}

/*
 * Fills the memo parents-first, so each turn's walk stops at its parent's entry
 * instead of running all the way back to the root.
 *
 * Without this the memo only pays off when turns happen to be stored in the
 * order they were created - which is usual but not guaranteed, and the penalty
 * for the other order is the whole quadratic cost back again. Turns inside a
 * cycle never come up in this ordering and are simply left to the ordinary walk.
 */
function warmNodeStates(line) {
    invalidateNodeStates();
    var pending = {};
    var queue = [];
    Object.keys(line.nodes).forEach(function(id) {
        pending[id] = parentEdges(line, id).length;
        if (!pending[id]) queue.push(id);
    });
    while (queue.length) {
        var id = queue.shift();
        computeNodeState(line, id);
        childEdges(line, id).forEach(function(edge) {
            if (pending[edge.to] === undefined) return;
            pending[edge.to] -= 1;
            if (pending[edge.to] === 0) queue.push(edge.to);
        });
    }
}

/*
 * The state of whichever Pokemon is in a given slot, for rendering. Empty slots
 * get a blank record rather than null so callers do not need to check.
 */
function slotState(line, node, state, side, slot) {
    return monState(state, side, monAt(node, side, slot));
}

function hasState(state) {
    if (state.weather || state.trickRoom) return true;
    var anyPending = ["you", "them"].some(function(side) {
        return ((state[side] || {}).pending || []).some(function(list) {
            return (list || []).length;
        });
    });
    if (anyPending) return true;
    var anyMon = ["you", "them"].some(function(side) {
        return Object.values(state.mons[side] || {}).some(function(mon) {
            return mon.status || Object.keys(mon.boosts).length || Object.keys(mon.volatiles).length;
        });
    });
    if (anyMon) return true;
    return !!(Object.keys(state.you.hazards).length || Object.keys(state.them.hazards).length);
}

/*
 * Whether a non-volatile status on your side is currently locking the opponent
 * out of inflicting one. Only worth pointing out for trainers that actually try
 * - the Harassment flag marks the ones that lead with status and disruption.
 */
function statusBlockActive(line, state) {
    if (!state.you.status) return false;
    var flags = GAME.aiFlags()[line.trainer];
    return !!(flags && flags.Harassment);
}

/* -------------------------------------------------------------- persistence */

function loadLines() {
    try {
        LINES = JSON.parse(localStorage.lines ?? "{}");
    } catch (e) {
        LINES = {};
    }
    // Older lines predate these fields; fill them in rather than guarding reads.
    for (var id in LINES) {
        var line = LINES[id];
        for (var nodeId in line.nodes) {
            var node = line.nodes[nodeId];
            /*
             * Everything used to assume one Pokemon out per side. Older turns
             * carry singular fields, which become slot one of the new arrays.
             */
            if (!node.mons) {
                node.mons = [node.mon || "", ""];
                delete node.mon;
            }
            if (!node.foes) {
                node.foes = [node.foe || "", ""];
                delete node.foe;
            }
            /*
             * Status, stat stages and volatiles were per side, so in a double
             * only the first slot could ever be edited. They are now per slot,
             * in the shape `skipped` already used. The old value becomes slot
             * one, which is where it was being applied anyway.
             */
            if (node.statusSeed && !Array.isArray(node.statusSeed.you)) {
                node.statusSeed = {
                    you: [node.statusSeed.you || "", ""],
                    them: [node.statusSeed.them || "", ""]
                };
            }
            ["volatileSeed", "volatileClear"].forEach(function(field) {
                var seed = node[field];
                // Per-slot shape is an array of arrays; the old one held ids.
                if (!seed || Array.isArray(seed.you && seed.you[0])) return;
                node[field] = {
                    you: [(seed.you || []).slice(), []],
                    them: [(seed.them || []).slice(), []]
                };
            });
            if (node.boostSeed && !Array.isArray(node.boostSeed.you)) {
                node.boostSeed = {
                    you: [node.boostSeed.you || {}, {}],
                    them: [node.boostSeed.them || {}, {}]
                };
            }
            if (!node.actions) {
                node.actions = [node.action || {type: "move", value: ""}, {type: "move", value: ""}];
                delete node.action;
            }
            if (!node.foeActions) {
                var theirs = node.foeAction || {type: "move", value: node.foeMove || ""};
                node.foeActions = [theirs, {type: "move", value: ""}];
                delete node.foeAction;
                delete node.foeMove;
            }
            // Turns saved before HP was carried simply inherit it everywhere.
            if (!node.hpSeed) node.hpSeed = {you: [null, null], them: [null, null]};
            // Turns saved before aiming existed keep hitting the slot across.
            if (!node.aimedAt) node.aimedAt = {you: [null, null], them: [null, null]};
            if (node.stateOverride === undefined) node.stateOverride = null;
            if (node.statusSeed === undefined) node.statusSeed = {you: "", them: ""};
            // Existing turns are already decided, so start them collapsed.
            if (node.movesOpen === undefined) node.movesOpen = false;
            if (node.collapsed === undefined) node.collapsed = false;
        }
        for (var edgeId in line.edges) {
            var edge = line.edges[edgeId];
            if (LEGACY_CONDITIONS[edge.condition]) edge.condition = LEGACY_CONDITIONS[edge.condition];
        }
    }
    return LINES;
}

function saveLines() {
    localStorage.lines = JSON.stringify(LINES);
}

/*
 * Blind mode: plan the fight without being told the answer.
 *
 * The moves go back to showing base power, the health bars and the speed markers
 * go away, and nothing is denied for being outsped and killed - because working
 * out that it *would* be is the part of a Nuzlocke that is actually the game.
 * The same argument the roadmap makes against generated lines applies in
 * miniature to every damage figure on the card: useful, and not always wanted.
 *
 * It switches off the derivation rather than hiding it, which matters. Hiding
 * alone would still leak the numbers back through their consequences - a move
 * struck through tells you it is a guaranteed KO just as plainly as the figure
 * would have.
 *
 * Everything that comes from the *rules* rather than from a calculation stays on:
 * hazards, screens, weather, status, trapping, Perish Song, and Fake Out both
 * flinching and failing. None of those is an answer you were meant to work out.
 */
function blindMode() {
    return localStorage.plannerBlind === "true";
}

function setBlindMode(on) {
    localStorage.plannerBlind = on ? "true" : "false";
}

function addLine(line) {
    LINES[line.id] = line;
    saveLines();
    return line;
}

function deleteLine(id) {
    delete LINES[id];
    saveLines();
}

/*
 * The Box is the roster a line draws from. Stored as {Species: {SetName: set}},
 * flattened here into the "Species (Set)" keys nodes refer to.
 */
/*
 * How a plan refers to one of your Pokémon.
 *
 * The obvious handle - "Species (Nickname)" - changes the moment it evolves, and
 * addToDex deletes the old entry when it re-keys, so every reference to it goes
 * stale. `data.id` is <PID>-<IVs>-<met level>, all fixed for the Pokémon's whole
 * life, and is already what upstream uses to recognise it across an evolution.
 *
 * It's only filled in by the Lua game sync though, so Pokémon entered by hand
 * fall back to the old key. Those still break on evolution - there's nothing
 * stable to hold on to - but nothing regresses.
 */
function monRef(entry) {
    return (entry.set.data && entry.set.data.id) || entry.key;
}

function boxRoster() {
    var customSets = JSON.parse(localStorage.customsets ?? "{}");
    var roster = [];
    for (var speciesName in customSets) {
        for (var setName in customSets[speciesName]) {
            var set = customSets[speciesName][setName];
            var entry = {
                key: `${speciesName} (${setName})`,
                species: speciesName,
                nickname: setName === "Custom Set" ? "" : setName,
                dead: !!(set.data && set.data.dead),
                set: set
            };
            entry.ref = monRef(entry);
            roster.push(entry);
        }
    }
    return roster;
}

// Accepts either form, so plans saved before this existed keep resolving.
function boxEntry(ref) {
    if (!ref) return undefined;
    var roster = boxRoster();
    return roster.find(x => x.ref === ref) || roster.find(x => x.key === ref);
}

/* ------------------------------------------------------------ team vs box */

const TEAM_SIZE = 6;

/*
 * Which of your caught Pokémon are currently being carried. The calculator has
 * a Team/Box split too, but it lives purely in the DOM and resets on reload
 * (everything is appended to #box1), so this keeps its own persisted list.
 *
 * With nothing stored yet, the first few living Pokémon stand in as the team so
 * the strips aren't empty on a first visit.
 */
function teamKeys() {
    var roster = boxRoster();
    var live = roster.filter(x => !x.dead).map(x => x.ref);

    var stored;
    try {
        stored = JSON.parse(localStorage.plannerTeam ?? "null");
    } catch (e) {
        stored = null;
    }

    /*
     * With nothing stored, the first few living Pokémon stand in - but that
     * default is written down straight away rather than recomputed each time.
     * Left unsaved it follows Box order, and evolution re-keys an entry to the
     * end of the Box, which would silently shuffle somebody off the team.
     */
    if (!Array.isArray(stored)) {
        var seeded = live.slice(0, TEAM_SIZE);
        if (seeded.length) saveTeamKeys(seeded);
        return seeded;
    }

    /*
     * Resolved through boxEntry, which accepts the old species+nickname handles
     * as well - so a team saved before refs existed upgrades itself - and drops
     * anything that has since left the Box.
     */
    var resolved = stored
        .map(function(handle) {
            var entry = boxEntry(handle);
            return entry ? entry.ref : null;
        })
        .filter(function(ref) { return ref; })
        .slice(0, TEAM_SIZE);

    /*
     * A stored team where nothing resolves any more means the Box was replaced -
     * a new attempt, say - so seed a fresh one. A team stored as empty is a
     * deliberate choice and is left alone.
     */
    if (stored.length && !resolved.length && live.length) {
        var reseeded = live.slice(0, TEAM_SIZE);
        saveTeamKeys(reseeded);
        return reseeded;
    }
    return resolved;
}

function saveTeamKeys(keys) {
    localStorage.plannerTeam = JSON.stringify(keys.slice(0, TEAM_SIZE));
}

function teamRoster() {
    var refs = teamKeys();
    var roster = boxRoster();
    // Keep the stored order rather than Box order - it's the party order.
    return refs.map(r => roster.find(x => x.ref === r)).filter(x => x);
}

function benchRoster() {
    var onTeam = {};
    teamKeys().forEach(r => { onTeam[r] = true; });
    return boxRoster().filter(x => !onTeam[x.ref]);
}

function addToTeam(key) {
    var keys = teamKeys();
    if (keys.indexOf(key) >= 0) return {ok: true};
    if (keys.length >= TEAM_SIZE) return {ok: false, reason: `A team holds ${TEAM_SIZE}. Move one to the box first.`};
    keys.push(key);
    saveTeamKeys(keys);
    return {ok: true};
}

function removeFromTeam(key) {
    saveTeamKeys(teamKeys().filter(k => k !== key));
}

/*
 * Dropping one Pokémon onto another. From the box it takes that slot and sends
 * the occupant back; from within the team the two trade places, which doubles
 * as a way to reorder the party.
 */
function swapIntoTeam(incoming, targetKey) {
    var keys = teamKeys();
    var target = keys.indexOf(targetKey);
    if (target < 0) return;

    var existing = keys.indexOf(incoming);
    if (existing >= 0) {
        keys[existing] = targetKey;
        keys[target] = incoming;
    } else {
        keys[target] = incoming;
    }
    saveTeamKeys(keys);
}


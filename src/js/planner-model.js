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
        note: "",
        /*
         * Status carried into this turn rather than caused by it - for walking
         * in pre-slept or pre-poisoned so the AI can't land something worse.
         * Applied after inheritance, so setting it on the first turn carries it
         * down the whole line.
         */
        statusSeed: {you: "", them: ""},
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

const VOLATILES = {
    confusion: {id: "confusion", name: "Confused", short: "CNF"}
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
    return {boosts: {}, status: "", statusTurns: 0, volatiles: {}};
}

function emptySide() {
    return {hazards: {}};
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
        ambiguous: false,
        // A curing berry only works once, so spent ones are remembered per Pokémon.
        itemsUsed: {you: {}, them: {}}
    };
}

// Older saved overrides predate these.
function normalizeState(state) {
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
 * Folds one move into the running state. Hazards and stat drops land on the
 * side opposite the user; boosts, screens and weather on their own.
 */
/*
 * What the active Pokémon on a side is holding, and who it is. Your side reads
 * from the Box; theirs from the trainer's set for that fight.
 */
function activeHolder(line, node, side, slot) {
    var ref = monAt(node, side, slot);
    if (!ref) return null;

    // Your own Box, only for slots you actually control.
    if (side === "you" && !isPartnerSlot(line, side, slot)) {
        var entry = boxEntry(ref);
        return entry ? {id: ref, item: entry.set.item, ability: entry.set.ability} : null;
    }

    var set = side === "you"
        ? trainerSet(trainerForSlot(line, side, slot), ref)
        : foeSetFor(line, node, ref);
    return {id: ref, item: set ? set.item : "", ability: set ? set.ability : ""};
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
    var fx = typeof MOVE_EFFECTS === "undefined" ? null : MOVE_EFFECTS[move.id];
    if (!fx) return;

    var otherSide = actor === "you" ? "them" : "you";
    var userHolder = activeHolder(line, node, actor, from);
    var user = monState(state, actor, monAt(node, actor, from));

    if (fx.self) addBoosts(user.boosts, fx.self, abilityEffect(userHolder && userHolder.ability));

    targets.forEach(function(slot) {
        var ref = monAt(node, otherSide, slot);
        if (!ref) return;
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

    // Hazards and screens are the side's, not any one Pokémon's.
    if (fx.hazard) {
        var field = fx.hazard.field;
        state[otherSide].hazards[field] =
            Math.min((state[otherSide].hazards[field] || 0) + 1, fx.hazard.max);
    }
    if (fx.screen) state[actor].hazards[fx.screen] = 1;
    if (fx.weather) state.weather = fx.weather;
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

function moveAt(node, side, slot) {
    var action = actionAt(node, side, slot);
    return action.type === "move" ? action.value : "";
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
function applyStatusSeed(node, state) {
    if (!node || !node.statusSeed) return state;
    ["you", "them"].forEach(function(side) {
        var seed = node.statusSeed[side];
        var who = monAt(node, side, 0);
        if (!seed || !who) return;
        var mon = monState(state, side, who);

        if (seed === STATUS_CURED) {
            mon.status = "";
            mon.statusTurns = 0;
            mon.volatiles = {};
            return;
        }
        mon.status = seed;
        mon.statusTurns = 0;
    });
    return state;
}

/*
 * What an ability does the moment its Pokemon lands: Intimidate drops the
 * Attack of everything opposite it, the weather abilities set the field.
 */
function applySwitchInAbility(line, node, state, side, slot) {
    var holder = activeHolder(line, node, side, slot);
    var fx = abilityEffect(holder && holder.ability);
    if (!fx || !fx.onSwitchIn) return;
    if (fx.onSwitchIn.weather) state.weather = fx.onSwitchIn.weather;
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
 * Which opposing slots a move lands on. Only genuine spread moves reach both;
 * everything else hits the slot across from the user, falling back to whoever
 * is actually there.
 */
function targetsOf(node, actorSide, slot, moveName) {
    var otherSide = actorSide === "you" ? "them" : "you";
    var move = findMove(moveName);
    var spread = move && /allAdjacentFoes|allAdjacent/i.test(move.target || "");
    if (spread) return [0, 1];
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
function applyTurn(line, parent, node, state) {
    if (!parent) return state;
    var slots = slotCount(line);

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
        if (mon.status) mon.statusTurns = (mon.statusTurns || 0) + 1;
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

    // Then the moves of whichever slots did not switch.
    eachSlot(function(side, i) {
        if (switchTargetAt(parent, side, i)) return;
        var move = moveAt(parent, side, i);
        if (!move) return;
        applyMoveEffect(move, state, side, i, targetsOf(onField, side, i, move), line, onField);
    });

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

function computeNodeState(line, nodeId, seen) {
    var node = line.nodes[nodeId];
    if (!node) return emptyState();
    if (node.stateOverride) {
        return applyStatusSeed(node, normalizeState(cloneState(node.stateOverride)));
    }

    seen = seen || {};
    if (seen[nodeId]) return emptyState();
    seen[nodeId] = true;

    var parents = parentEdges(line, nodeId);
    if (!parents.length) {
        var fresh = emptyState();
        // Whoever leads brings their switch-in ability with them.
        for (var i = 0; i < slotCount(line); i++) {
            applySwitchInAbility(line, node, fresh, "you", i);
            applySwitchInAbility(line, node, fresh, "them", i);
        }
        return applyStatusSeed(node, fresh);
    }

    var parent = line.nodes[parents[0].from];
    var state = computeNodeState(line, parents[0].from, seen);
    if (parents.length > 1) state.ambiguous = true;
    applyTurn(line, parent, node, state);
    return applyStatusSeed(node, state);
}

/*
 * The state of whichever Pokemon is in a given slot, for rendering. Empty slots
 * get a blank record rather than null so callers do not need to check.
 */
function slotState(line, node, state, side, slot) {
    return monState(state, side, monAt(node, side, slot));
}

function hasState(state) {
    if (state.weather) return true;
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


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
    // A planned trade: let something die to get a free switch-in.
    sac: {id: "sac", name: "Sacrifice", color: "warn", side: "you"},
    theyko: {id: "theyko", name: "They KO you", color: "bad", side: "them"},
    yousurvive: {id: "yousurvive", name: "You survive", color: "good", side: "them"},
    theymiss: {id: "theymiss", name: "They miss", color: "good", side: "them"},
    theycrit: {id: "theycrit", name: "They crit", color: "bad", side: "them"},
    theycritko: {id: "theycritko", name: "They crit KO", color: "bad", side: "them"},
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
        mon: "",
        foe: "",
        action: {type: "move", value: ""},
        foeMove: "",
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

function emptySide() {
    return {boosts: {}, hazards: {}, status: "", volatiles: {}};
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
        weather: "",
        ambiguous: false,
        statusMemory: {you: {}, them: {}}
    };
}

// Older saved overrides predate statusMemory.
function normalizeState(state) {
    if (!state.statusMemory) state.statusMemory = {you: {}, them: {}};
    if (!state.statusMemory.you) state.statusMemory.you = {};
    if (!state.statusMemory.them) state.statusMemory.them = {};
    return state;
}

function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}

function addBoosts(target, boosts) {
    for (var stat in boosts) {
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
function applyMoveEffect(moveName, state, actor) {
    var move = findMove(moveName);
    if (!move) return;
    var fx = typeof MOVE_EFFECTS === "undefined" ? null : MOVE_EFFECTS[move.id];
    if (!fx) return;

    var own = actor === "you" ? state.you : state.them;
    var other = actor === "you" ? state.them : state.you;

    if (fx.self) addBoosts(own.boosts, fx.self);
    if (fx.target) addBoosts(other.boosts, fx.target);

    // A side that already has a non-volatile status can't take another - this is
    // the mechanic behind pre-statusing your own Pokémon to lock out worse ones.
    if (fx.selfStatus && !own.status) own.status = fx.selfStatus;
    if (fx.targetStatus && !other.status) other.status = fx.targetStatus;
    if (fx.targetVolatiles) {
        fx.targetVolatiles.forEach(function(v) { other.volatiles[v] = true; });
    }

    if (fx.hazard) {
        var field = fx.hazard.field;
        other.hazards[field] = Math.min((other.hazards[field] || 0) + 1, fx.hazard.max);
    }
    if (fx.screen) own.hazards[fx.screen] = 1;
    if (fx.weather) state.weather = fx.weather;
}

function applyNodeActions(node, state) {
    if (!node) return;
    if (node.action && node.action.type === "move") applyMoveEffect(node.action.value, state, "you");
    if (node.foeMove) applyMoveEffect(node.foeMove, state, "them");
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
// A status carried into the turn overrides whatever was inherited.
function applyStatusSeed(node, state) {
    if (!node || !node.statusSeed) return state;
    if (node.statusSeed.you) {
        state.you.status = node.statusSeed.you;
        if (node.mon) state.statusMemory.you[node.mon] = node.statusSeed.you;
    }
    if (node.statusSeed.them) {
        state.them.status = node.statusSeed.them;
        if (node.foe) state.statusMemory.them[node.foe] = node.statusSeed.them;
    }
    return state;
}

/*
 * Carries state across the gap between two turns. Whatever was out has its
 * status filed away; if something else is out now, it arrives with a clean set
 * of boosts and volatiles and whatever status it was last known to have.
 */
function applySwitchIn(parent, node, state) {
    [["you", "mon"], ["them", "foe"]].forEach(function(pair) {
        var side = pair[0];
        var was = parent ? parent[pair[1]] : "";
        var now = node[pair[1]];

        if (was) state.statusMemory[side][was] = state[side].status;
        // An unset slot means "unchanged" rather than "empty", so leave it be.
        if (!now || now === was) return;

        state[side].boosts = {};
        state[side].volatiles = {};
        state[side].status = state.statusMemory[side][now] || "";
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
    if (!parents.length) return applyStatusSeed(node, emptyState());

    var parent = line.nodes[parents[0].from];
    var state = computeNodeState(line, parents[0].from, seen);
    if (parents.length > 1) state.ambiguous = true;
    applyNodeActions(parent, state);
    // Between the two turns, whatever changed sides gets swapped over.
    applySwitchIn(parent, node, state);
    return applyStatusSeed(node, state);
}

function hasState(state) {
    return !!(state.weather ||
        state.you.status || state.them.status ||
        Object.keys(state.you.volatiles).length || Object.keys(state.them.volatiles).length ||
        Object.keys(state.you.boosts).length || Object.keys(state.you.hazards).length ||
        Object.keys(state.them.boosts).length || Object.keys(state.them.hazards).length);
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
            if (node.foeMove === undefined) node.foeMove = "";
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
function boxRoster() {
    var customSets = JSON.parse(localStorage.customsets ?? "{}");
    var roster = [];
    for (var speciesName in customSets) {
        for (var setName in customSets[speciesName]) {
            var set = customSets[speciesName][setName];
            roster.push({
                key: `${speciesName} (${setName})`,
                species: speciesName,
                nickname: setName === "Custom Set" ? "" : setName,
                dead: !!(set.data && set.data.dead),
                set: set
            });
        }
    }
    return roster;
}

function boxEntry(key) {
    return boxRoster().find(x => x.key === key);
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
    var live = roster.filter(x => !x.dead).map(x => x.key);

    var stored;
    try {
        stored = JSON.parse(localStorage.plannerTeam ?? "null");
    } catch (e) {
        stored = null;
    }
    if (!Array.isArray(stored)) return live.slice(0, TEAM_SIZE);

    // Drop anything that has since been deleted from the Box.
    var known = {};
    roster.forEach(x => { known[x.key] = true; });
    return stored.filter(k => known[k]).slice(0, TEAM_SIZE);
}

function saveTeamKeys(keys) {
    localStorage.plannerTeam = JSON.stringify(keys.slice(0, TEAM_SIZE));
}

function teamRoster() {
    var keys = teamKeys();
    var roster = boxRoster();
    // Keep the stored order rather than Box order - it's the party order.
    return keys.map(k => roster.find(x => x.key === k)).filter(x => x);
}

function benchRoster() {
    var onTeam = {};
    teamKeys().forEach(k => { onTeam[k] = true; });
    return boxRoster().filter(x => !onTeam[x.key]);
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

// The enemy set for a node, which is where their moves and level come from.
function foeSet(line, node) {
    if (!node.foe) return null;
    var sets = GAME.setdex()[node.foe];
    return sets ? sets[line.trainer] || null : null;
}

/*
 * One-off authoring tool: derives the persistent-state effects of moves (stat
 * boosts, hazards, weather) from their effect text, so the planner can carry
 * that state down a line. Output is committed as static data and hand-checked;
 * this is deliberately not run at runtime.
 *
 * Usage: node tools/gen-move-effects.js   (from the repository root)
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "pkcalc-effects-"));

function load(file, globalName) {
    var src = fs.readFileSync(path.join(ROOT, file), "utf8");
    src = src.replace(new RegExp("^const " + globalName + "\\s*="), "module.exports=");
    var tmp = path.join(SCRATCH, globalName + "_mod.js");
    fs.writeFileSync(tmp, src);
    return require(tmp);
}

const MOVES = load("src/js/data/dex/moves.js", "MOVES");

const STAT_NAMES = {
    "Attack": "atk",
    "Defense": "def",
    "Special Attack": "spa",
    "Special Defense": "spd",
    "Speed": "spe",
    "Accuracy": "acc",
    "Evasion": "eva"
};

// Longest first, so "Special Attack" wins over "Attack".
const STAT_PATTERN = Object.keys(STAT_NAMES).sort((a, b) => b.length - a.length).join("|");

function stripTags(text) {
    return (text || "").replace(/<[^>]+>/g, "");
}

const DIRECTIONS = {
    // Swords Dance, Rock Polish, ...
    self: {verb: "Increases the user's", sign: 1},
    // Overheat, Draco Meteor - though Platinum Kaizo strips most of these.
    selfDrop: {verb: "Decreases the user's", sign: -1},
    // Growl, Screech, ...
    targetDrop: {verb: "Decreases the target's", sign: -1},
    // Swagger and Flatter buff the target on purpose, in exchange for confusion.
    targetBoost: {verb: "Increases the target's", sign: 1}
};

/*
 * Damaging moves describe their stat changes as a chance rather than a plain
 * statement, and a "100% chance" is simply guaranteed - that's how Charge Beam,
 * Icy Wind, Rock Tomb, Mud Shot and Bulldoze are written. Rewriting those into
 * the declarative form lets one parser handle both. Anything under 100% is left
 * alone on purpose: a 10% drop is not state you can plan around.
 */
function normalizeEffect(effect) {
    return effect
        .replace(/Has a 100% chance to increase the user's/gi, "Increases the user's")
        .replace(/Has a 100% chance to decrease the user's/gi, "Decreases the user's")
        .replace(/Has a 100% chance to increase the target's/gi, "Increases the target's")
        .replace(/Has a 100% chance to decrease the target's/gi, "Decreases the target's")
        .replace(/Has a 100% chance to paralyze the target/gi, "Paralyzes the target")
        .replace(/Has a 100% chance to burn the target/gi, "Burns the target")
        .replace(/Has a 100% chance to poison the target/gi, "Poisons the target")
        .replace(/Has a 100% chance to freeze the target/gi, "Freezes the target")
        .replace(/Has a 100% chance to confuse the target/gi, "Confuses the target");
}

/*
 * Only guaranteed status counts. A 30% burn chance isn't something a line can
 * be planned around, and more importantly it must not be treated as blocking a
 * later status - which is the whole point of tracking this.
 */
const TARGET_STATUS = [
    [/Causes the target to fall asleep/i, "slp"],
    [/Badly poisons the target/i, "tox"],
    [/\bPoisons the target/i, "psn"],
    [/\bParalyzes the target/i, "par"],
    [/\bBurns the target/i, "brn"],
    [/\bFreezes the target/i, "frz"]
];

function parseStatus(effect) {
    for (var i = 0; i < TARGET_STATUS.length; i++) {
        if (TARGET_STATUS[i][0].test(effect)) return TARGET_STATUS[i][1];
    }
    return null;
}

// Volatiles sit alongside a non-volatile status rather than replacing it.
function parseVolatiles(effect) {
    var volatiles = [];
    if (/Confuses the target|and confuses it/i.test(effect)) volatiles.push("confusion");
    return volatiles.length ? volatiles : null;
}

function parseBoosts(effect, who) {
    var verb = DIRECTIONS[who].verb;
    var sign = DIRECTIONS[who].sign;
    var boosts = {};

    // "Increases the user's Attack and Defense stats by 1 stage each"
    var multi = new RegExp(verb + " (" + STAT_PATTERN + ") and (" + STAT_PATTERN + ") stats by (\\d+) stages? each", "g");
    var m;
    while ((m = multi.exec(effect))) {
        boosts[STAT_NAMES[m[1]]] = sign * parseInt(m[3], 10);
        boosts[STAT_NAMES[m[2]]] = sign * parseInt(m[3], 10);
    }

    // "Increases the user's Attack stat by 2 stages" / "... Accuracy by 1 stage"
    var single = new RegExp(verb + " (" + STAT_PATTERN + ")(?: stat)? by (\\d+) stages?", "g");
    while ((m = single.exec(effect))) {
        if (boosts[STAT_NAMES[m[1]]] === undefined) {
            boosts[STAT_NAMES[m[1]]] = sign * parseInt(m[2], 10);
        }
    }

    return Object.keys(boosts).length ? boosts : null;
}

const HAZARD_FIELDS = {
    stealthrock: {field: "isSR", max: 1},
    spikes: {field: "spikes", max: 3},
    toxicspikes: {field: "toxicSpikes", max: 2}
};

const WEATHER = {
    sunnyday: "Sun",
    raindance: "Rain",
    sandstorm: "Sand",
    hail: "Hail"
};

const SCREENS = {
    reflect: "isReflect",
    lightscreen: "isLightScreen"
};

/*
 * Moves whose effect text doesn't reduce to a fixed boost table. Curse is the
 * one that matters in practice - it's conditional on the user's type, and the
 * non-Ghost branch is a real setup move (Roark's Shuckle runs it).
 */
const MANUAL = {
    curse: {
        self: {atk: 1, def: 1, spe: -1},
        conditional: "Only for non-Ghost users; a Ghost-type Curse trades HP for a slow status effect instead."
    },
    // Phrased around the user rather than a target, and the main way to put a
    // status on your own Pokémon deliberately.
    rest: {
        selfStatus: "slp",
        conditional: "Sleeps for 2 turns. Also the usual way to block a worse status on purpose."
    }
};

// Effects that are genuinely unmodellable as static state, recorded so the
// hand-check doesn't keep rediscovering them.
const KNOWN_UNMODELLED = ["focusenergy", "acupressure", "powerswap", "guardswap"];

var effects = {};
var unparsedSetup = [];

Object.values(MOVES).forEach(function(move) {
    var effect = normalizeEffect(stripTags(move.effect));
    var entry = {};

    var selfBoosts = parseBoosts(effect, "self");
    var selfDrops = parseBoosts(effect, "selfDrop");
    var self = Object.assign({}, selfBoosts || {}, selfDrops || {});
    if (Object.keys(self).length) entry.self = self;

    var targetDrops = parseBoosts(effect, "targetDrop");
    var targetBoosts = parseBoosts(effect, "targetBoost");
    var target = Object.assign({}, targetDrops || {}, targetBoosts || {});
    if (Object.keys(target).length) entry.target = target;

    var status = parseStatus(effect);
    if (status) entry.targetStatus = status;
    var volatiles = parseVolatiles(effect);
    if (volatiles) entry.targetVolatiles = volatiles;

    /*
     * Hazard removal. Defog is the only route in this game - Rapid Spin is one
     * of the moves Platinum Kaizo deletes - and its own text says it takes the
     * screens with them, which is the gen 4 behaviour.
     */
    if (/clears screens and hazards|removes? (?:all )?(?:screens and )?hazards/i.test(effect)) {
        entry.clearsTarget = true;
    }

    /*
     * Brick Break takes the screens and leaves the hazards standing, so it is a
     * separate effect from Defog's clean sweep - and it is an attack, which
     * makes it the cheap way through a Reflect if you have one.
     */
    if (/breaks? any reflect or light screen|breaks? (?:any |the )?screens?/i.test(effect)) {
        entry.clearsScreens = true;
    }

    /*
     * Perish Song is the only move that counts down to a faint, and it hits
     * everything on the field including its own user - so it is neither a
     * target effect nor a self effect, and gets its own field.
     */
    var perish = /faint in (\d+) turns?/i.exec(effect);
    if (perish) entry.perish = parseInt(perish[1], 10);

    /*
     * Trapping, in two kinds that plan very differently.
     *
     * Mean Look and friends never wear off, so a plan can rely on being stuck.
     * The binding moves run 2-5 turns at random, which is the sleep problem
     * again - no number is a promise - unless a Grip Claw pins it to exactly 5.
     * `expires` is what tells the two apart downstream. Ingrain traps its own
     * user, not the target, so it deliberately doesn't match here.
     */
    if (/prevents the target from switching out or fleeing/i.test(effect)) {
        entry.trapsTarget = {expires: false};
    } else if (/traps the target/i.test(effect)) {
        entry.trapsTarget = {expires: true};
    }

    if (HAZARD_FIELDS[move.id]) entry.hazard = HAZARD_FIELDS[move.id];
    if (WEATHER[move.id]) entry.weather = WEATHER[move.id];
    if (SCREENS[move.id]) entry.screen = SCREENS[move.id];
    if (MANUAL[move.id]) Object.assign(entry, MANUAL[move.id]);

    if (Object.keys(entry).length) {
        entry.name = move.name;
        effects[move.id] = entry;
    } else if (move.category === "status" && KNOWN_UNMODELLED.indexOf(move.id) < 0 &&
               /stat by|stats by|stage/.test(effect)) {
        // Flag anything that talks about stages but didn't parse, so the table
        // can be corrected by hand rather than silently missing entries.
        unparsedSetup.push(move.id + ": " + effect.split(".")[0]);
    }
});

var out = "/*\n" +
    " * Persistent state a move applies - stat boosts, entry hazards, weather,\n" +
    " * screens - used by the planner to carry state down a line.\n" +
    " *\n" +
    " * Generated from move effect text and hand-checked. Regenerate with\n" +
    " * tools/gen-move-effects.js if the move data changes.\n" +
    " */\n" +
    "const MOVE_EFFECTS = " + JSON.stringify(effects, null, 4) + ";\n";

fs.writeFileSync(path.join(ROOT, "src/js/data/move_effects.js"), out);

console.log("entries written:", Object.keys(effects).length);
console.log("  with self boosts:", Object.values(effects).filter(e => e.self).length);
console.log("  with target drops:", Object.values(effects).filter(e => e.target).length);
console.log("  hazards:", Object.values(effects).filter(e => e.hazard).length);
console.log("  weather:", Object.values(effects).filter(e => e.weather).length);
console.log("\nunparsed but stage-related (" + unparsedSetup.length + "):");
unparsedSetup.slice(0, 25).forEach(x => console.log("  " + x.slice(0, 110)));

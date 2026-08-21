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
/*
 * Volatiles a move lands on its target.
 *
 * Encore and Disable name a random duration (4-8 and 4-7 turns), and Encore also
 * ends early if the encored move runs out of PP - two independent exits, neither
 * of them predictable, since PP isn't tracked either. Leech Seed and Torment run
 * until the target switches out.
 *
 * So none of these are auto-expired downstream: a random duration is the sleep
 * problem again, and switching out already clears volatiles. They are plain
 * flags here, ended by hand or by leaving the field.
 */
function parseVolatiles(effect) {
    var volatiles = [];
    if (/Confuses the target|and confuses it/i.test(effect)) volatiles.push("confusion");
    if (/forces the target to use the last move/i.test(effect)) volatiles.push("encore");
    if (/prevents the target from using the last move/i.test(effect)) volatiles.push("disable");
    if (/prevents the target from using the same move twice/i.test(effect)) volatiles.push("torment");
    if (/heals the user by that amount, until the target switches out/i.test(effect)) volatiles.push("leechseed");
    if (/infatuates the target/i.test(effect)) volatiles.push("attract");
    return volatiles.length ? volatiles : null;
}

/*
 * Volatiles a move puts on its own user. Substitute, and the two that quietly
 * hand back a sixteenth of the user's health every turn - which over a long
 * fight is worth more than it looks.
 */
function parseSelfVolatiles(effect, id) {
    var volatiles = [];
    if (/a Substitute is created/i.test(effect)) volatiles.push("substitute");
    if (id === "aquaring") volatiles.push("aquaring");
    if (id === "ingrain") volatiles.push("ingrain");
    return volatiles.length ? volatiles : null;
}

/*
 * Roost is the only move that changes what its user *is* for the rest of the
 * turn: a Flying type stops being one, which is what makes it possible to Roost
 * into a Rock or Electric move and survive it.
 */
function parseSelfLosesType(effect) {
    var m = /it loses that type for the rest of the turn/i.test(effect)
        ? /If the user is a ([A-Za-z]+) type/i.exec(effect)
        : null;
    return m ? m[1].toLowerCase() : null;
}

/*
 * Wish belongs to the *slot* rather than to the Pokemon that used it: it lands
 * at the end of the following turn on whoever is standing there by then, which
 * is the whole trick - Wish, switch, and the arrival is healed on the way in.
 * The amount is half of the *user's* max HP, not the receiver's, so it has to be
 * worked out when the move is used and carried.
 */
const WISH = {
    wish: {delay: 2, fraction: [1, 2]}
};

/*
 * Moves that land on a slot some turns after they are used. Future Sight and
 * Doom Desire are Wish's mirror image - the damage is worked out now, against
 * whoever is standing there now, and arrives two turns later on whatever is
 * standing there by then. Their own text says exactly that.
 *
 * The stored number is *ticks*, not the wording's "turns later", and the two
 * differ by one: the turn the move is used on ends with a tick of its own, which
 * the countdown has to absorb before any of the waiting starts. Wish says "at
 * the end of the next turn" - one turn later - and takes 2 ticks; these say two
 * turns later and take 3.
 */
function parseDelayed(effect) {
    var m = /deals this damage (\d+) turns later to the target's slot/i.exec(effect);
    return m ? {turns: parseInt(m[1], 10) + 1} : null;
}

/*
 * Pain Split levels the two health bars rather than dealing damage, so it is
 * neither an attack nor a heal - it can be either, depending on who is worse off.
 */
function parsePainSplit(effect) {
    return /Sets both the user's and the target's HP to the average/i.test(effect);
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
 * Side conditions that run on a timer but aren't screens - meaning Brick Break
 * doesn't take them and Defog doesn't sweep them away. Tailwind is the only one
 * this game has; it doubles the side's Speed for three turns, which is the base
 * game's duration. Its +5 priority is Kaizo's own change and lives in the move
 * table rather than here.
 */
const SIDE_CONDITIONS = {
    tailwind: {field: "isTailwind", turns: 3}
};

/*
 * Healing a move gives its own user, as a fraction of max HP.
 *
 * "of its total HP" is what separates these from the drain moves, which say "of
 * the damage dealt" - those are worked out from the damage itself and are
 * @smogon/calc's job rather than a fixed number here.
 *
 * Synthesis, Moonlight and Morning Sun are the same 50% except in weather, where
 * they swing to 2/3 in sun and collapse to 1/4 in anything else. That is a real
 * planning decision in a fight that starts in sand, so the weather dependence is
 * flagged rather than flattened to the middle value.
 */
/*
 * Fractions are emitted as [numerator, denominator] rather than a decimal so the
 * arithmetic downstream stays in integers. Two thirds as a double is a hair under
 * two thirds, and `floor(maxHP * 0.666...)` is a rounding bug waiting for the
 * right max HP to come along; `floor(maxHP * 2 / 3)` simply cannot be wrong.
 */
function parseHeal(effect) {
    var m = /Heals the user by (\d+)% of its total HP/i.exec(effect);
    if (!m) return null;
    var percent = parseInt(m[1], 10);
    var heal = {fraction: percent === 100 ? [1, 1] : [percent, 100]};
    if (/Heals 2\/3 in Sun, and 1\/4 in any other weather/i.test(effect)) {
        heal.sun = [2, 3];
        heal.otherWeather = [1, 4];
    }
    return heal;
}

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
    var selfVolatiles = parseSelfVolatiles(effect, move.id);
    if (selfVolatiles) entry.selfVolatiles = selfVolatiles;
    var losesType = parseSelfLosesType(effect);
    if (losesType) entry.selfLosesType = losesType;
    /*
     * Attract only lands between opposite genders. That is knowable rather than
     * random, so it is modelled - but the planner doesn't check it, so the
     * condition is carried as text the way Curse and Rest already do.
     */
    if (volatiles && volatiles.indexOf("attract") >= 0) {
        entry.conditional = "Only lands if the two are of opposite genders.";
    }

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

    // Ingrain roots its own user down instead, and never lets go.
    if (/^Traps the user/i.test(effect)) entry.trapsSelf = {expires: false};

    /*
     * A type the move simply doesn't work on. Leech Seed against a Grass type is
     * the only one in this game, and its own text says so - which the planner was
     * happily ignoring, letting a plan rest on seeding something that can't be.
     */
    var immune = /Fails if the target is an? ([A-Za-z]+) type/i.exec(effect);
    if (immune) entry.failsAgainstType = immune[1].toLowerCase();

    /*
     * Pursuit, and - in this game - Rage, which has been rewritten into a second
     * one of them. Both catch a Pokemon on the way out: the move resolves before
     * the switch, so it hits whoever is *leaving* rather than whoever arrives,
     * and at double power.
     *
     * Worth generating rather than hardcoding precisely because of Rage. The base
     * game's Rage raises Attack when hit and has nothing to do with switching, so
     * a hand-written list built from memory would have carried 74 sets' worth of
     * the wrong move.
     */
    var pursues = /If the target attempts to switch out, this move hits before the switch, and deals (double|triple) the damage/i.exec(effect);
    if (pursues) entry.pursues = {power: /triple/i.test(pursues[1]) ? 3 : 2};

    /*
     * U-turn and Baton Pass, which leave the field as part of their own effect.
     * The switch itself is already expressible - put the newcomer in the next
     * turn and the planner treats it as one - so what this records is that the
     * move *forces* it, which is what lets a plan leaving the same Pokemon out be
     * called impossible rather than merely unusual.
     *
     * Baton Pass additionally passes its boosts, which is not modelled: see the
     * roadmap. It is recorded here so the two can't be confused for each other.
     */
    if (/^Switches the user out into a selected Pok.mon/i.test(effect)) {
        entry.switchesUser = {passesBoosts: /passes any stat changes/i.test(effect)};
    }

    /*
     * Roar and Whirlwind, which drag the *target* out instead. Which Pokemon
     * arrives is explicitly random, so the planner never picks one - but the
     * Pokemon leaving is certain, and so is everything it takes with it.
     */
    if (/forces the target to switch to a random Pok.mon/i.test(effect)) {
        entry.phazes = true;
    }

    var heal = parseHeal(effect);
    if (heal) entry.selfHeal = heal;

    if (HAZARD_FIELDS[move.id]) entry.hazard = HAZARD_FIELDS[move.id];
    if (WEATHER[move.id]) entry.weather = WEATHER[move.id];
    if (SCREENS[move.id]) entry.screen = SCREENS[move.id];
    if (SIDE_CONDITIONS[move.id]) entry.sideCondition = SIDE_CONDITIONS[move.id];
    if (WISH[move.id]) entry.wish = WISH[move.id];
    var delayed = parseDelayed(effect);
    if (delayed) entry.delayed = delayed;
    if (parsePainSplit(effect)) entry.painSplit = true;
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
console.log("  self-heal:", Object.values(effects).filter(e => e.selfHeal).length,
    "(weather-dependent:", Object.values(effects).filter(e => e.selfHeal && e.selfHeal.sun).length + ")");
console.log("  side conditions:", Object.values(effects).filter(e => e.sideCondition).length);
console.log("\nunparsed but stage-related (" + unparsedSetup.length + "):");
unparsedSetup.slice(0, 25).forEach(x => console.log("  " + x.slice(0, 110)));

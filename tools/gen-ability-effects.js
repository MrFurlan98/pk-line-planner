/*
 * One-off authoring tool: derives the abilities that touch state the planner
 * already tracks - status, stat stages, weather, switching - from their battle
 * descriptions.
 *
 * Deliberately narrow. Abilities that only change damage (Solid Rock, Levitate,
 * Thick Fat, Technician, ...) are left out entirely: @smogon/calc already
 * implements those, so modelling them here would duplicate it and drift.
 * Everything not listed is simply shown on the card with its description.
 *
 * Usage: node tools/gen-ability-effects.js   (from the repository root)
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "pkcalc-abilities-"));

function load(file, globalName) {
    var src = fs.readFileSync(path.join(ROOT, file), "utf8");
    src = src.replace(new RegExp("^const " + globalName + "\\s*="), "module.exports=");
    var tmp = path.join(SCRATCH, globalName + ".js");
    fs.writeFileSync(tmp, src);
    return require(tmp);
}

const ABILITIES = load("src/js/data/dex/abilities.js", "ABILITIES");

function battleText(ability) {
    return String((ability.desc && ability.desc.battle) || "").replace(/<[^>]+>/g, "");
}

const STATUS_BY_NAME = {
    Poison: ["psn", "tox"],
    Paralysis: ["par"],
    Sleep: ["slp"],
    Burn: ["brn"],
    Freeze: ["frz"]
};

const WEATHER_BY_PHRASE = {
    "rain": "Rain",
    "a sandstorm": "Sand",
    "sun": "Sun",
    "hail": "Hail"
};

var effects = {};
var unmatched = [];

Object.values(ABILITIES).forEach(function(ability) {
    var text = battleText(ability);
    if (!text) return;
    var entry = {};

    // "Protects the user from Poison." and friends.
    var status = /Protects the user from (Poison|Paralysis|Sleep|Burn|Freeze)\b/.exec(text);
    if (status) entry.blocksStatus = STATUS_BY_NAME[status[1]];
    if (/Protects the user from confusion/i.test(text)) entry.blocksVolatiles = ["confusion"];

    // Stat-drop protection, whole or partial.
    if (/Protects the user from stat drops caused by other/i.test(text)) entry.blocksDrops = "all";
    else if (/Protects the user from Attack drops caused by other/i.test(text)) entry.blocksDrops = ["atk"];
    else if (/Protects the user from accuracy drops caused by other/i.test(text)) entry.blocksDrops = ["acc"];

    if (/Lowers the Attack stat of all opposing Pok.mon by one stage when the user enters/i.test(text)) {
        entry.onSwitchIn = {opponentBoosts: {atk: -1}};
    }

    var weather = /Summons (rain|a sandstorm|sun|hail) when the user switches in/i.exec(text);
    if (weather) entry.onSwitchIn = Object.assign(entry.onSwitchIn || {}, {weather: WEATHER_BY_PHRASE[weather[1].toLowerCase()]});

    var traps = /Prevents all opposing (grounded Pok.mon|Steel type Pok.mon|Pok.mon) from switching out/i.exec(text);
    if (traps) entry.traps = /grounded/i.test(traps[1]) ? "grounded" : (/Steel/i.test(traps[1]) ? "steel" : "all");

    if (/Cures the user's status condition upon switching out/i.test(text)) entry.curesOnSwitchOut = true;

    /*
     * Leaf Guard only works while the sun is up, so the weather it depends on
     * is recorded rather than dropped - applying it unconditionally would make
     * a Pokémon look immune to status it can absolutely catch.
     */
    if (/Protects the user from status conditions in sun/i.test(text)) {
        entry.blocksStatus = ["psn", "tox", "par", "slp", "brn", "frz"];
        entry.requiresWeather = "Sun";
    }

    if (Object.keys(entry).length) {
        entry.name = ability.name;
        effects[ability.id] = entry;
    } else if (/Protects the user from|when the user enters|switches in|switching out/i.test(text)) {
        // Surfaced so the hand-check can confirm each was skipped on purpose.
        unmatched.push(ability.name + ": " + text.slice(0, 92));
    }
});

var out = "/*\n" +
    " * Abilities that change state the planner tracks - status, stat stages,\n" +
    " * weather, switching. Damage-only abilities are deliberately absent, since\n" +
    " * @smogon/calc already implements those.\n" +
    " *\n" +
    " * Generated from ability battle text and hand-checked. Regenerate with\n" +
    " * tools/gen-ability-effects.js if the ability data changes.\n" +
    " */\n" +
    "const ABILITY_EFFECTS = " + JSON.stringify(effects, null, 4) + ";\n";

fs.writeFileSync(path.join(ROOT, "src/js/data/ability_effects.js"), out);

console.log("entries written:", Object.keys(effects).length);
["blocksStatus", "blocksVolatiles", "blocksDrops", "onSwitchIn", "traps", "curesOnSwitchOut"].forEach(function(key) {
    console.log("  " + key + ":", Object.values(effects).filter(e => e[key]).length);
});
console.log("\nmatched none of the rules, but mention relevant wording (" + unmatched.length + "):");
unmatched.forEach(x => console.log("  " + x));

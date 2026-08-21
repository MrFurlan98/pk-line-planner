/*
 * One-off authoring tool: derives the held items that touch state the planner
 * already tracks - HP and stat stages - from their own descriptions.
 *
 * Deliberately narrow, on the same argument the ability generator makes. Items
 * that only change damage (Life Orb, Choice Band, Expert Belt) are left out
 * entirely: @smogon/calc already implements those, so modelling them here would
 * duplicate it and drift. So are the ones whose subsystem the planner doesn't
 * have - Leppa needs PP, Micle needs accuracy, Lansat needs a crit ratio, Custap
 * needs a priority slot on a *later* turn.
 *
 * The type-resist berries are the one deliberate half-measure. calc applies their
 * reduction and the planner must not apply it again, so only the *type* is
 * recorded and never the fraction - what the planner needs from them is knowing
 * when one has been spent, because calc will otherwise go on halving every hit
 * for the rest of the fight.
 *
 * Those last four are not closed questions, and what each would take is written
 * up in PLANNER.md under "Later -> The four items left out". Custap is the one
 * worth doing: 32 trainer sets carry it. If you add a rule for any of them here,
 * update that section too rather than leaving the two to drift.
 *
 * And anything probabilistic is out on the roadmap's own rule: a Focus Band is a
 * 10% chance to live, which is not something a plan may rest on. Contrast Focus
 * Sash, which is a certainty from full HP and therefore modelled.
 *
 * The status-curing berries are not here either - they were modelled before this
 * and live in STATUS_CURES, where the cure has to be checked as the status lands
 * rather than against a health threshold.
 *
 * Usage: node tools/gen-item-effects.js   (from the repository root)
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "pkcalc-items-"));

function load(file, globalName) {
    var src = fs.readFileSync(path.join(ROOT, file), "utf8");
    src = src.replace(new RegExp("^const " + globalName + "\\s*="), "module.exports=");
    var tmp = path.join(SCRATCH, globalName + ".js");
    fs.writeFileSync(tmp, src);
    return require(tmp);
}

const ITEMS = load("src/js/data/dex/items.js", "ITEMS");

const STAT_BY_NAME = {
    "Attack": "atk",
    "Defense": "def",
    "Special Attack": "spa",
    "Special Defense": "spd",
    "Speed": "spe"
};

/*
 * Percentages are emitted as [numerator, denominator], never as decimals - the
 * same rule the move generator follows. 12.5% as a double is not an eighth, and
 * floor(maxHP * 0.125) is a rounding bug waiting for the right max HP.
 */
const FRACTIONS = {
    "25": [1, 4],
    "12.5": [1, 8],
    "50": [1, 2],
    "33": [1, 3]
};

var effects = {};
var unmatched = [];

Object.values(ITEMS).forEach(function(item) {
    var text = String(item.desc || "").replace(/<[^>]+>/g, "");
    if (!text) return;
    var entry = {};

    /*
     * Held items only. The bag is full of things that restore an exact number of
     * HP - Potion, Lemonade, Moomoo Milk, Energy Root - and every one of them
     * matched the healing rule before this line existed. Nothing in the planner
     * uses a bag item: a trainer's Pokémon holds one thing and that is all.
     */
    if (!/^A (?:consumable )?held item\b/i.test(text)) return;

    /*
     * Anything with a chance attached is refused outright, before any rule gets
     * to look at it. Focus Band is the one this is really about.
     */
    if (/\bchance\b/i.test(text)) {
        if (/survive|first|stat|restores/i.test(text)) unmatched.push(item.name + " [chance] : " + text.slice(0, 88));
        return;
    }

    /*
     * The threshold, where there is one. Kaizo moved some of these: Ganlon and
     * Apicot say "immediately" here where the base game gates them at 25%, and
     * that is exactly the kind of thing generating rather than assuming catches.
     */
    var pinch = /if (?:the Pok.mon's|its) HP falls below (\d+)%/i.exec(text);
    if (pinch) entry.threshold = [parseInt(pinch[1], 10), 100];

    // "restores 20 HP" - a flat number of points.
    var flat = /restores (\d+) HP/i.exec(text);
    // "restores 25% HP" / "restores 12.5% HP" - a share of the maximum.
    var share = /restores ([\d.]+)% HP/i.exec(text);
    if (flat) entry.heal = {points: parseInt(flat[1], 10)};
    else if (share && FRACTIONS[share[1]]) entry.heal = {fraction: FRACTIONS[share[1]]};

    /*
     * "increases the Speed stat of the Pokémon by 1 stage", or "immediately"
     * with the count left off, which reads as one stage.
     *
     * The alternation is what keeps the Choice items out, and they are the whole
     * reason it isn't a lazy optional group: "increases the Attack stat of the
     * Pokémon by 50%" is a damage multiplier calc already applies, and a rule
     * that shrugged at the "by 50%" turned all three of them into a +1 boost.
     */
    var boost = /increases the (Attack|Defense|Special Attack|Special Defense|Speed) stat of the Pok.mon (?:by (\d+) stages?|immediately)/i.exec(text);
    if (boost && STAT_BY_NAME[boost[1]]) {
        entry.boost = {};
        entry.boost[STAT_BY_NAME[boost[1]]] = boost[2] ? parseInt(boost[2], 10) : 1;
    }

    // The Figy family heal, then confuse whoever dislikes the flavour.
    var dislikes = /confuses Pok.mon with a -(Atk|Def|SpA|SpD|Spe) nature/i.exec(text);
    if (dislikes) entry.confusesNature = dislikes[1];

    // White Herb, and nothing else in this game.
    if (/restores any negative stats/i.test(text)) entry.clearsNegative = true;

    /*
     * The orbs, which status their own holder at the end of the turn. Only two
     * items in the game do this, and both are deterministic - which is the whole
     * point of them: a Toxic Orb is how a Poison Heal or a Guts Pokemon turns
     * itself on, so the status is the plan rather than an accident.
     */
    var orb = /(badly poisons|poisons|burns) the Pok.mon at the end of the turn/i.exec(text);
    if (orb) {
        entry.selfStatus = /badly/i.test(orb[1]) ? "tox" : (/burns/i.test(orb[1]) ? "brn" : "psn");
    }

    /*
     * The type-resist berries. What the planner needs from these is *not* the
     * reduction - @smogon/calc already applies that, and applying it here too
     * would halve everything twice - but the fact that they are spent doing it.
     * So only the type is kept, and the fraction deliberately isn't: an unused
     * number sitting in the table is an invitation to double-count it.
     *
     * Chilan Berry is excluded below: this game's data has an empty type span for
     * it, so there is no type to record.
     */
    var resist = /reduces damage taken from a Super-Effective (\w+) attack/i.exec(text);
    if (resist) entry.resists = {type: resist[1].toLowerCase()};

    /*
     * Focus Sash. "from full HP" is load-bearing and kept as a condition rather
     * than dropped: a Sash on something already chipped does nothing at all, and
     * a plan that assumed otherwise would be planning on a Pokémon that dies.
     */
    if (/survive a fatal attack from full HP/i.test(text)) entry.survives = {fromFull: true};

    /*
     * A boost with no threshold and no other effect is an on-arrival item, not a
     * pinch berry. Berserk Gene, and Kaizo's rewritten Ganlon and Apicot.
     */
    if (entry.boost && !entry.threshold) entry.immediate = true;

    if (Object.keys(entry).length) {
        // A threshold on its own describes nothing the planner can apply.
        if (!entry.heal && !entry.boost && !entry.clearsNegative && !entry.survives &&
            !entry.selfStatus && !entry.resists) {
            unmatched.push(item.name + " [threshold only] : " + text.slice(0, 88));
            return;
        }
        /*
         * A condition that isn't a health threshold, and so isn't one this can
         * evaluate at the moment items fire. Enigma Berry is the only one: it
         * heals when hit by a super-effective move, and emitting it without that
         * clause would have made it an unconditional quarter back every turn.
         */
        if (/\bif\b/i.test(text) && !entry.threshold) {
            unmatched.push(item.name + " [condition not a threshold] : " + text.slice(0, 88));
            return;
        }
        entry.name = item.name;
        entry.consumed = /consumable/i.test(text);
        effects[item.id] = entry;
    } else if (/reduces damage taken from/i.test(text)) {
        // A resist berry whose type didn't parse - Chilan, whose span is empty.
        unmatched.push(item.name + " [no type in the data] : " + text.slice(0, 88));
    } else if (/restores|increases the|survive|falls below|end of the turn/i.test(text)) {
        // Surfaced so the hand-check can confirm each was skipped on purpose.
        unmatched.push(item.name + ": " + text.slice(0, 88));
    }
});

var out = "/*\n" +
    " * Held items that change state the planner tracks - HP and stat stages.\n" +
    " * Damage-only items are deliberately absent, since @smogon/calc already\n" +
    " * implements those, and so is anything probabilistic: a Focus Band is a 10%\n" +
    " * chance to live, which is not a thing a plan may rest on.\n" +
    " *\n" +
    " * `threshold` is [numerator, denominator] of max HP, and its absence means the\n" +
    " * item fires on arrival instead. `heal` is either exact `points` or a\n" +
    " * `fraction` of the maximum, never a decimal.\n" +
    " *\n" +
    " * Generated from item descriptions and hand-checked. Regenerate with\n" +
    " * tools/gen-item-effects.js if the item data changes.\n" +
    " */\n" +
    "const ITEM_EFFECTS = " + JSON.stringify(effects, null, 4) + ";\n";

fs.writeFileSync(path.join(ROOT, "src/js/data/item_effects.js"), out);

console.log("entries written:", Object.keys(effects).length);
["heal", "boost", "clearsNegative", "survives", "selfStatus", "resists", "threshold", "immediate"].forEach(function(key) {
    console.log("  " + key + ":", Object.values(effects).filter(e => e[key]).length);
});
console.log("\nmatched none of the rules, but mention relevant wording (" + unmatched.length + "):");
unmatched.forEach(x => console.log("  " + x));

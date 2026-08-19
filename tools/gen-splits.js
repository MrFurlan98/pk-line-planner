/*
 * One-off authoring tool: derives which trainers belong to which *split* - the
 * stretch of the game between one gym leader and the next - so the planner can
 * lay out a whole split's worth of blank lines in one click.
 *
 * SOURCE, and the reason this generator is unlike the others here: the split
 * grouping is not in the game's own data. Nothing in sets.js, flags.js or
 * party_order.js knows what order trainers come in, let alone where the badges
 * fall. It comes from the community's Platinum Kaizo reference sheet:
 *
 *   https://docs.google.com/spreadsheets/d/1y95UYKY9HNgZjUlbeZbQ3BWf5IqcFqAkmstC-OSa6vc/
 *
 * So this one reaches out to the network where the others read a local file.
 * Run it deliberately, check the report, and commit the result.
 *
 * Usage: node tools/gen-splits.js            (fetches the sheets)
 *        node tools/gen-splits.js <dir>      (reads <Split>.csv from a directory)
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SHEET = "1y95UYKY9HNgZjUlbeZbQ3BWf5IqcFqAkmstC-OSa6vc";

/*
 * In the order they are played, which is the order the buttons should offer
 * them. The sheet's own tab order, minus everything that isn't a split.
 */
const SPLITS = ["Roark", "Gardenia", "Fantina", "Maylene", "Wake", "Byron",
    "Candice", "Volkner", "Galactic", "Elite Four"];

function load(file, globalName) {
    var src = fs.readFileSync(path.join(ROOT, file), "utf8");
    src = src.replace(new RegExp("^(?:const|var) " + globalName + "\\s*="), "module.exports=");
    var tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "pkcalc-splits-")), globalName + ".js");
    fs.writeFileSync(tmp, src);
    return require(tmp);
}

const SETDEX = load("src/js/data/sets.js", "SETDEX_PK");

// Every trainer the game data actually has a team for.
var known = new Set();
Object.keys(SETDEX).forEach(function (species) {
    Object.keys(SETDEX[species]).forEach(function (trainer) { known.add(trainer); });
});
var knownList = [...known];

/* ------------------------------------------------------------------ reading */

function rows(s) {
    var out = [], f = "", r = [], q = false;
    for (var i = 0; i < s.length; i++) {
        var c = s[i];
        if (q) {
            if (c === '"' && s[i + 1] === '"') { f += '"'; i++; }
            else if (c === '"') q = false;
            else f += c;
        } else if (c === '"') q = true;
        else if (c === ",") { r.push(f); f = ""; }
        else if (c === "\n") { r.push(f); out.push(r); r = []; f = ""; }
        else if (c !== "\r") f += c;
    }
    if (f || r.length) { r.push(f); out.push(r); }
    return out;
}

/*
 * The sheet is laid out for a reader rather than a parser: a location line, a
 * trainer line, then a grid of that trainer's Pokemon. The dependable marker is
 * that every block is introduced by a row carrying the label "Pokémon", so the
 * trainer is always the line directly above one of those.
 */
function parseSplit(csv) {
    var R = rows(csv), out = [];
    for (var i = 1; i < R.length; i++) {
        if (!R[i].some(x => /^Pok.mon$/i.test(String(x || "").trim()))) continue;
        var name = String(R[i - 1][4] || "").trim().replace(/\s+/g, " ");
        if (name) out.push(name);
    }
    return out;
}

/* ------------------------------------------------------------- normalising */

/*
 * The sheet writes names for a person reading them, not as keys. Everything in
 * brackets is a note - which side of a triple they stand on, who they fight
 * alongside, where in the grass they are - and a trailing asterisk marks a
 * gauntlet you cannot heal between.
 */
const CLASSES = ["Galactic", "Cyclist", "School Kid", "Pokefan", "Pokéfan", "Worker",
    "Scientist", "Clown", "Ninja Boy", "Bug Catcher", "Aroma Lady", "Ace Trainer",
    "Black Belt", "Bird Keeper", "Dragon Tamer", "Psychic", "Veteran", "Collector",
    "Rancher", "Idol", "Guitarist", "Sailor", "Beauty", "Lass", "Youngster", "Camper",
    "Picnicker", "Hiker", "Fisherman", "Swimmer", "Tuber", "Skier", "Twins",
    "Commander", "Pkmn Breeder", "PKMN Breeder", "Pkmn Ranger"];

// Class names the sheet spells its own way.
const ALIASES = [
    [/^Pkmn Breeder\b/i, "Pokémon Breeder"],
    [/^Pkmn Ranger\b/i, "Pokémon Ranger"],
    [/^Pkmn Trainer\b/i, "Pokémon Trainer"],
    [/^Blackbelt\b/i, "Black Belt"],
    [/^BirdKeeper\b/, "Bird Keeper"],
    [/^PokéKid\b/, "Poké Kid"],
    [/^Pokekid\b/i, "Poké Kid"],
    [/^Pokefan\b/, "Pokéfan"],
    [/^Picknicker\b/i, "Picnicker"],
    [/^Double Team Stevie and Lindsey$/i, "Double Team Stevie & Lindsey"],
    [/\bJeffery\b/, "Jeffrey"]
];

function clean(raw) {
    var s = raw;
    s = s.replace(/\s*\(.*$/, "");            // the note to the reader
    s = s.replace(/,.*$/, "");                // and the occasional editorial
    s = s.replace(/[*†‡?❤♥\s-]+$/, "");
    s = s.replace(/\s+/g, " ").trim();
    /*
     * "Galacticf Venus", "CyclistFMegan", "School KidfChristine" - a find and
     * replace in the sheet ate a space. Sometimes it left one behind and
     * sometimes it didn't, so both shapes are repaired rather than hand-listed.
     */
    CLASSES.forEach(function (c) {
        var esc = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        s = s.replace(new RegExp("^" + esc + "[fF] ?(?=[A-ZÉ])"), c + " ");
    });
    ALIASES.forEach(function (a) { s = s.replace(a[0], a[1]); });
    s = s.replace(/([a-z])([A-Z])/g, "$1 $2");   // "CrasherWake" -> "Crasher Wake"
    s = s.replace(/^Leader Crasher Wake$/i, "Leader Wake");
    s = s.replace(/^LEADER ([A-Z]+)$/, function (_, n) {
        return "Leader " + n.charAt(0) + n.slice(1).toLowerCase();
    });
    return s.replace(/\s+/g, " ").trim();
}

/*
 * The handful the rules can't reach, keyed by split because the same label means
 * different fights in different places. Cyrus is the whole reason this exists:
 * the sheet calls him "Leader Cyrus" throughout while the game data numbers four
 * separate teams, and the Galactic split's is #2 - confirmed by matching its
 * party (Deoxys-Defense, Rampardos, Heatran, Registeel, Dusknoir, Regigigas)
 * rather than by trusting the label.
 */
const OVERRIDES = {
    "Byron|Leader Cyrus": "Galactic Boss Cyrus #1",
    "Galactic|Leader Cyrus": "Galactic Boss Cyrus #2"
};

/*
 * Tag partners, who appear in the sheet beside the fight they help with. They
 * are not opponents and have no line to plan, and the planner already sources
 * them from flags.js as the format's partner.
 */
const PARTNERS = /^(Trainer (Dawn\/Lucas|Cheryl|Marley|Riley|Buck|Mira)|Mira|Pokémon Trainer Riley)$/;

/*
 * Named in the sheet but absent from the game data - there are no School Kid
 * trainers in sets.js at all, so there is nothing to plan against. Listed here
 * so the report stays empty and a *new* unresolved name is worth looking at.
 */
const ABSENT = /^School Kid /;

/*
 * sets.js distinguishes repeat trainers two different ways, and they mean
 * opposite things:
 *
 *   "Galactic Mercury #1/#2/#3"          - three separate fights, in order
 *   "Pokémon Trainer Barry #2 [Chimchar]" - one fight, three ways it can go
 *
 * So a numbered suffix is *consumed* one per sighting as the splits are walked in
 * play order, while a bracketed one is expanded: every starter belongs to the
 * split, since which you meet depends on a choice made hours earlier.
 */
function baseOf(key) {
    return key.replace(/\s*\[[^\]]*\]\s*$/, "").replace(/\s+#\d+$/, "").trim();
}

function alternativesOf(prefix) {
    return knownList.filter(k => k === prefix || k.indexOf(prefix + " [") === 0).sort();
}

// How many times each base name has been claimed so far, across every split.
var claimed = {};

function resolve(split, name) {
    var override = OVERRIDES[split + "|" + name];
    if (override) return known.has(override) ? [override] : [];

    // Said outright, brackets and all.
    if (known.has(name)) return [name];

    /*
     * "Galactic Squad Leda" against "Galactic Leda", and "Galactic Themisto"
     * against "Galactic Squad Themisto" - the sheet is inconsistent about the
     * word in both directions, so both are tried.
     */
    var forms = [name];
    if (/^Galactic Squad /.test(name)) forms.push(name.replace(/^Galactic Squad /, "Galactic "));
    else if (/^Galactic /.test(name)) forms.push(name.replace(/^Galactic /, "Galactic Squad "));
    if (/^(?:Pokémon Trainer )?Barry\b/.test(name)) {
        forms.push(name.replace(/^(?:Pokémon Trainer )?Barry/, "Pokémon Trainer Barry"));
    }

    for (const form of forms) {
        var alts = alternativesOf(form);
        if (alts.length) return alts;

        // Numbered variants, taken one per sighting rather than all at once.
        var numbered = knownList.filter(k => baseOf(k) === form && k !== form).sort();
        if (numbered.length) {
            var n = claimed[form] || 0;
            claimed[form] = n + 1;
            var pick = numbered[Math.min(n, numbered.length - 1)];
            return alternativesOf(baseOf(pick) === pick ? pick : pick.replace(/\s*\[[^\]]*\]$/, ""));
        }
    }
    return [];
}

/* ------------------------------------------------------------------ running */

function csvUrl(split) {
    return "https://docs.google.com/spreadsheets/d/" + SHEET +
        "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(split + " Split");
}

async function readSplit(split, dir) {
    if (dir) return fs.readFileSync(path.join(dir, split.replace(/ /g, "_") + ".csv"), "utf8");
    var res = await fetch(csvUrl(split));
    if (!res.ok) throw new Error(split + ": HTTP " + res.status);
    return await res.text();
}

(async function main() {
    var dir = process.argv[2];
    var out = [], unresolved = [], skipped = [], totalFights = 0;

    for (const split of SPLITS) {
        var names = parseSplit(await readSplit(split, dir));
        var seen = new Set(), trainers = [];
        names.map(clean).forEach(function (name) {
            if (!name || PARTNERS.test(name) || ABSENT.test(name)) {
                if (name) skipped.push(split + ": " + name);
                return;
            }
            var hits = resolve(split, name);
            if (!hits.length) { unresolved.push(split + ": " + name); return; }
            hits.forEach(function (t) {
                if (seen.has(t)) return;
                seen.add(t);
                trainers.push(t);
            });
        });
        totalFights += trainers.length;
        out.push({name: split, trainers: trainers});
        console.log(split.padEnd(11) + String(trainers.length).padStart(4) + " fights");
    }

    var body = "/*\n" +
        " * Which trainers belong to which split - the stretch of the game between one\n" +
        " * gym leader and the next. Used by the planner's quick-setup buttons to lay\n" +
        " * out a whole split's worth of blank lines at once.\n" +
        " *\n" +
        " * This grouping is not in the game's own data; it comes from the community's\n" +
        " * Platinum Kaizo reference sheet, with thanks:\n" +
        " *   https://docs.google.com/spreadsheets/d/" + SHEET + "/\n" +
        " *\n" +
        " * Every name here resolves to a trainer in sets.js - the generator refuses to\n" +
        " * emit one that doesn't. Tag partners are deliberately absent: they are not\n" +
        " * fights, and the planner already reads them from flags.js.\n" +
        " *\n" +
        " * Generated and hand-checked. Regenerate with tools/gen-splits.js.\n" +
        " */\n" +
        "const SPLITS_PK = " + JSON.stringify(out, null, 4) + ";\n";
    fs.writeFileSync(path.join(ROOT, "src/js/data/splits.js"), body);

    console.log("\ntotal fights:", totalFights);
    console.log("\ntag partners skipped (" + skipped.length + "):");
    [...new Set(skipped)].forEach(x => console.log("  " + x));
    console.log("\nUNRESOLVED - these are dropped, check each is meant to be (" + unresolved.length + "):");
    [...new Set(unresolved)].forEach(x => console.log("  " + x));
})();

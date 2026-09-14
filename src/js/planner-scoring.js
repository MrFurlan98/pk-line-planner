/*
 * The AI's move scoring, evaluated.
 *
 * MOVE_SCORING holds what every move scores and under what condition; this walks
 * it against a turn and works out how likely the trainer is to pick each move.
 *
 * Two things shape the whole file, and they are different kinds of not-knowing:
 *
 * **A dice roll is a known fraction.** Half the rules in the table sit behind
 * one - "68.8% (176/256) chance of score +2" - and that 176/256 is the game's
 * own number, not an estimate. Each roll is its own draw, so a move whose
 * conditions are all answered has an exact score *distribution*, and the four
 * moves together have an exact chance of each being the one picked. Roar's page
 * prints its own total ("12.5% nothing, 50% +2, 37.5% +4") and this reproduces
 * it to the digit.
 *
 * **An unanswerable condition is not a fraction.** 486 distinct conditions
 * appear in the table and this file does not implement all of them, and "does
 * the target hold a King's Rock" has no honest probability. So one it cannot
 * answer is assumed true in one scenario and false in another, and the chance
 * reported is the lowest and highest across them. The range still contains the
 * truth; the panel gets less decisive rather than wrong. That is what makes the
 * long tail survivable instead of blocking.
 *
 * Calc is never touched here. Everything needing a damage figure, an
 * effectiveness or a speed comparison arrives already answered in the `facts`
 * object that planner-calc.js builds.
 */

/* ----------------------------------------------------------- distributions */

/*
 * A score distribution is a plain object from score to probability. Scores are
 * small integers and a module rarely reaches more than a handful of them, so
 * nothing cleverer is needed.
 */
function pointDist(score) {
    var out = {};
    out[score] = 1;
    return out;
}

// Adds `dist`, shifted by `by` and weighted by `weight`, into `into`.
function mixInto(into, dist, by, weight) {
    if (!weight) return into;
    Object.keys(dist).forEach(function(k) {
        var at = Number(k) + by;
        into[at] = (into[at] || 0) + dist[k] * weight;
    });
    return into;
}

// The sum of two independent scores - how the modules add up, since each one
// rolls its own dice.
function convolveDist(a, b) {
    var out = {};
    Object.keys(a).forEach(function(k) { mixInto(out, b, Number(k), a[k]); });
    return out;
}

function distScores(dist) {
    return Object.keys(dist).map(Number).sort(function(x, y) { return x - y; });
}

/*
 * The stochastically lowest and highest distributions a set of scenarios can
 * be bounded by: at every score, the largest and smallest chance of scoring at
 * most that. Neither need be one of the scenarios - that is the point, they are
 * the floor and ceiling under all of them at once.
 *
 * A move's chance of being picked only rises as its own score rises and only
 * falls as a rival's does, so pairing one move's low envelope with everyone
 * else's high envelope bounds its chance from below, and the reverse from above.
 * That holds for every scenario at once, which is why it needs no enumeration
 * of the combinations across moves.
 */
function envelopeDists(dists) {
    var scores = {};
    dists.forEach(function(d) { Object.keys(d).forEach(function(k) { scores[k] = true; }); });
    var sorted = Object.keys(scores).map(Number).sort(function(x, y) { return x - y; });
    var low = {};
    var high = {};
    var lastLow = 0;
    var lastHigh = 0;
    var running = dists.map(function() { return 0; });
    sorted.forEach(function(s) {
        dists.forEach(function(d, i) { running[i] += d[s] || 0; });
        var most = Math.min(1, Math.max.apply(null, running));
        var least = Math.min(1, Math.min.apply(null, running));
        if (most - lastLow > 0) low[s] = most - lastLow;
        if (least - lastHigh > 0) high[s] = least - lastHigh;
        lastLow = most;
        lastHigh = least;
    });
    return {low: low, high: high};
}

/*
 * The chance a move with score distribution `mine` is the one picked against
 * rivals with `others`, all rolling independently.
 *
 * The AI takes the highest score and breaks a tie at random, so a move level
 * with k others at the top wins a 1/(k+1) share. The number of rivals level
 * with it is counted by multiplying out (below + level·t) across them - the
 * coefficient of t^k is the chance exactly k are level and the rest beneath.
 */
function pickChance(mine, others) {
    var total = 0;
    Object.keys(mine).forEach(function(k) {
        var s = Number(k);
        var poly = [1];
        others.forEach(function(o) {
            var below = 0;
            var level = 0;
            Object.keys(o).forEach(function(j) {
                if (Number(j) < s) below += o[j];
                else if (Number(j) === s) level += o[j];
            });
            var next = poly.map(function(c) { return c * below; }).concat([0]);
            poly.forEach(function(c, i) { next[i + 1] += c * level; });
            poly = next;
        });
        var share = poly.reduce(function(sum, c, i) { return sum + c / (i + 1); }, 0);
        total += mine[k] * share;
    });
    return total;
}

/* -------------------------------------------------------------- predicates */

const SCORING_UNKNOWN = null;

// The side conditions the table names, against the keys the model stores them
// under. Tailwind and the spike layers are in the same map on the state.
const SCORING_SIDE_KEYS = {
    stealthrock: "isSR",
    reflect: "isReflect",
    lightscreen: "isLightScreen",
    tailwind: "isTailwind",
    safeguard: "isSafeguard",
    spikes: "spikes",
    toxicspikes: "toxicSpikes"
};

// The weather names the pages use, against what the state stores. "Harsh sun"
// is the same sun; this game has no second tier of it.
const SCORING_WEATHER = {
    raining: "Rain", rain: "Rain", rainy: "Rain",
    sunny: "Sun", sun: "Sun", "harsh sun": "Sun", "harsh sunlight": "Sun",
    hail: "Hail", hailing: "Hail",
    sandstorm: "Sand", sand: "Sand"
};

// The abilities that eat a move of their own type instead of taking damage.
const SCORING_ABSORB = {
    voltabsorb: "electric", motordrive: "electric", lightningrod: "electric",
    waterabsorb: "water", dryskin: "water", stormdrain: "water",
    flashfire: "fire"
};

/*
 * A list of type names - "Fire, Electric, Poison, or Rock". Every separator
 * needs a comma or a space, so a word can only be read one way.
 *
 * The first version let the separator be empty, and "or" then matched inside
 * the words themselves - N-or-mal - so a list that failed to match was retried
 * every way its letters could be cut. Counter's nine types took longer than
 * anyone would wait, on a condition any Expert trainer reaches.
 */
const SCORING_TYPE_LIST = "[A-Za-z]+(?:(?:,\\s*|\\s+)(?:or\\s+)?[A-Za-z]+)*";

// Stat names as the pages write them, against the keys a boost record uses.
const SCORING_STATS = {
    attack: "atk", defense: "def", defence: "def",
    specialattack: "spa", specialdefense: "spd", specialdefence: "spd",
    speed: "spe", accuracy: "acc", evasion: "eva"
};

/*
 * A condition's answer: true, false, or null for "this file cannot say".
 *
 * Matched on the source text rather than compiled ahead of time. The table
 * interns 487 distinct conditions and the top twenty cover most of every
 * moveset, so the shape of the work is a handful of families and a long thin
 * tail - and the tail is allowed to return null.
 */
function scoringCondition(text, ctx) {
    if (/^Unconditionally$/i.test(text)) return true;
    // Handled by the walker, which knows whether an earlier branch fired.
    if (/^Otherwise$/i.test(text)) return true;

    /*
     * Most of the longer conditions are conjunctions - "the target's ability is
     * Wonder Guard, and the effectiveness is not 2x or 4x, and the user's
     * ability is not Mold Breaker" - and splitting them is what makes them
     * answerable. One false clause settles the whole thing however unreadable
     * the rest is, which is why the Wonder Guard rule costs nothing against the
     * 99% of Pokemon that do not have it.
     */
    var body = String(text).replace(/^If\s+/i, "");

    /*
     * The whole sentence first, before any splitting. Some clauses carry a list
     * of their own - "the effectiveness of the move is 1/2x, 1/4x, or 0x" - and
     * splitting those on "or" tears the list in half and loses the answer.
     */
    var whole = scoringClause(body, ctx);
    if (whole !== SCORING_UNKNOWN) return whole;

    /*
     * Disjunctions exist too - "the user's HP is under 80%, or the user will
     * attack after the target" - and mirror the conjunction: one true clause
     * settles it. Only when there is no "and" in the same sentence, since a
     * mixed one would need real precedence and none appears in the table.
     */
    if (/,\s*or\s+/i.test(body)) {
        /*
         * "or" binds loosest, so it splits first and each piece is then read as
         * a conjunction. That handles the mixed sentences too - "the weather is
         * sunny and the ability is Leaf Guard, or the weather is rainy and the
         * ability is Dry Skin" is two ands joined by an or, and reading it as a
         * flat list of either connective gets it wrong.
         */
        var any = body.split(/,\s*or\s+/i);
        /*
         * The longest of these run the subject once and then leave it out -
         * "the user is badly poisoned, or infatuated, or under the effect of
         * Curse, ... , or the foe knows the move Recover". A piece that does not
         * name a subject of its own inherits the one in front of it, which is
         * how the sentence reads and the only way the bare items resolve.
         */
        var subject = (any[0].match(/^the (?:user|target|foe)(?:'s)? (?:is |has |knows )?/i) || [""])[0];
        var vague = false;
        for (var j = 0; j < any.length; j++) {
            var piece = any[j].trim();
            if (j && subject && !/^(?:the|this|it|score|either)\b/i.test(piece)) piece = subject + piece;
            var each = scoringAnd(piece, ctx);
            if (each === true) return true;
            if (each === SCORING_UNKNOWN) vague = true;
        }
        return vague ? SCORING_UNKNOWN : false;
    }

    return scoringAnd(body, ctx);
}

// A run of clauses joined by "and": one false settles it, one unknown clouds it.
function scoringAnd(body, ctx) {
    var clauses = body.split(/,?\s+and\s+/i);
    var unknown = false;
    for (var i = 0; i < clauses.length; i++) {
        var answer = scoringClause(clauses[i].trim(), ctx);
        if (answer === false) return false;
        if (answer === SCORING_UNKNOWN) unknown = true;
    }
    return unknown ? SCORING_UNKNOWN : true;
}

/*
 * One clause, with "If" already stripped. Negation is handled here rather than
 * per pattern: the table says "is not Mold Breaker" and "is not 2x or 4x" as
 * readily as the positive form.
 */
function scoringClause(clause, ctx) {
    var facts = ctx.facts;
    var move = ctx.move;
    var m;
    var text = "If " + clause;

    /* --- effectiveness, the single most common thing asked --- */
    m = clause.match(/^the effectiveness of the move is (not )?(.+)$/i);
    if (m) {
        var hit = scoringEffMatches(m[2], move.eff);
        if (hit === SCORING_UNKNOWN) return SCORING_UNKNOWN;
        return m[1] ? !hit : hit;
    }

    /* --- KO checks --- */
    if (/^If the move can KO the target$/i.test(text)) return move.kos;
    if (/^If the move cannot KO the target$/i.test(text)) return !move.kos;

    /*
     * "is there something better in the moveset" - the second half of the most
     * common conjunction in the whole table, and the rule that stops the AI
     * throwing its weakest attack. Written several ways across the pages.
     */
    if (/^If a different move the user knows would do more damage to the target$/i.test(text)) {
        return facts.bestDamage > move.damage;
    }
    if (/^If a different move the user knows would not do more damage to the target$/i.test(text) ||
        /^If the user's most damaging move is this move$/i.test(text)) {
        return facts.bestDamage <= move.damage;
    }
    if (/^If the move deals the most damage to the target$/i.test(text)) {
        return move.damage >= facts.bestDamage;
    }

    /* --- health, as the AI reads it: floored percentages --- */
    // The apostrophe goes missing on some pages ("the user HP is under 70%"),
    // and "at or over" turns the comparison inclusive.
    m = clause.match(/^the (user|target)(?:'s)? HP is (?:(at or) )?(over|under) (\d+)%$/i);
    if (m) {
        var band = m[1].toLowerCase() === "user" ? facts.userHpPct : facts.targetHpPct;
        var mark = Number(m[4]);
        if (m[3].toLowerCase() === "over") return m[2] ? band >= mark : band > mark;
        return m[2] ? band <= mark : band < mark;
    }
    m = text.match(/^If the (user|target)'s HP is (over|under) (\d+)%$/i);
    if (m) {
        var have = m[1].toLowerCase() === "user" ? facts.userHpPct : facts.targetHpPct;
        return m[2].toLowerCase() === "over" ? have > Number(m[3]) : have < Number(m[3]);
    }
    m = text.match(/^If the (user|target) is at full HP$/i);
    if (m) return (m[1].toLowerCase() === "user" ? facts.userHpPct : facts.targetHpPct) >= 100;
    m = text.match(/^If the (user|target)'s HP is full$/i);
    if (m) return (m[1].toLowerCase() === "user" ? facts.userHpPct : facts.targetHpPct) >= 100;

    /* --- the turn counters --- */
    if (/^If it is the first turn of battle$/i.test(text)) return facts.firstTurnOfBattle;
    if (/^If it is not the first turn of battle$/i.test(text)) return !facts.firstTurnOfBattle;
    if (/^If this is the first turn of the battle$/i.test(text)) return facts.firstTurnOfBattle;
    if (/^If this is the user's first turn in battle$/i.test(text)) return facts.firstTurnActive;
    if (/^If this is not the first turn the user is active$/i.test(text)) return !facts.firstTurnActive;

    /* --- what either side is carrying --- */
    /*
     * Ability checks, which are written as lists of any length - "Immunity,
     * Magic Guard, or Poison Heal". The other side is called both "target" and
     * "foe"; the same Pokemon in the only format this answers for.
     */
    m = clause.match(/^the (user|target|foe)'s ability is (not )?([A-Za-z' -]+(?:,\s*[A-Za-z' -]+)*(?:,?\s*or\s+[A-Za-z' -]+)?)$/i);
    if (m) {
        var ability = m[1].toLowerCase() === "user" ? facts.userAbility : facts.targetAbility;
        var has = String(m[3]).split(/,|\s+or\s+/i).map(function(x) { return toID(x.trim()); })
            .filter(function(x) { return x; })
            .indexOf(toID(ability)) >= 0;
        return m[2] ? !has : has;
    }
    /*
     * Status, on either side. "the user is not asleep" and "the target is
     * already statused" are the same question asked of different Pokemon, and
     * the pages call your opponent both "target" and "foe".
     *
     * Worth having for its own sake: Sleep Talk is a -8 in Basic and a -5 in
     * Expert against an awake Pokemon, and without this it read as a possible
     * +10 - a move that cannot do anything sitting at the top of the list.
     */
    // Commas and hyphens allowed, because the list form comes through here too:
    // "the foe is asleep, infatuated, or confused" is one condition to the AI.
    m = clause.match(/^the (user|target|foe) is (not )?(?:already |currently )?([a-z ,'-]+?)$/i);
    if (m) {
        var mine = m[1].toLowerCase() === "user";
        var answer = scoringHasCondition({
            status: mine ? facts.userStatus : facts.targetStatus,
            volatiles: mine ? facts.userVolatiles : facts.targetVolatiles,
            perish: mine ? facts.userPerish : facts.targetPerish,
            side: mine ? facts.userSide : facts.targetSide
        }, m[3].trim());
        /*
         * Only answered when it is actually a condition. This pattern is broad
         * enough to catch "the target is Ground type" as well, and those have
         * their own checks further down - so an unrecognised word falls through
         * rather than returning unknown and stopping them from running.
         */
        if (answer !== SCORING_UNKNOWN) return m[2] ? !answer : answer;
    }

    m = text.match(/^If the user (?:doesn't know|does not know) the move ([A-Za-z' -]+)$/i);
    if (m) return !scoringKnows(facts, m[1]);
    m = text.match(/^If the user (?:also )?knows the move ([A-Za-z' -]+?)(?: or ([A-Za-z' -]+?))?$/i);
    if (m) return scoringKnows(facts, m[1]) || (m[2] ? scoringKnows(facts, m[2]) : false);

    if (/^If the user has no other living party members$/i.test(text)) return facts.livingPartyMates === 0;
    if (/^If the user has other living party members$/i.test(text)) return facts.livingPartyMates > 0;

    m = clause.match(/^the (?:target|foe) (?:doesn't know|does not know) the move ([A-Za-z' -]+)$/i);
    if (m) return !scoringKnowsOne(facts.targetKnows, m[1]);
    m = clause.match(/^the (?:target|foe) knows the move ([A-Za-z' -]+(?:,\s*[A-Za-z' -]+)*(?:,?\s*or\s+[A-Za-z' -]+)?)$/i);
    if (m) {
        return String(m[1]).split(/,|\s+or\s+/i).map(function(x) { return x.trim(); })
            .filter(function(x) { return x; })
            .some(function(name) { return scoringKnowsOne(facts.targetKnows, name); });
    }

    /*
     * The ally slot. In a single battle there is nobody beside you, so these are
     * plainly false rather than unknown - which matters, because the doubles
     * module carries a lot of them and each one left vague widened every band.
     */
    m = clause.match(/^the user's ally knows the move ([A-Za-z' -]+)$/i);
    if (m) return facts.ally ? scoringKnowsOne(facts.ally.knows, m[1]) : false;
    m = clause.match(/^the user's ally's ability is ([A-Za-z' -]+?)(?: or ([A-Za-z' -]+?))?$/i);
    if (m) {
        if (!facts.ally) return false;
        return [m[1], m[2]].filter(function(x) { return x; })
            .map(toID).indexOf(toID(facts.ally.ability)) >= 0;
    }
    if (/^the user's ally's HP is over 0%(?: \(after rounding\))?$/i.test(clause)) {
        return facts.ally ? facts.ally.alive : false;
    }
    if (/^the user's ally's HP is 0%(?: \(after rounding\))?$/i.test(clause)) {
        return facts.ally ? !facts.ally.alive : true;
    }
    m = clause.match(/^the user's ally's HP is (over|under) (\d+)%$/i);
    if (m) {
        if (!facts.ally) return false;
        return m[1].toLowerCase() === "over"
            ? facts.ally.hpPct > Number(m[2]) : facts.ally.hpPct < Number(m[2]);
    }
    /*
     * Worth having even though only one rule asks it: that rule is "the ally is
     * statused *and* its ability is Hydration", and knowing the first half is
     * false settles the conjunction without needing the second - which would
     * otherwise need the subject carried across an and-split.
     */
    m = clause.match(/^the user's ally is (not )?statused$/i);
    if (m) {
        if (!facts.ally) return !!m[1];
        return m[1] ? !facts.ally.statused : facts.ally.statused;
    }
    m = clause.match(new RegExp("^the user's ally is (" + SCORING_TYPE_LIST + ") type$", "i"));
    if (m) {
        if (!facts.ally) return false;
        return String(m[1]).split(/,|\s+or\s+/i).map(toID).filter(function(t) { return t; })
            .some(function(t) { return facts.ally.types.map(toID).indexOf(t) >= 0; });
    }

    /* --- Protect's own counter, which halves its chance each time --- */
    m = clause.match(/^the user's consecutive protection count is (\d+)(?: or more)?$/i);
    if (m) {
        var want = Number(m[1]);
        return /or more/i.test(clause) ? facts.protectStreak >= want : facts.protectStreak === want;
    }

    /* --- "under the effect of X", which is how volatiles are asked about --- */
    m = clause.match(/^the (user|target|foe) is (?:already )?under the effect (?:of|or) (.+)$/i);
    if (m) {
        // Through the same reader as "the user is asleep", so a list, a deleted
        // move and Perish Song's counter are all handled in exactly one place.
        var mineHere = m[1].toLowerCase() === "user";
        return scoringHasCondition({
            status: mineHere ? facts.userStatus : facts.targetStatus,
            volatiles: mineHere ? facts.userVolatiles : facts.targetVolatiles,
            perish: mineHere ? facts.userPerish : facts.targetPerish,
            side: mineHere ? facts.userSide : facts.targetSide
        }, m[2]);
    }

    /*
     * Order of play. The pages say "move" and "attack" interchangeably, and call
     * the other side both "target" and "foe" - the same Pokemon in a single
     * battle, which is the only format this answers for.
     */
    m = clause.match(/^the user will (?:move|attack) (before|after) the (?:target|foe)$/i);
    if (m) {
        if (facts.movesFirst === null) return SCORING_UNKNOWN;
        return m[1].toLowerCase() === "before" ? facts.movesFirst : !facts.movesFirst;
    }

    /* --- the field's own conditions --- */
    if (/^Trick Room is currently active$/i.test(clause)) return !!facts.trickRoom;
    if (/^Trick Room is not currently active$/i.test(clause)) return !facts.trickRoom;
    if (/^Gravity is currently active$/i.test(clause)) return !!facts.gravity;

    /*
     * Typing, which is written as a list as often as not - "Steel or Poison
     * type", "Fire, Electric, Poison, or Rock type" - and means any of them.
     */
    // Also "either of the foe's types is X, Y, or Z" - with no "type" after it -
    // and "the target is a Fire type": three ways of asking the same thing.
    m = clause.match(new RegExp("^the (user|target|foe) is (not )?(a |pure )?(" + SCORING_TYPE_LIST + ") type$", "i")) ||
        clause.match(new RegExp("^either of the (user|target|foe)'s types is (not )?()(" + SCORING_TYPE_LIST + ")(?: type)?$", "i"));
    if (m) {
        var has = ((m[1].toLowerCase() === "user" ? facts.userTypes : facts.targetTypes) || []).map(toID);
        var any = String(m[4]).split(/,|\s+or\s+/i).map(function(t) { return toID(t); })
            .filter(function(t) { return t; })
            .some(function(t) { return has.indexOf(t) >= 0; });
        // "pure Electric" is Electric and nothing else.
        if (/pure/i.test(m[3] || "")) any = any && has.length === 1;
        return m[2] ? !any : any;
    }

    /* --- what is standing on a side of the field --- */
    m = clause.match(/^the (user|target)'s side of the field (?:already |aleady )?has ([A-Za-z ]+?) active$/i);
    if (m) {
        var hazards = m[1].toLowerCase() === "user" ? facts.userSide : facts.targetSide;
        return String(m[2]).split(/\s+or\s+/i).some(function(name) {
            var key = SCORING_SIDE_KEYS[toID(name)];
            return key ? !!hazards[key] : false;
        });
    }
    /*
     * The same question without a side named, which is how the pages ask about a
     * move's own condition - "If Tailwind is already active". It always means the
     * user's own side, since that is the only side that move could put it on.
     *
     * "aleady" is not a mistake here: the source page spells it that way, and
     * matching what is written beats matching what was meant. Tailwind is the
     * one that showed it, scoring -10 as a maybe on a turn where nothing was up.
     */
    m = clause.match(/^([A-Za-z ]+?) is (?:already|aleady) active$/i);
    if (m) {
        var own = SCORING_SIDE_KEYS[toID(m[1])];
        if (own) return !!facts.userSide[own];
    }

    /* --- stat stages, accuracy and evasion included: calc drops those two
           because they change no damage, but the AI reads them --- */
    m = clause.match(/^the (user|target)'s (?:current )?([A-Za-z ]+?) (?:level )?is (?:boosted|reduced) to ([+-]?\d+)(?: or (more|lower|higher))?$/i);
    if (m) {
        var stages = m[1].toLowerCase() === "user" ? facts.userBoosts : facts.targetBoosts;
        var stat = SCORING_STATS[toID(m[2])];
        if (!stat) return SCORING_UNKNOWN;
        var have = stages[stat] || 0;
        var want = Number(m[3]);
        if (!m[4]) return have === want;
        return /lower/i.test(m[4]) ? have <= want : have >= want;
    }

    /* --- the other side's bench --- */
    if (/^the target has no other living party members$/i.test(clause)) return facts.targetPartyMates === 0;
    if (/^the target has other living party members$/i.test(clause)) return facts.targetPartyMates > 0;

    /*
     * Gender, which only Attract cares about. A Pokemon with no gender is never
     * the opposite of anything, so both halves read false for it - which is the
     * game's own behaviour, since Attract simply fails.
     */
    m = clause.match(/^the target is (not )?the opposite gender (?:as|to) the user$/i);
    if (m) {
        var a = String(facts.gender || "").charAt(0).toUpperCase();
        var b = String(facts.targetGender || "").charAt(0).toUpperCase();
        var opposite = !!a && !!b && a !== b && "MF".indexOf(a) >= 0 && "MF".indexOf(b) >= 0;
        return m[1] ? !opposite : opposite;
    }

    /*
     * Future Sight in the air. The model keeps delayed attacks in each side's
     * `pending` list, which is the same thing this is asking about.
     */
    m = clause.match(/^the (user|target)'s side is (not )?awaiting a future attack$/i);
    if (m) {
        var waiting = m[1].toLowerCase() === "user" ? facts.userPending : facts.targetPending;
        return m[2] ? !waiting : waiting;
    }

    /*
     * "its" carries the subject of the clause before it, which only happens
     * inside a conjunction - "the user's HP is full and its current defense is
     * boosted to under +3". The and-splitter hands them over separately, so the
     * subject has to be recovered here.
     */
    m = clause.match(/^its (?:current )?([A-Za-z ]+?) is boosted to (under|over) ([+-]?\d+)$/i);
    if (m) {
        var stat2 = SCORING_STATS[toID(m[1])];
        if (stat2) {
            var level = facts.userBoosts[stat2] || 0;
            return m[2].toLowerCase() === "under" ? level < Number(m[3]) : level > Number(m[3]);
        }
    }

    /* --- a stat stage compared against a level rather than a threshold --- */
    m = clause.match(/^the (user|target)'s (?:current )?([A-Za-z ]+?) (?:level )?is (not )?([+-]?\d+)$/i);
    if (m) {
        var where = m[1].toLowerCase() === "user" ? facts.userBoosts : facts.targetBoosts;
        var which = SCORING_STATS[toID(m[2])];
        if (which) {
            var same = (where[which] || 0) === Number(m[4]);
            return m[3] ? !same : same;
        }
    }

    /*
     * The absorbing abilities, which turn a move into healing rather than
     * damage. The type has to match the ability, and Mold Breaker ignores all
     * of them - the same rule the switch check applies.
     */
    // Not anchored at the end: this one carries a trailing "and the user's
    // ability is not Mold Breaker", and the abilities it lists are always the
    // same four - the answer turns on which one the target actually has.
    if (/^the target is immune to the move's damage due to /i.test(clause)) {
        if (toID(facts.userAbility) === "moldbreaker") return false;
        var soaks = SCORING_ABSORB[toID(facts.targetAbility)];
        return !!soaks && toID(soaks) === toID(move.type);
    }

    /* --- Safeguard, which is now real state rather than a guess --- */
    if (/^the (?:target|foe) is protected by Safeguard$/i.test(clause)) return !!facts.targetSide.isSafeguard;
    if (/^the user is (?:already )?(?:protected by|under the effect of) Safeguard$/i.test(clause)) {
        return !!facts.userSide.isSafeguard;
    }

    /* --- weather, asked half a dozen ways --- */
    m = clause.match(/^(?:it is|the weather is|the current weather is)\s*(not )?(?:already )?(.+)$/i);
    if (m) {
        var named = String(m[2]).split(/,|\s+or\s+/i).map(function(w) {
            return SCORING_WEATHER[w.trim().toLowerCase()];
        }).filter(function(w) { return w; });
        if (named.length) {
            var up = named.indexOf(facts.weather) >= 0;
            return m[1] ? !up : up;
        }
    }

    /* --- what the player did last turn --- */
    m = clause.match(/^the last move used by (?:the )?(?:foe|target) (?:was|is) (not )?(physical|special|damaging|nondamaging|a status move)$/i);
    if (m) {
        var last = facts.targetLastMove;
        if (!last || !last.acted) return /nondamaging|status/i.test(m[2]) ? true : false;
        var kind = m[2].toLowerCase();
        var yes = kind === "physical" ? last.category === "physical"
            : kind === "special" ? last.category === "special"
            : kind === "damaging" ? last.damaging
            : !last.damaging;
        return m[1] ? !yes : yes;
    }
    if (/^the last move used by the (?:foe|target) was nondamaging, or the (?:foe|target) has not yet used a move$/i.test(clause)) {
        return !facts.targetLastMove || !facts.targetLastMove.acted || !facts.targetLastMove.damaging;
    }
    m = clause.match(/^the last move used by the (?:foe|target) was ([A-Za-z' -]+(?:,\s*[A-Za-z' -]+)*(?:,? or [A-Za-z' -]+)?)$/i);
    if (m && facts.targetLastMove !== undefined) {
        var lastMove = facts.targetLastMove;
        if (!lastMove || !lastMove.acted) return false;
        return String(m[1]).split(/,|\s+or\s+/i).map(function(x) { return x.trim(); })
            .filter(function(x) { return x; })
            .some(function(name) {
                var want = findMove(name);
                return want && want.id === lastMove.id;
            });
    }

    /* --- odds and ends the pages ask once or twice each --- */
    if (/^the user has a move that inflicts damage$/i.test(clause)) {
        return facts.moves.some(function(x) { return !x.status; });
    }
    // "the fight is a double or multi battle", "this is a double battle" - the
    // same question, and the planner's formats answer it outright.
    m = clause.match(/^(?:the fight|this) is (not )?a double(?: or multi)? battle$/i);
    if (m) return m[1] ? !facts.doubles : facts.doubles;
    if (/^the target is a higher level than the user$/i.test(clause)) {
        return facts.targetLevel > facts.level;
    }
    if (/^the (?:target|user) already has a substitute$/i.test(clause)) {
        var subs = /target/i.test(clause) ? facts.targetVolatiles : facts.userVolatiles;
        return !!subs.substitute;
    }
    if (/^the target is already prevented from escaping$/i.test(clause)) return facts.targetTrapped;
    if (/^this is not the first turn the user has been in battle$/i.test(clause)) return !facts.firstTurnActive;
    m = clause.match(/^the (user|target)'s side of the field already has (\d+) layers? of (Toxic Spikes|Spikes)$/i);
    if (m) {
        var layers = m[1].toLowerCase() === "user" ? facts.userSide : facts.targetSide;
        var field = /toxic/i.test(m[3]) ? "toxicSpikes" : "spikes";
        return (layers[field] || 0) >= Number(m[2]);
    }
    /*
     * Kaizo deletes Taunt outright - there is no way to be taunted here - so
     * every rule that asks about it is answerable, and the answer is no.
     */
    if (/under the effect of Taunt$/i.test(clause)) return false;

    /*
     * A back-reference to the group just above, which a few modules use to chain
     * two rules together. The walker carries what the previous group awarded -
     * per path, so a rolled one is known too: each side of the roll walks on
     * knowing how it landed. Only unknown at the very top of a module.
     */
    // Written two ways: "the move did not receive a score +1 in the previous
    // check", and the terser "score +1 from the above check".
    m = clause.match(/^score \+(\d+) from the above check$/i);
    if (m) {
        if (ctx.lastScore === undefined || ctx.lastScore === null) return SCORING_UNKNOWN;
        return ctx.lastScore === Number(m[1]);
    }
    m = clause.match(/^the move did (not )?receive a score \+(\d+) in the previous check$/i);
    if (m) {
        if (ctx.lastScore === undefined || ctx.lastScore === null) return SCORING_UNKNOWN;
        var got = ctx.lastScore === Number(m[2]);
        return m[1] ? !got : got;
    }

    /*
     * Everything else - Safeguard, which the planner does not track at all,
     * held items, and the rarer volatiles. Saying so is the point: the walker
     * tries it both ways and widens the range instead of guessing.
     */
    return SCORING_UNKNOWN;
}

/*
 * Whether a Pokemon is in a named condition, over both the non-volatile status
 * and the volatiles beside it - the pages ask about them in the same breath
 * ("asleep, infatuated, or confused") because to the AI they are one question.
 *
 * "statused" alone means the non-volatile one only, which is the game's own
 * distinction: a confused Pokemon can still be put to sleep.
 */
const SCORING_CONDITIONS = {
    asleep: "slp", poisoned: "psn", "badly poisoned": "tox",
    burned: "brn", burnt: "brn", paralyzed: "par", paralysed: "par", frozen: "frz"
};
/*
 * Conditions that cannot exist in this game, so a rule asking about one has a
 * real answer rather than an unknown.
 *
 * Taunt, Nightmare and Heal Block are deleted outright - `findMove` does not
 * resolve any of them. Lock-On and Mind Reader do exist, but only ever mattered
 * for accuracy, which the planner has no concept of and deliberately never will;
 * nothing in a plan can turn one on, so it can never be up.
 */
const SCORING_ABSENT = {
    taunt: true, nightmare: true, "heal block": true,
    // Modelled as sleep landing at once, so a Yawn is never left pending.
    yawn: true,
    "lock-on": true, lockon: true, "mind reader": true, mindreader: true
};

const SCORING_VOLATILES = {
    cursed: "curse", curse: "curse",
    confused: "confusion", infatuated: "attract", seeded: "leechseed",
    tormented: "torment", ingrained: "ingrain", encored: "encore", disabled: "disable",
    // Also named directly by the "under the effect of X" rules.
    "leech seed": "leechseed", leechseed: "leechseed", "aqua ring": "aquaring",
    aquaring: "aquaring", ingrain: "ingrain", encore: "encore", disable: "disable",
    substitute: "substitute", torment: "torment", attract: "attract", confusion: "confusion"
};

function scoringHasCondition(state, name) {
    /*
     * A list, because the pages ask about several at once - "asleep, infatuated,
     * or confused" is one condition to the AI. Any one of them settles it, and
     * a name this file does not know leaves the whole thing unknown rather than
     * quietly answering no.
     */
    /*
     * "under the effect of" turns up partway through these lists as well as at
     * the front - "badly poisoned, or infatuated, or under the effect of Curse,
     * Leech Seed, Yawn, or Perish Song" is one long list of conditions with the
     * phrase dropped in the middle. Stripping it everywhere flattens the list to
     * plain names, which is what the rest of this reads.
     */
    var parts = String(name).replace(/\bunder the effect (?:of|or)\s+/gi, "")
        .split(/,|\s+or\s+/i).map(function(x) { return x.trim(); })
        .filter(function(x) { return x; });
    if (parts.length > 1) {
        var vague = false;
        for (var i = 0; i < parts.length; i++) {
            var each = scoringHasCondition(state, parts[i]);
            if (each === true) return true;
            if (each === SCORING_UNKNOWN) vague = true;
        }
        return vague ? SCORING_UNKNOWN : false;
    }

    var want = String(name).toLowerCase().trim();
    if (want === "statused") return !!state.status;
    /*
     * Side conditions come through this door too - "the user is already under
     * the effect of Safeguard" reads exactly like a volatile - so they are
     * answered here rather than in a second place that never gets reached.
     */
    if (state.side && SCORING_SIDE_KEYS[toID(want)]) {
        return !!state.side[SCORING_SIDE_KEYS[toID(want)]];
    }
    /*
     * Moves this game deleted outright. There is no way to be taunted in
     * Platinum Kaizo, so every rule asking about it has a real answer - and
     * leaving it unknown would widen bands over a mechanic that cannot happen.
     */
    if (SCORING_ABSENT[want]) return false;
    if (SCORING_CONDITIONS[want]) {
        // Badly poisoned is its own status, but a plain "poisoned" covers both.
        if (want === "poisoned") return state.status === "psn" || state.status === "tox";
        return state.status === SCORING_CONDITIONS[want];
    }
    if (want === "perish song") return (state.perish || 0) > 0;
    if (SCORING_VOLATILES[want]) return !!state.volatiles[SCORING_VOLATILES[want]];
    return SCORING_UNKNOWN;
}

function scoringKnows(facts, name) {
    return scoringKnowsOne(facts.userKnows, name);
}

/*
 * Compared through findMove rather than as text, because a set carries the
 * game's spelling and these pages carry the display one - "Selfdestruct" and
 * "Self-Destruct" are the same move.
 */
function scoringKnowsOne(moves, name) {
    var want = findMove(name);
    if (!want) return false;
    return (moves || []).some(function(known) {
        var move = findMove(known);
        return move && move.id === want.id;
    });
}

/*
 * "4x", "1/2x", "1/2x, 1/4x, or 0x" - the table writes multipliers as fractions
 * and sometimes lists several. Compared numerically rather than as text, since
 * the same value is written more than one way across the pages.
 */
function scoringEffMatches(spec, eff) {
    var wanted = String(spec).split(/,| or /).map(function(part) {
        var t = part.trim().replace(/x$/i, "").trim();
        if (!t) return null;
        var frac = t.match(/^(\d+)\/(\d+)$/);
        if (frac) return Number(frac[1]) / Number(frac[2]);
        var n = Number(t);
        return isFinite(n) ? n : null;
    }).filter(function(x) { return x !== null; });
    if (!wanted.length) return SCORING_UNKNOWN;
    // Float compare, because 1/4 and 0.25 have to be the same answer.
    return wanted.some(function(w) { return Math.abs(w - eff) < 0.001; });
}

/* ---------------------------------------------------------------- the walk */

/*
 * How many walks one move's unknowns may cost before giving up on bounding
 * them. Each unknown can double the count; the most any move in the table needs
 * is Guard Swap and Power Swap, whose five "the sum is" rules are each their own
 * unknown and take a few hundred. Past it the move is honestly unbounded:
 * anywhere from certain to impossible.
 */
const SCORING_SCENARIO_CAP = 512;

/*
 * Thrown by a condition the file cannot answer and no scenario has decided yet.
 * The move is then re-walked twice, once with each answer - so one unknown gets
 * the same answer everywhere it is asked within a scenario, rather than being
 * true in one module and false in the next.
 */
function ScoringFork(text) {
    this.text = text;
}

/*
 * What the facts say is the same in every scenario, and reading a condition
 * means trying it against dozens of patterns - so it is read once per move and
 * kept. Only the back-references vary along a path, which is why the score the
 * previous group awarded is part of the key.
 */
function scoringDecide(text, ctx) {
    var key = text + "|" + ctx.lastScore;
    if (!ctx.read.hasOwnProperty(key)) ctx.read[key] = scoringCondition(text, ctx);
    var answer = ctx.read[key];
    if (answer !== SCORING_UNKNOWN) return answer;
    return scoringAssumed(text, ctx);
}

function scoringAssumed(text, ctx) {
    if (ctx.assume.hasOwnProperty(text)) return ctx.assume[text];
    throw new ScoringFork(text);
}

// Every guard has to hold; one false settles it.
function scoringAll(conditions, ctx) {
    for (var i = 0; i < conditions.length; i++) {
        if (!scoringDecide(conditions[i], ctx)) return false;
    }
    return true;
}

// A group's dice, as a probability. The game's own fraction, never the rounded
// percentage the page prints beside it.
function rollChance(roll) {
    return roll ? roll.num / roll.den : 1;
}

/*
 * One module, walked in source order, into the distribution of what it adds.
 *
 * A group carrying more conditions than are currently open is starting a nested
 * block: its leading conditions become guards every later group must also
 * satisfy, until an `Otherwise` closes the level. That structure is the reason
 * the generator keeps the source's blank lines - flattened, an inner branch
 * fires against a target the outer condition already ruled out.
 *
 * Every condition is answered by the time this runs - by the facts or by the
 * scenario's assumptions - so the only branching left is dice, and the walk is
 * exact. Where the path goes next depends only on the position and three small
 * pieces of state, which is what the memo keys on; a module with a dozen rolls
 * would otherwise walk thousands of identical tails.
 */
function scoreModule(groups, ctx) {
    var memo = {};
    // The guards are the same whichever way a path reached a group, so they are
    // worked out once up front rather than carried.
    var guardsAt = [];
    var open = [];
    groups.forEach(function(group, i) {
        var conditions = (group.when || []).map(function(c) { return MOVE_SCORING_CONDITIONS[c]; });
        guardsAt[i] = open;
        if (!conditions.length) return;
        var isElse = /^Otherwise$/i.test(conditions[conditions.length - 1]);
        var here = open.concat(conditions.slice(0, conditions.length - 1));
        open = isElse ? open.slice(0, -1) : here;
    });

    /*
     * `fired`: whether a branch at this level already went, which is what an
     * `Otherwise` asks. `last`: what the group just before awarded, which a few
     * modules chain on with "did not receive a score +1 in the previous check" -
     * exact now, since each path knows how its own roll landed. `prev`: whether
     * the group just before fired at all, which is all a follow-on asks.
     */
    function walk(index, fired, last, prev) {
        if (index >= groups.length) return pointDist(0);
        var key = index + "|" + fired + "|" + last + "|" + prev;
        if (memo[key]) return memo[key];
        var result = step(index, fired, last, prev);
        memo[key] = result;
        return result;
    }

    function step(index, fired, last, prev) {
        var group = groups[index];
        var conditions = (group.when || []).map(function(c) { return MOVE_SCORING_CONDITIONS[c]; });
        var isElse = conditions.length > 0 && /^Otherwise$/i.test(conditions[conditions.length - 1]);
        ctx.lastScore = last;

        /*
         * A group with no condition is one of three things. A gate on its own -
         * "With a 50% chance: no change and terminate" - is a roll on nothing, so
         * it always applies. A follow-on carries on the block above it and runs
         * only when that did. Anything else is a line the page leaves unplaced,
         * with nothing to say which block it belongs to, so whether it applies
         * is an open question like any other unknown.
         */
        var applies;
        if (!conditions.length) {
            if (group.gate) applies = true;
            else if (group.follows) applies = prev;
            else applies = scoringAssumed(ctx.unplaced(index + 1), ctx);
        } else {
            var guards = guardsAt[index].concat(conditions.slice(0, conditions.length - 1));
            if (!scoringAll(guards, ctx)) {
                // A guard that is false skips the group without testing anything.
                return walk(index + 1, isElse ? fired : false, last, false);
            }
            /*
             * An `Otherwise` only fires when no earlier branch at this level did.
             * Every other outcome terminates, so reaching it normally means none
             * has - but a `continue` outcome can leave one behind, which `fired`
             * tracks.
             */
            applies = isElse ? !fired : scoringDecide(conditions[conditions.length - 1], ctx);
        }

        var firedAfter = isElse ? fired : true;
        var skipped = function() {
            return walk(index + 1, fired, conditions.length ? 0 : last, false);
        };
        if (!applies) return skipped();

        /*
         * Two kinds of dice, and they are not the same thing.
         *
         * An inline chance - "68.8% chance of score +2 and terminate" - rolls the
         * *score* only. The rule has fired either way, so it ends the module
         * whether or not the roll lands.
         *
         * A gate - "With a 78.1% chance: no scoring change and terminate" - rolls
         * whether the rule fires *at all*. Miss it and the walk carries on to the
         * next rule as though the condition had been false. Read the other way,
         * that Acid Armor line would be a rule that does nothing, which is how it
         * was wrongly read before: as a certain stop at 0 on every roll.
         */
        var gate = rollChance(group.gate);
        var outcome = group.outcome || {score: 0, terminate: false};
        var score = outcome.score || 0;
        var lands = rollChance(outcome.chance);

        var fires = {};
        [[lands, score], [1 - lands, 0]].forEach(function(pair) {
            if (!pair[0]) return;
            var rest = outcome.terminate ? pointDist(0) : walk(index + 1, firedAfter, pair[1], true);
            mixInto(fires, rest, pair[1], pair[0]);
        });
        if (gate >= 1) return fires;

        var out = mixInto({}, fires, 0, gate);
        return mixInto(out, skipped(), 0, 1 - gate);
    }

    return walk(0, false, undefined, false);
}

/*
 * Every scenario a move's unknowns open, each an exact score distribution over
 * all the modules that run.
 *
 * Walked afresh per scenario rather than branched in place, so an unknown asked
 * in two modules gets one answer across both. A scenario that adds nothing new
 * is dropped - most unknowns turn out not to change the total.
 */
function moveScenarios(entry, modules, facts, move) {
    var found = [];
    var seen = {};
    var unknowns = [];
    var queue = [{}];
    var runs = 0;
    var read = {};

    while (queue.length) {
        if (++runs > SCORING_SCENARIO_CAP) return {dists: found, capped: true, unknowns: unknowns};
        var assume = queue.pop();
        try {
            var total = pointDist(0);
            var parts = {};
            modules.forEach(function(key) {
                var mod = entry && entry.modules[key];
                if (!mod || !mod.groups.length) return;
                var got = scoreModule(mod.groups, {
                    facts: facts, move: move, assume: assume, read: read,
                    unplaced: function(n) {
                        return "Whether rule " + n + " of " + key + " applies - the source page doesn't say which block it is in";
                    }
                });
                parts[key] = got;
                total = convolveDist(total, got);
            });
            var sig = JSON.stringify(distScores(total).map(function(s) { return [s, total[s].toFixed(9)]; }));
            if (!seen[sig]) {
                seen[sig] = true;
                found.push({total: total, parts: parts});
            }
        } catch (e) {
            if (!(e instanceof ScoringFork)) throw e;
            if (unknowns.indexOf(e.text) < 0) unknowns.push(e.text);
            [false, true].forEach(function(answer) {
                var next = Object.assign({}, assume);
                next[e.text] = answer;
                queue.push(next);
            });
        }
    }
    return {dists: found, capped: false, unknowns: unknowns};
}

/* --------------------------------------------------------------- the whole */

/*
 * Which modules run for this trainer. The flags in trainer_flags.js are the
 * game's own switch, and they are the reason the same move scores differently
 * against a Youngster and a gym leader.
 */
function scoringModulesFor(trainer, format) {
    var flags = GAME.aiFlags()[trainer] || {};
    var doubles = format && format.slots > 1;
    return Object.keys(MOVE_SCORING_FLAGS).filter(function(key) {
        if (!flags[MOVE_SCORING_FLAGS[key]]) return false;
        /*
         * The game scores every move against every target, and the two doubles
         * modules belong to different targets: `doublesOpponent` to somebody
         * across the field, `doublesAlly` to the Pokemon standing beside it.
         *
         * This only ever scores against an opponent, so the ally module is left
         * out entirely rather than only in singles. Included, it read as a flat
         * -30 on everything - it is mostly the rule that says don't hit your own
         * team-mate - and buried the real ranking under it.
         */
        if (key === "doublesAlly") return false;
        if (!doubles && key === "doublesOpponent") return false;
        return true;
    });
}

/*
 * The scoring entry for a move, taking the variable-type moves to the variant
 * the site scores separately - a rain-fed Weather Ball is scored as a Water
 * move, not as the Normal one the table lists.
 */
function scoringEntryFor(move, resolvedType) {
    if (resolvedType && MOVE_SCORING[move.id + ":" + toID(resolvedType)]) {
        return MOVE_SCORING[move.id + ":" + toID(resolvedType)];
    }
    return MOVE_SCORING[move.id] || null;
}

/*
 * Every move a slot could pick, scored and ranked.
 *
 * Returns null when there is nothing to say - no scoring data, no target, or a
 * trainer with no flags at all, which is a real thing in this game and means
 * the AI picks at random.
 */
function scoreMovesFor(line, node, state, side, slot, targetSlot) {
    var trainer = trainerForSlot(line, side, slot);
    if (!trainer || typeof MOVE_SCORING === "undefined") return null;

    var format = battleFormat(line.trainer);
    var modules = scoringModulesFor(trainer, format);
    var facts = scoringFactsFor(line, node, state, side, slot, targetSlot);
    if (!facts || !facts.moves.length) return null;

    var rows = facts.moves.map(function(move) {
        var found = findMove(move.name);
        var entry = found ? scoringEntryFor(found, move.type) : null;
        var scen = moveScenarios(entry, modules, facts, move);
        var totals = scen.dists.map(function(d) { return d.total; });

        /*
         * Past the cap some scenarios were never walked, and nothing is known
         * about what they score - so the move is bounded by nothing at all, and
         * pulls every rival's range open with it. Honest, and far rarer than it
         * sounds: no real moveset has come near it.
         */
        var env = scen.capped || !totals.length
            ? {low: pointDist(-Infinity), high: pointDist(Infinity)}
            : envelopeDists(totals);

        // The score itself, as the old band: lowest and highest over everything.
        function span(dists) {
            var all = [];
            dists.forEach(function(d) { all = all.concat(distScores(d)); });
            return {lo: Math.min.apply(null, all), hi: Math.max.apply(null, all)};
        }
        var band = span(totals.length ? totals : [pointDist(0)]);
        var breakdown = modules.filter(function(key) {
            return scen.dists.some(function(d) { return d.parts[key]; });
        }).map(function(key) {
            var got = span(scen.dists.map(function(d) { return d.parts[key] || pointDist(0); }));
            return {module: key, lo: got.lo, hi: got.hi};
        });

        return {
            name: move.name,
            id: move.id,
            type: move.type,
            eff: move.eff,
            damage: move.damage,
            kos: move.kos,
            lo: band.lo,
            hi: band.hi,
            breakdown: breakdown,
            // The exact spread of scores, when no unknown split it in two.
            dist: totals.length === 1 && !scen.capped ? totals[0] : null,
            unknowns: scen.unknowns,
            capped: scen.capped,
            env: env,
            scored: !!entry
        };
    });

    /*
     * The chance each move is the one picked, as a range. One number when no
     * unknown touches the moves that matter; otherwise the lowest and highest
     * any scenario allows. A move is ruled out only at a certain zero - its best
     * case cannot reach what a rival is guaranteed - which is the same line the
     * old band verdict drew, and the only thing this is willing to rule out.
     */
    function settle(p) {
        return p < 1e-9 ? 0 : p > 1 - 1e-9 ? 1 : p;
    }
    rows.forEach(function(r, i) {
        var others = rows.filter(function(o, j) { return j !== i; });
        r.chanceLo = settle(pickChance(r.env.low, others.map(function(o) { return o.env.high; })));
        r.chanceHi = settle(pickChance(r.env.high, others.map(function(o) { return o.env.low; })));
        r.candidate = r.chanceHi > 0;
    });
    rows.sort(function(a, b) {
        return (b.chanceHi - a.chanceHi) || (b.chanceLo - a.chanceLo) || (b.hi - a.hi);
    });

    var winners = rows.filter(function(r) { return r.candidate; });
    return {
        trainer: trainer,
        modules: modules,
        rows: rows,
        winners: winners,
        // One name only when it is picked on every roll and every scenario.
        certain: rows.some(function(r) { return r.chanceLo === 1; })
    };
}

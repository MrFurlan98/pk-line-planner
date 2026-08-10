/*
 * Damage: the planner's derived state handed to @smogon/calc.
 *
 * The model stays pure state derivation and knows nothing about the calculator;
 * this is the only file that builds calc objects. That division is worth keeping
 * - everything the calculator needs is already derived, so the whole job here is
 * translation plus a cache.
 *
 * Gen 4 in this fork *is* Platinum Kaizo: calc/src/data/moves.ts builds its
 * gen-4 table by patching DPP with the hack's changes and deleting the moves it
 * removes, and species.ts does the same to the base stats. So a plain
 * calc.calculate(4, ...) already returns Kaizo numbers rather than vanilla ones.
 *
 * GAME.gen is read rather than the global `gen`, which follows the calculator
 * tab's generation dropdown: flipping that must not quietly change what the
 * planner says about a Platinum Kaizo fight.
 */

function calcGen() {
    return GAME.gen;
}

/*
 * The Box editor saves level, IVs and EVs straight out of its input fields, so a
 * hand-entered Pokémon has them as *strings* - "18", not 18. That has to be
 * undone here, because the stat formulas mix `*` and `+` and only one of those
 * coerces: gen 4's HP is `(2*base + iv + ev/4) * level / 100 + level + 10`, so a
 * string IV concatenates instead of adding and a Psyduck ends up with 25806
 * Special Attack and "180551810" HP. Every damage figure on the card then reads
 * either KO or 0-0, which is how this was found.
 *
 * Fixing where the Box writes it (box-controls.js) stops new sets being saved
 * that way, but every set already in a Box is still a string, so the coercion
 * has to live here too rather than only there.
 */
function numberOr(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
}

/*
 * Sets store stats under the game's own short names (at/df/sa/sd/sp); calc wants
 * atk/def/spa/spd/spe. The fallbacks match what createPokemon uses for a stored
 * set - perfect IVs, no EVs - so a slot that says nothing about a stat gets the
 * same number the calculator tab would give it.
 */
function calcStatsOf(legacy, fallback) {
    var out = {hp: fallback, atk: fallback, def: fallback, spa: fallback, spd: fallback, spe: fallback};
    for (var key in legacy || {}) {
        var stat = legacyStatToStat(key);
        if (stat && out[stat] !== undefined) out[stat] = numberOr(legacy[key], fallback);
    }
    return out;
}

/*
 * calc copies every key it is handed straight onto the Pokémon's boosts, and
 * accuracy and evasion are not stats it knows about - they belong to the plan,
 * not to the damage - so they are dropped rather than passed through.
 */
const CALC_BOOSTS = ["atk", "def", "spa", "spd", "spe"];

function calcBoostsOf(boosts) {
    var out = {};
    CALC_BOOSTS.forEach(function(stat) {
        if (boosts && boosts[stat]) out[stat] = boosts[stat];
    });
    return out;
}

/*
 * A calc Pokémon for whoever is standing in a slot, carrying the state the
 * planner has already worked out for it.
 */
function calcPokemonFor(line, node, state, side, slot) {
    var entry = slotSet(line, node, side, slot);
    if (!entry) return null;

    var set = entry.set;
    var mon = monState(state, side, monAt(node, side, slot));

    var options = {
        // 100 to match what the Box and createPokemon assume for a set with none.
        level: numberOr(set.level, 0) || 100,
        gender: getGender(set.gender),
        ability: set.ability,
        abilityOn: true,
        item: set.item || "",
        nature: set.nature,
        ivs: calcStatsOf(set.ivs, 31),
        evs: calcStatsOf(set.evs, 0),
        boosts: calcBoostsOf(mon.boosts),
        status: mon.status || "",
        /*
         * statusTurns counts turns elapsed, so it reads 0 on the turn the poison
         * lands - but that turn already takes a tick of damage, which is the 1
         * this adds. Anything else has no counter.
         */
        toxicCounter: mon.status === "tox" ? (mon.statusTurns || 0) + 1 : 0
    };
    var pokemon = new calc.Pokemon(calcGen(), entry.species, options);

    /*
     * Roost takes Flying off its user for the rest of the turn, which is the
     * whole reason to Roost into a Rock or Electric move.
     *
     * It has to be rebuilt rather than patched: calculate() clones both Pokemon
     * before touching them, and clone() re-derives the types from the species, so
     * assigning to `.types` afterwards is silently thrown away. The override goes
     * through the constructor instead - and carries an explicit null second type,
     * because `overrides` is deep-merged into the species and a shorter array
     * would simply leave the original second type showing through at index 1.
     */
    var lost = state.losesType && state.losesType[side + slot];
    if (lost) {
        var kept = (pokemon.types || []).filter(function(t) { return toID(t) !== lost; });
        /*
         * Something left with no type at all keeps what it had. A pure Flying
         * type that Roosts is Normal in this generation, and a typeless Pokemon
         * would be further from the truth than leaving it alone.
         */
        if (kept.length && kept.length < pokemon.types.length) {
            options.overrides = {types: [kept[0], null]};
            pokemon = new calc.Pokemon(calcGen(), entry.species, options);
        }
    }

    /*
     * calc defaults current HP to zero rather than to full, which would make
     * every KO chance read as a guaranteed OHKO, so this always has to be set.
     *
     * Where HP has been carried down the line it is a range, and the value used
     * is the top of it - the most health this Pokemon could still have. That
     * keeps a claimed KO conservative: "KO" on a card means it dies even on the
     * roll that treated it best.
     */
    var hp = hpOf(mon);
    pokemon.originalCurHP = hp ? Math.max(0, hp.max) : pokemon.maxHP();
    return pokemon;
}


/*
 * Max HP for a slot, which the model needs to put a Pokemon on a scale the first
 * time anything damages it. 0 when the slot won't resolve, which the model reads
 * as "no scale to express this on" and leaves the HP alone.
 */
function maxHpFor(line, node, state, side, slot) {
    var pokemon = calcPokemonFor(line, node, state, side, slot);
    return pokemon ? pokemon.maxHP() : 0;
}

/*
 * The speed a slot actually moves at, after everything that changes it: stat
 * stages, paralysis (a quarter in this generation, not the half it became in
 * gen 7), Choice Scarf, the weather abilities, Tailwind.
 *
 * calc's own getFinalSpeed rather than a reimplementation, so the planner's turn
 * order and the calculator's can't drift apart. 0 for a slot that won't resolve,
 * which the model treats as "no idea" rather than "slowest".
 */
function speedFor(line, node, state, side, slot) {
    // Blind mode gives every slot the same unknown speed, so nothing can be
    // ordered and nothing can be denied for losing a race.
    if (blindMode()) return 0;
    var pokemon = calcPokemonFor(line, node, state, side, slot);
    if (!pokemon) return 0;
    try {
        var field = calcFieldFor(line, state, side);
        return calc.getFinalSpeed(calc.Generations.get(calcGen()), pokemon, field, field.attackerSide);
    } catch (e) {
        return 0;
    }
}

/*
 * Side conditions belong to whoever owns them - a Reflect protects the side that
 * set it - so the defender's screens go on defenderSide, which is what makes
 * Brick Break's exception show up in the numbers.
 *
 * The hazard keys are already calc's own property names: the generated move
 * effect table writes `spikes`, `isSR`, `isReflect` and `isLightScreen` straight
 * through. `toxicSpikes` is the one that isn't, and calc has nowhere to put it -
 * it does no damage, only status, which the model handles itself.
 */
function calcSideOf(side) {
    var hazards = (side && side.hazards) || {};
    return new calc.Side({
        spikes: hazards.spikes || 0,
        isSR: !!hazards.isSR,
        // A timed condition's stored value counts the turns it has left, so any
        // positive number means it is still up.
        isReflect: !!hazards.isReflect,
        isLightScreen: !!hazards.isLightScreen,
        // Doubles the side's Speed, which getFinalSpeed applies for us.
        isTailwind: !!hazards.isTailwind
    });
}

function calcFieldFor(line, state, attacker) {
    var defender = attacker === "you" ? "them" : "you";
    return new calc.Field({
        // Which is what gets a spread move its reduction in a double.
        gameType: slotCount(line) > 1 ? "Doubles" : "Singles",
        weather: state.weather || undefined,
        attackerSide: calcSideOf(state[attacker]),
        defenderSide: calcSideOf(state[defender])
    });
}

/*
 * The planner's move table carries `calcName` precisely because the two
 * spellings diverge, so that is what calc is asked for - and only after checking
 * it exists, since Platinum Kaizo deletes a good number of moves outright and a
 * stale plan can still name one.
 */
function calcMoveFor(moveName, holder, isCrit) {
    var move = findMove(moveName);
    if (!move || move.category === "status") return null;

    var name = move.calcName || move.name;
    var table = calc.MOVES[calcGen()];
    if (!table || !table[name]) return null;

    return new calc.Move(calcGen(), name, {
        ability: holder ? holder.ability : "",
        item: holder ? holder.item : "",
        isCrit: !!isCrit
    });
}

/*
 * What one move off one slot does to whoever it lands on.
 *
 * Returns null whenever there is no honest number to give - a status move, an
 * empty slot opposite, a move this game doesn't have - so callers can fall back
 * to showing base power rather than a zero that reads like an immunity.
 */
function damageAgainst(line, node, state, side, slot, targetSlot, moveName, isCrit) {
    var attacker = calcPokemonFor(line, node, state, side, slot);
    if (!attacker) return null;

    var other = side === "you" ? "them" : "you";
    var defender = calcPokemonFor(line, node, state, other, targetSlot);
    if (!defender) return null;

    var move = calcMoveFor(moveName, activeHolder(line, node, side, slot), isCrit);
    if (!move) return null;

    /*
     * A set naming a Pokémon, ability or item this game doesn't have will throw
     * from inside calc. One bad slot shouldn't take the whole canvas down with
     * it, so it simply goes back to showing base power.
     */
    try {
        var result = calc.calculate(calcGen(), attacker, defender, move, calcFieldFor(line, state, side));
        var range = result.range();
        if (!range || !range[1]) return null;

        var full = defender.maxHP();
        /*
         * What the move costs or gives back its own user.
         *
         * Drain, Shell Bell and Pain Split come from calc's getRecovery, whose
         * `recovery` array is already exact HP - only its `text` is a percentage
         * - so Big Root and the healing cap come for free.
         *
         * Recoil is worked out here instead. calc's getRecoil returns a rounded
         * percentage and says so in its own source ("TODO: return recoil damage
         * as exact HP"), and turning that back into HP loses a point or two per
         * hit, which then compounds down the line. The move carries its own
         * fraction, and the damage is already exact, so the honest sum is short.
         */
        var recovery = result.recovery().recovery || [0, 0];
        var recoil = [0, 0];
        if (move.recoil && !attacker.hasAbility("Rock Head") && !attacker.hasAbility("Magic Guard")) {
            var left = Math.max(0, defender.curHP());
            [0, 1].forEach(function(i) {
                // Recoil is taken off the damage that actually landed, so a move
                // that overkills only recoils for what it needed.
                var dealt = Math.min(i === 0 ? range[0] : range[1], left);
                recoil[i] = Math.floor(dealt * move.recoil[0] / move.recoil[1]);
            });
        }
        // Life Orb is a flat tenth of the holder's own health, damage regardless.
        if (toID(attacker.item || "") === "lifeorb" && !attacker.hasAbility("Magic Guard")) {
            var orb = Math.floor(attacker.maxHP() / 10);
            recoil[0] += orb;
            recoil[1] += orb;
        }
        /*
         * Two different denominators, on purpose. The percentage is of *max* HP,
         * which is what a damage figure conventionally means and what keeps a
         * move's number stable as the fight wears on. Whether it kills is against
         * what the target has *left*, which is the whole point of carrying HP.
         */
        var left = hpOf(monState(state, other, monAt(node, other, targetSlot))) ||
            {min: full, max: full};
        return {
            lo: range[0],
            hi: range[1],
            full: full,
            loPct: range[0] * 100 / full,
            hiPct: range[1] * 100 / full,
            // Dead even on the roll that treated it best, versus dead on some.
            kills: range[0] >= left.max,
            mayKill: range[1] >= left.min,
            // What the move does to its own user: [min, max] in real HP.
            recoil: recoil,
            recovery: [recovery[0] || 0, recovery[1] || 0],
            /*
             * The calculator's own full sentence, which already ends with the KO
             * chance - so that isn't pulled out separately until something needs
             * it structured rather than as prose.
             */
            desc: result.fullDesc("%", false)
        };
    } catch (e) {
        return null;
    }
}

/*
 * A spread move lands on both opposing slots; the number on the card is against
 * the one across from the user, which is the matchup the card is laid out to be
 * read across. The spread reduction still applies, from the game type.
 */
function damageFor(line, node, state, side, slot, moveName, isCrit) {
    var target = targetsOf(node, side, slot, moveName, aimAt(node, side, slot))[0];
    return damageAgainst(line, node, state, side, slot, target, moveName, isCrit);
}

/*
 * Takes a move's damage off everything it lands on. This is the hook applyTurn
 * calls, and the only route by which HP ever goes down.
 *
 * Every target gets its own calculation rather than sharing the primary one: in
 * a double the two opposing slots are different Pokemon with different typing
 * and different defences, so one number would be wrong for at least one of them.
 */
function foldDamage(line, node, state, side, slot, targets, moveName, crits) {
    // Nothing is subtracted in blind mode, so no HP is ever carried and no bar
    // can appear. The rest of the turn still folds in exactly as it did.
    if (blindMode()) return;
    var other = side === "you" ? "them" : "you";
    var isCrit = !!(crits && crits[side]);
    var backOnUser = null;

    /*
     * Future Sight and Doom Desire work their damage out now, against whoever is
     * standing opposite now, and land it two turns later on whatever is standing
     * there by then. So the number is settled here and queued rather than taken
     * off - and nothing recoils or drains from a hit that hasn't happened.
     */
    var move = findMove(moveName);
    var delayed = move && typeof MOVE_EFFECTS !== "undefined" && MOVE_EFFECTS[move.id] &&
        MOVE_EFFECTS[move.id].delayed;

    targets.forEach(function(target) {
        var damage = damageAgainst(line, node, state, side, slot, target, moveName, isCrit);
        if (!damage) return;
        if (delayed) {
            /*
             * The middle of the roll, not the band. Two turns of uncertainty on
             * top of everything else would widen the range past being useful, and
             * the number was fixed the moment the move went off - it just hasn't
             * arrived yet.
             */
            state[other].pending[target].push({
                turns: delayed.turns,
                amount: Math.floor((damage.lo + damage.hi) / 2),
                kind: "damage",
                name: move.name
            });
            return;
        }
        var mon = ensureHp(line, node, state, other, target);
        if (mon) damageMon(mon, damage.lo, damage.hi, damage.full);
        /*
         * Recoil and drain are the user's, not the target's, so a spread move
         * doesn't pay them twice. The first target it actually connected with
         * settles it - which is the only one for every move that has either.
         */
        if (!backOnUser && !delayed) backOnUser = damage;
    });

    if (!backOnUser) return;
    var user = ensureHp(line, node, state, side, slot);
    if (!user) return;
    /*
     * The bands cross over: the user is worst off when it drained least and
     * recoiled most, so the low end of its health takes the high end of the
     * recoil and the low end of the drain.
     */
    if (backOnUser.recoil[1] > 0) damageMon(user, backOnUser.recoil[0], backOnUser.recoil[1], user.hp.full);
    if (backOnUser.recovery[1] > 0) healMon(user, backOnUser.recovery[0], backOnUser.recovery[1]);
}

/*
 * What the card asks for. Each move is calculated once per render and not
 * memoised: a plan's damage depends on so much of the state around it that any
 * cache key short of the whole turn would eventually serve a stale number, and a
 * stale number here is worse than a slow one.
 */
function plannerDamage(line, node, state, side, slot, moveName) {
    if (!moveName || typeof calc === "undefined" || blindMode()) return null;
    return damageFor(line, node, state, side, slot, moveName);
}

/*
 * How a roll reads on a card. Rounded to whole percent because the plan is a
 * decision, not a spreadsheet - the exact rolls are in the tooltip.
 *
 * A move that kills on every roll says so instead of giving a number. Past the
 * KO the range stops informing anything - Kaizo overkill runs to "222-265", and
 * whether it is that or half of it changes no plan - and it is the one case wide
 * enough to push a long move name into an ellipsis.
 *
 * The range that *does* matter is the one straddling the KO, and that is the
 * case still shown in full: it is exactly the fork a "You KO / You don't KO"
 * branch is drawn for.
 *
 * No percent sign anywhere: it costs real width and carries no meaning here. A
 * range with a dash in it never reads as the base power it replaced, and the
 * tooltip spells the unit out in full.
 */
function damageText(damage) {
    if (damage.kills) return "KO";
    return `${Math.round(damage.loPct)}–${Math.round(damage.hiPct)}`;
}

/*
 * Lethality, as a class. A KO is good news or bad news depending on who is
 * throwing the move, so the side is part of it - the same directional reading
 * the branch conditions use.
 */
function damageClass(damage) {
    if (damage.kills) return " kills";
    if (damage.mayKill) return " maykill";
    return "";
}

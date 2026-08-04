/*
 * Game adapters.
 *
 * The calculator's data tables are loaded as globals (SETDEX_PK, PARTY_ORDER_PK,
 * TRAINER_AI_FLAGS_PK, ...). Anything that should eventually support more than
 * one game reads them through GAME instead of touching those globals directly,
 * so adding a second game means adding an entry below rather than editing every
 * caller. The tables are wrapped in functions because this file loads before
 * they do.
 */

/*
 * The production image set lives in a separate private repository which is
 * checked out into src/img at deploy time (see .forgejo/workflows), so a fork
 * has no local sprites and every /img/dex request 404s. These resolvers point
 * at Showdown's CDN instead, which is keyed by name like our own data is.
 */
const SHOWDOWN_SPRITES = {
    base: "https://play.pokemonshowdown.com/sprites",

    /*
     * Showdown collapses a name down to alphanumerics, except for formes, which
     * keep one hyphen between the base species and the forme: "wormadam-sandy",
     * but "porygonz" and "nidoranf", which only look like formes. baseSpecies
     * is what tells the two apart.
     */
    speciesName: function(species) {
        if (!species.baseSpecies) return toID(species.name);
        var split = species.name.indexOf("-");
        if (split < 0) return toID(species.name);
        return toID(species.baseSpecies) + "-" + toID(species.name.slice(split + 1));
    },

    species: function(species) {
        return `${this.base}/gen4/${this.speciesName(species)}.png`;
    },

    // Icons are indexed by dex number, so formes fall back to their base sprite.
    speciesIcon: function(species) {
        return `${this.base}/gen5icons/${species.num}.png`;
    },

    type: function(type) {
        return `${this.base}/types/${type.charAt(0).toUpperCase()}${type.slice(1)}.png`;
    },

    category: function(category) {
        return `${this.base}/categories/${category.charAt(0).toUpperCase()}${category.slice(1)}.png`;
    },

    // Item icons use the display name rather than the id, hyphenated: our
    // items.js already stores that spelling as `name` ("BrightPowder" is one
    // word, "King's Rock" is two), so the same rule covers both.
    item: function(item) {
        var name = item.name.toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/ +/g, "-");
        return `${this.base}/itemicons/${name}.png`;
    },

    /*
     * Machines have no per-number icon on the CDN - there is no "tm02.png" -
     * but there is one per type, which is what the games themselves use, since
     * a machine's colour is its move's type. `kind` is "tm" or "hm".
     */
    machine: function(kind, type) {
        return `${this.base}/itemicons/${kind}-${type.toLowerCase()}.png`;
    }
};

const GAMES = {
    platinumkaizo: {
        id: "platinumkaizo",
        name: "Pokémon Platinum Kaizo",
        gen: 4,
        setdex: () => SETDEX_PK,
        partyOrder: () => PARTY_ORDER_PK,
        aiFlags: () => TRAINER_AI_FLAGS_PK,
        fieldFlags: () => FLAGS_PK,
        locations: () => LOCATIONS,
        species: () => SPECIES,
        sprites: SHOWDOWN_SPRITES,
        /*
         * Trainer keys in party_order/sets carry placeholders for the rival's
         * starter, which depends on the one you picked in Settings: the key
         * "Barry #1 [{RIVAL_STARTER_1}]" is an alias for whichever of the
         * "[Chimchar]" / "[Piplup]" / "[Turtwig]" keys actually applies.
         *
         * shared_controls.js assigns these globals but nothing reads them, so
         * the aliased entries currently resolve to empty parties. Resolving
         * them here keeps that fix local to callers that need it.
         */
        variables: {
            "{RIVAL_STARTER_1}": () => RIVAL_STARTER_1,
            "{RIVAL_STARTER_2}": () => RIVAL_STARTER_2,
            "{RIVAL_STARTER_3}": () => RIVAL_STARTER_3,
            "{RIVAL2_STARTER_1}": () => RIVAL2_STARTER_1,
            "{RIVAL2_STARTER_2}": () => RIVAL2_STARTER_2,
            "{RIVAL2_STARTER_3}": () => RIVAL2_STARTER_3,
            "{RIVAL2_NAME}": () => RIVAL2_NAME
        }
    }
};

var GAME = GAMES.platinumkaizo;

/*
 * How many Pokémon each side has out, and who else is involved. Three formats
 * live under FLAGS_PK.battleType and they are genuinely different fights:
 *
 *   double      two trainers fought at once
 *   trueDouble  a real 2v2 against one trainer
 *   tag         2v2 with an AI partner you don't command
 */
function battleFormat(trainerName) {
    var flags = GAME.fieldFlags();
    var types = (flags && flags.battleType) || {};

    var tag = (types.tag || []).find(function(entry) {
        return resolveTrainerName(entry.enemy1) === trainerName ||
            resolveTrainerName(entry.enemy2) === trainerName;
    });
    if (tag) {
        return {
            id: "tag", slots: 2,
            trainers: [resolveTrainerName(tag.enemy1), resolveTrainerName(tag.enemy2)].filter(x => x),
            partner: resolveTrainerName(tag.partner)
        };
    }

    var pair = (types.double || []).find(function(entry) {
        return resolveTrainerName(entry.enemy1) === trainerName ||
            resolveTrainerName(entry.enemy2) === trainerName;
    });
    if (pair) {
        return {
            id: "double", slots: 2,
            trainers: [resolveTrainerName(pair.enemy1), resolveTrainerName(pair.enemy2)].filter(x => x)
        };
    }

    if (types.trueDouble && Object.prototype.hasOwnProperty.call(types.trueDouble, trainerName)) {
        return {id: "trueDouble", slots: 2, trainers: [trainerName]};
    }

    return {id: "single", slots: 1, trainers: [trainerName]};
}

// Substitutes any {PLACEHOLDER} in a trainer key for its current value.
function resolveTrainerName(name) {
    var resolved = name;
    for (var placeholder in GAME.variables) {
        if (resolved.indexOf(placeholder) < 0) continue;
        var value = GAME.variables[placeholder]();
        if (!value) return "";
        resolved = resolved.split(placeholder).join(value);
    }
    return resolved;
}

/*
 * Every trainer, with the aliased entries collapsed onto the concrete ones they
 * point at. Returns [{name, party}] in game order.
 */
function trainerList() {
    var partyOrder = GAME.partyOrder();
    var seen = {};
    var trainers = [];
    for (var name in partyOrder) {
        var resolved = resolveTrainerName(name);
        if (!resolved || seen[resolved]) continue;
        var party = partyOrder[resolved];
        if (!party || !party.length) continue;
        seen[resolved] = true;
        trainers.push({name: resolved, party: party});
    }
    return trainers;
}

// Convenience wrappers, so callers don't repeat the GAME.sprites dance.
function spriteFor(speciesId) {
    var species = GAME.species()[toID(speciesId)];
    if (!species) return "";
    return GAME.sprites.species(species);
}

function typeSpriteFor(type) {
    return GAME.sprites.type(type);
}

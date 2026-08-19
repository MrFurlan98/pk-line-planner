/*
 * Held items that change state the planner tracks - HP and stat stages.
 * Damage-only items are deliberately absent, since @smogon/calc already
 * implements those, and so is anything probabilistic: a Focus Band is a 10%
 * chance to live, which is not a thing a plan may rest on.
 *
 * `threshold` is [numerator, denominator] of max HP, and its absence means the
 * item fires on arrival instead. `heal` is either exact `points` or a
 * `fraction` of the maximum, never a decimal.
 *
 * Generated from item descriptions and hand-checked. Regenerate with
 * tools/gen-item-effects.js if the item data changes.
 */
const ITEM_EFFECTS = {
    "berryjuice": {
        "threshold": [
            50,
            100
        ],
        "heal": {
            "points": 20
        },
        "name": "Berry Juice",
        "consumed": true
    },
    "berserkgene": {
        "boost": {
            "atk": 1
        },
        "immediate": true,
        "name": "Berserk Gene",
        "consumed": true
    },
    "ragecandybar": {
        "threshold": [
            50,
            100
        ],
        "heal": {
            "points": 100
        },
        "name": "RageCandyBar",
        "consumed": true
    },
    "oranberry": {
        "threshold": [
            50,
            100
        ],
        "heal": {
            "points": 10
        },
        "name": "Oran Berry",
        "consumed": true
    },
    "sitrusberry": {
        "threshold": [
            50,
            100
        ],
        "heal": {
            "fraction": [
                1,
                4
            ]
        },
        "name": "Sitrus Berry",
        "consumed": true
    },
    "figyberry": {
        "threshold": [
            50,
            100
        ],
        "heal": {
            "fraction": [
                1,
                8
            ]
        },
        "confusesNature": "Atk",
        "name": "Figy Berry",
        "consumed": true
    },
    "wikiberry": {
        "threshold": [
            50,
            100
        ],
        "heal": {
            "fraction": [
                1,
                8
            ]
        },
        "confusesNature": "SpA",
        "name": "Wiki Berry",
        "consumed": true
    },
    "magoberry": {
        "threshold": [
            50,
            100
        ],
        "heal": {
            "fraction": [
                1,
                8
            ]
        },
        "confusesNature": "Spe",
        "name": "Mago Berry",
        "consumed": true
    },
    "aguavberry": {
        "threshold": [
            50,
            100
        ],
        "heal": {
            "fraction": [
                1,
                8
            ]
        },
        "confusesNature": "SpD",
        "name": "Aguav Berry",
        "consumed": true
    },
    "iapapaberry": {
        "threshold": [
            50,
            100
        ],
        "heal": {
            "fraction": [
                1,
                8
            ]
        },
        "confusesNature": "Def",
        "name": "Iapapa Berry",
        "consumed": true
    },
    "occaberry": {
        "resists": {
            "type": "fire"
        },
        "name": "Occa Berry",
        "consumed": true
    },
    "passhoberry": {
        "resists": {
            "type": "water"
        },
        "name": "Passho Berry",
        "consumed": true
    },
    "wacanberry": {
        "resists": {
            "type": "electric"
        },
        "name": "Wacan Berry",
        "consumed": true
    },
    "rindoberry": {
        "resists": {
            "type": "grass"
        },
        "name": "Rindo Berry",
        "consumed": true
    },
    "yacheberry": {
        "resists": {
            "type": "ice"
        },
        "name": "Yache Berry",
        "consumed": true
    },
    "chopleberry": {
        "resists": {
            "type": "fighting"
        },
        "name": "Chople Berry",
        "consumed": true
    },
    "kebiaberry": {
        "resists": {
            "type": "poison"
        },
        "name": "Kebia Berry",
        "consumed": true
    },
    "shucaberry": {
        "resists": {
            "type": "ground"
        },
        "name": "Shuca Berry",
        "consumed": true
    },
    "cobaberry": {
        "resists": {
            "type": "flying"
        },
        "name": "Coba Berry",
        "consumed": true
    },
    "payapaberry": {
        "resists": {
            "type": "psychic"
        },
        "name": "Payapa Berry",
        "consumed": true
    },
    "tangaberry": {
        "resists": {
            "type": "bug"
        },
        "name": "Tanga Berry",
        "consumed": true
    },
    "chartiberry": {
        "resists": {
            "type": "rock"
        },
        "name": "Charti Berry",
        "consumed": true
    },
    "kasibberry": {
        "resists": {
            "type": "ghost"
        },
        "name": "Kasib Berry",
        "consumed": true
    },
    "habanberry": {
        "resists": {
            "type": "dragon"
        },
        "name": "Haban Berry",
        "consumed": true
    },
    "colburberry": {
        "resists": {
            "type": "dark"
        },
        "name": "Colbur Berry",
        "consumed": true
    },
    "babiriberry": {
        "resists": {
            "type": "steel"
        },
        "name": "Babiri Berry",
        "consumed": true
    },
    "liechiberry": {
        "threshold": [
            25,
            100
        ],
        "boost": {
            "atk": 1
        },
        "name": "Liechi Berry",
        "consumed": true
    },
    "ganlonberry": {
        "boost": {
            "def": 1
        },
        "immediate": true,
        "name": "Ganlon Berry",
        "consumed": true
    },
    "salacberry": {
        "threshold": [
            25,
            100
        ],
        "boost": {
            "spe": 1
        },
        "name": "Salac Berry",
        "consumed": true
    },
    "petayaberry": {
        "threshold": [
            25,
            100
        ],
        "boost": {
            "spa": 1
        },
        "name": "Petaya Berry",
        "consumed": true
    },
    "apicotberry": {
        "boost": {
            "spd": 1
        },
        "immediate": true,
        "name": "Apicot Berry",
        "consumed": true
    },
    "whiteherb": {
        "clearsNegative": true,
        "name": "White Herb",
        "consumed": true
    },
    "toxicorb": {
        "selfStatus": "tox",
        "name": "Toxic Orb",
        "consumed": false
    },
    "flameorb": {
        "selfStatus": "brn",
        "name": "Flame Orb",
        "consumed": false
    },
    "focussash": {
        "survives": {
            "fromFull": true
        },
        "name": "Focus Sash",
        "consumed": true
    }
};

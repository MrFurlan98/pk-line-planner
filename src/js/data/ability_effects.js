/*
 * Abilities that change state the planner tracks - status, stat stages,
 * weather, switching. Damage-only abilities are deliberately absent, since
 * @smogon/calc already implements those.
 *
 * Generated from ability battle text and hand-checked. Regenerate with
 * tools/gen-ability-effects.js if the ability data changes.
 */
const ABILITY_EFFECTS = {
    "drizzle": {
        "onSwitchIn": {
            "weather": "Rain"
        },
        "name": "Drizzle"
    },
    "limber": {
        "blocksStatus": [
            "par"
        ],
        "name": "Limber"
    },
    "voltabsorb": {
        "whenHitBy": {
            "type": "electric",
            "heal": [
                1,
                4
            ]
        },
        "name": "Volt Absorb"
    },
    "waterabsorb": {
        "whenHitBy": {
            "type": "water",
            "heal": [
                1,
                4
            ]
        },
        "name": "Water Absorb"
    },
    "insomnia": {
        "blocksStatus": [
            "slp"
        ],
        "name": "Insomnia"
    },
    "immunity": {
        "blocksStatus": [
            "psn",
            "tox"
        ],
        "name": "Immunity"
    },
    "owntempo": {
        "blocksVolatiles": [
            "confusion"
        ],
        "name": "Own Tempo"
    },
    "intimidate": {
        "onSwitchIn": {
            "opponentBoosts": {
                "atk": -1
            }
        },
        "name": "Intimidate"
    },
    "shadowtag": {
        "traps": "all",
        "name": "Shadow Tag"
    },
    "roughskin": {
        "contactRecoil": {
            "fraction": [
                1,
                8
            ]
        },
        "name": "Rough Skin"
    },
    "clearbody": {
        "blocksDrops": "all",
        "name": "Clear Body"
    },
    "naturalcure": {
        "curesOnSwitchOut": true,
        "name": "Natural Cure"
    },
    "magmaarmor": {
        "blocksStatus": [
            "frz"
        ],
        "name": "Magma Armor"
    },
    "waterveil": {
        "blocksStatus": [
            "brn"
        ],
        "name": "Water Veil"
    },
    "magnetpull": {
        "traps": "steel",
        "name": "Magnet Pull"
    },
    "sandstream": {
        "onSwitchIn": {
            "weather": "Sand"
        },
        "name": "Sand Stream"
    },
    "keeneye": {
        "blocksDrops": [
            "acc"
        ],
        "name": "Keen Eye"
    },
    "hypercutter": {
        "blocksDrops": [
            "atk"
        ],
        "name": "Hyper Cutter"
    },
    "drought": {
        "onSwitchIn": {
            "weather": "Sun"
        },
        "name": "Drought"
    },
    "arenatrap": {
        "traps": "grounded",
        "name": "Arena Trap"
    },
    "vitalspirit": {
        "blocksStatus": [
            "slp"
        ],
        "name": "Vital Spirit"
    },
    "whitesmoke": {
        "blocksDrops": "all",
        "name": "White Smoke"
    },
    "motordrive": {
        "whenHitBy": {
            "type": "electric",
            "boosts": {
                "spe": 1
            }
        },
        "name": "Motor Drive"
    },
    "dryskin": {
        "whenHitBy": {
            "type": "water",
            "heal": [
                1,
                4
            ]
        },
        "name": "Dry Skin"
    },
    "leafguard": {
        "blocksStatus": [
            "psn",
            "tox",
            "par",
            "slp",
            "brn",
            "frz"
        ],
        "requiresWeather": "Sun",
        "name": "Leaf Guard"
    },
    "aftermath": {
        "onFaintRecoil": {
            "fraction": [
                1,
                4
            ],
            "blockedBy": "damp"
        },
        "name": "Aftermath"
    },
    "snowwarning": {
        "onSwitchIn": {
            "weather": "Hail"
        },
        "name": "Snow Warning"
    }
};

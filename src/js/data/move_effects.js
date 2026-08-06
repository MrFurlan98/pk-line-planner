/*
 * Persistent state a move applies - stat boosts, entry hazards, weather,
 * screens - used by the planner to carry state down a line.
 *
 * Generated from move effect text and hand-checked. Regenerate with
 * tools/gen-move-effects.js if the move data changes.
 */
const MOVE_EFFECTS = {
    "vicegrip": {
        "trapsTarget": {
            "expires": true
        },
        "name": "ViceGrip"
    },
    "swordsdance": {
        "self": {
            "atk": 2
        },
        "name": "Swords Dance"
    },
    "mysticalfire": {
        "target": {
            "spa": -1
        },
        "name": "Mystical Fire"
    },
    "sandattack": {
        "target": {
            "acc": -1
        },
        "name": "Sand-Attack"
    },
    "wrap": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Wrap"
    },
    "tailwhip": {
        "target": {
            "def": -1
        },
        "name": "Tail Whip"
    },
    "leer": {
        "target": {
            "def": -1
        },
        "name": "Leer"
    },
    "growl": {
        "target": {
            "atk": -1
        },
        "name": "Growl"
    },
    "sing": {
        "targetStatus": "slp",
        "name": "Sing"
    },
    "supersonic": {
        "targetVolatiles": [
            "confusion"
        ],
        "name": "Supersonic"
    },
    "disable": {
        "targetVolatiles": [
            "disable"
        ],
        "name": "Disable"
    },
    "submission": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Submission"
    },
    "leechseed": {
        "targetVolatiles": [
            "leechseed"
        ],
        "name": "Leech Seed"
    },
    "growth": {
        "self": {
            "spa": 1
        },
        "name": "Growth"
    },
    "poisonpowder": {
        "targetStatus": "psn",
        "name": "PoisonPowder"
    },
    "stunspore": {
        "targetStatus": "par",
        "name": "Stun Spore"
    },
    "sleeppowder": {
        "targetStatus": "slp",
        "name": "Sleep Powder"
    },
    "stringshot": {
        "target": {
            "spe": -1
        },
        "name": "String Shot"
    },
    "firespin": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Fire Spin"
    },
    "thunderwave": {
        "targetStatus": "par",
        "name": "Thunder Wave"
    },
    "toxic": {
        "targetStatus": "tox",
        "name": "Toxic"
    },
    "hypnosis": {
        "targetStatus": "slp",
        "name": "Hypnosis"
    },
    "meditate": {
        "self": {
            "atk": 1
        },
        "name": "Meditate"
    },
    "agility": {
        "self": {
            "spe": 2
        },
        "name": "Agility"
    },
    "screech": {
        "target": {
            "def": -2
        },
        "name": "Screech"
    },
    "doubleteam": {
        "self": {
            "eva": 1
        },
        "name": "Double Team"
    },
    "harden": {
        "self": {
            "def": 1
        },
        "name": "Harden"
    },
    "minimize": {
        "self": {
            "eva": 2
        },
        "name": "Minimize"
    },
    "smokescreen": {
        "target": {
            "acc": -1
        },
        "name": "SmokeScreen"
    },
    "confuseray": {
        "targetVolatiles": [
            "confusion"
        ],
        "name": "Confuse Ray"
    },
    "withdraw": {
        "self": {
            "def": 1
        },
        "name": "Withdraw"
    },
    "barrier": {
        "self": {
            "def": 2
        },
        "name": "Barrier"
    },
    "lightscreen": {
        "screen": "isLightScreen",
        "name": "Light Screen"
    },
    "reflect": {
        "screen": "isReflect",
        "name": "Reflect"
    },
    "clamp": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Clamp"
    },
    "amnesia": {
        "self": {
            "spd": 2
        },
        "name": "Amnesia"
    },
    "kinesis": {
        "target": {
            "spd": -2
        },
        "name": "Kinesis"
    },
    "glare": {
        "targetStatus": "par",
        "name": "Glare"
    },
    "poisongas": {
        "targetStatus": "tox",
        "name": "Poison Gas"
    },
    "lovelykiss": {
        "targetStatus": "slp",
        "name": "Lovely Kiss"
    },
    "spore": {
        "targetStatus": "slp",
        "name": "Spore"
    },
    "flash": {
        "target": {
            "acc": -1
        },
        "name": "Flash"
    },
    "acidarmor": {
        "self": {
            "def": 2
        },
        "name": "Acid Armor"
    },
    "rest": {
        "selfStatus": "slp",
        "conditional": "Sleeps for 2 turns. Also the usual way to block a worse status on purpose.",
        "name": "Rest"
    },
    "sharpen": {
        "self": {
            "atk": 1
        },
        "name": "Sharpen"
    },
    "substitute": {
        "selfVolatiles": [
            "substitute"
        ],
        "name": "Substitute"
    },
    "spiderweb": {
        "trapsTarget": {
            "expires": false
        },
        "name": "Spider Web"
    },
    "curse": {
        "self": {
            "atk": 1,
            "def": 1,
            "spe": -1
        },
        "conditional": "Only for non-Ghost users; a Ghost-type Curse trades HP for a slow status effect instead.",
        "name": "Curse"
    },
    "cottonspore": {
        "target": {
            "spe": -2
        },
        "name": "Cotton Spore"
    },
    "scaryface": {
        "target": {
            "spe": -2
        },
        "name": "Scary Face"
    },
    "sweetkiss": {
        "targetVolatiles": [
            "confusion"
        ],
        "name": "Sweet Kiss"
    },
    "mudslap": {
        "target": {
            "acc": -1
        },
        "name": "Mud-Slap"
    },
    "spikes": {
        "hazard": {
            "field": "spikes",
            "max": 3
        },
        "name": "Spikes"
    },
    "zapcannon": {
        "targetStatus": "par",
        "name": "Zap Cannon"
    },
    "perishsong": {
        "perish": 3,
        "name": "Perish Song"
    },
    "icywind": {
        "target": {
            "spe": -1
        },
        "name": "Icy Wind"
    },
    "sandstorm": {
        "weather": "Sand",
        "name": "Sandstorm"
    },
    "charm": {
        "target": {
            "atk": -2
        },
        "name": "Charm"
    },
    "swagger": {
        "target": {
            "atk": 2
        },
        "targetVolatiles": [
            "confusion"
        ],
        "name": "Swagger"
    },
    "meanlook": {
        "trapsTarget": {
            "expires": false
        },
        "name": "Mean Look"
    },
    "attract": {
        "targetVolatiles": [
            "attract"
        ],
        "conditional": "Only lands if the two are of opposite genders.",
        "name": "Attract"
    },
    "bulldoze": {
        "target": {
            "spe": -1
        },
        "name": "Bulldoze"
    },
    "dynamicpunch": {
        "targetVolatiles": [
            "confusion"
        ],
        "name": "DynamicPunch"
    },
    "encore": {
        "targetVolatiles": [
            "encore"
        ],
        "name": "Encore"
    },
    "sweetscent": {
        "target": {
            "eva": -1
        },
        "name": "Sweet Scent"
    },
    "twister": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Twister"
    },
    "raindance": {
        "weather": "Rain",
        "name": "Rain Dance"
    },
    "sunnyday": {
        "weather": "Sun",
        "name": "Sunny Day"
    },
    "whirlpool": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Whirlpool"
    },
    "stockpile": {
        "self": {
            "def": 1,
            "spd": 1
        },
        "name": "Stockpile"
    },
    "swallow": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Swallow"
    },
    "hail": {
        "weather": "Hail",
        "name": "Hail"
    },
    "torment": {
        "targetVolatiles": [
            "torment"
        ],
        "name": "Torment"
    },
    "flatter": {
        "target": {
            "spa": 1
        },
        "targetVolatiles": [
            "confusion"
        ],
        "name": "Flatter"
    },
    "willowisp": {
        "targetStatus": "brn",
        "name": "Will-O-Wisp"
    },
    "charge": {
        "self": {
            "spd": 1
        },
        "name": "Charge"
    },
    "brickbreak": {
        "clearsScreens": true,
        "name": "Brick Break"
    },
    "yawn": {
        "targetStatus": "slp",
        "name": "Yawn"
    },
    "tailglow": {
        "self": {
            "spa": 2
        },
        "name": "Tail Glow"
    },
    "featherdance": {
        "target": {
            "atk": -2
        },
        "name": "FeatherDance"
    },
    "teeterdance": {
        "targetVolatiles": [
            "confusion"
        ],
        "name": "Teeter Dance"
    },
    "faketears": {
        "target": {
            "spe": -2
        },
        "name": "Fake Tears"
    },
    "rocktomb": {
        "target": {
            "spe": -1
        },
        "name": "Rock Tomb"
    },
    "metalsound": {
        "target": {
            "spe": -2
        },
        "name": "Metal Sound"
    },
    "grasswhistle": {
        "targetStatus": "slp",
        "name": "GrassWhistle"
    },
    "tickle": {
        "target": {
            "atk": -1,
            "def": -1
        },
        "name": "Tickle"
    },
    "cosmicpower": {
        "self": {
            "def": 1,
            "spd": 1
        },
        "name": "Cosmic Power"
    },
    "sandtomb": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Sand Tomb"
    },
    "sheercold": {
        "targetStatus": "frz",
        "name": "Sheer Cold"
    },
    "irondefense": {
        "self": {
            "def": 2
        },
        "name": "Iron Defense"
    },
    "block": {
        "trapsTarget": {
            "expires": false
        },
        "name": "Block"
    },
    "howl": {
        "self": {
            "atk": 1
        },
        "name": "Howl"
    },
    "bulkup": {
        "self": {
            "atk": 1,
            "def": 1
        },
        "name": "Bulk Up"
    },
    "mudshot": {
        "target": {
            "spe": -1
        },
        "name": "Mud Shot"
    },
    "calmmind": {
        "self": {
            "spa": 1,
            "spd": 1
        },
        "name": "Calm Mind"
    },
    "dragondance": {
        "self": {
            "atk": 1,
            "spe": 1
        },
        "name": "Dragon Dance"
    },
    "hammerarm": {
        "self": {
            "spe": -1
        },
        "name": "Hammer Arm"
    },
    "toxicspikes": {
        "hazard": {
            "field": "toxicSpikes",
            "max": 2
        },
        "name": "Toxic Spikes"
    },
    "rockpolish": {
        "self": {
            "spe": 2
        },
        "name": "Rock Polish"
    },
    "nastyplot": {
        "self": {
            "spa": 2
        },
        "name": "Nasty Plot"
    },
    "defog": {
        "target": {
            "eva": -1
        },
        "clearsTarget": true,
        "name": "Defog"
    },
    "captivate": {
        "target": {
            "spa": -2
        },
        "name": "Captivate"
    },
    "stealthrock": {
        "hazard": {
            "field": "isSR",
            "max": 1
        },
        "name": "Stealth Rock"
    },
    "chargebeam": {
        "self": {
            "spa": 1
        },
        "name": "Charge Beam"
    },
    "defendorder": {
        "self": {
            "def": 1,
            "spd": 1
        },
        "name": "Defend Order"
    },
    "crushgrip": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Crush Grip"
    },
    "magmastorm": {
        "trapsTarget": {
            "expires": true
        },
        "name": "Magma Storm"
    },
    "darkvoid": {
        "targetStatus": "slp",
        "name": "Dark Void"
    }
};

const ABILITIES = {
    stench: {
        num: 1,
        id: "stench",
        name: "Stench",
        calcName: "Stench",
        desc: {
            battle: "",
            overworld: "Decreases wild Pokémon encounter rates by 50%, if the user is the first member of the party."
        }
    },
    drizzle: {
        num: 2,
        id: "drizzle",
        name: "Drizzle",
        calcName: "Drizzle",
        desc: {
            battle: "Summons rain when the user switches in, which lasts indefinitely until replaced by another weather condition.",
            overworld: ""
        }
    },
    speedboost: {
        num: 3,
        id: "speedboost",
        name: "Speed Boost",
        calcName: "Speed Boost",
        desc: {
            battle: "Raises the Speed stat of the user by one stage at the end of every turn.",
            overworld: ""
        }
    },
    battlearmor: {
        num: 4,
        id: "battlearmor",
        name: "Battle Armor",
        calcName: "Battle Armor",
        desc: {
            battle: "Protects the user from critical hits.",
            overworld: ""
        }
    },
    sturdy: {
        num: 5,
        id: "sturdy",
        name: "Sturdy",
        calcName: "Sturdy",
        desc: {
            battle: "Protects the Pokémon from one-hit KO moves.",
            overworld: ""
        }
    },
    damp: {
        num: 6,
        id: "damp",
        name: "Damp",
        calcName: "Damp",
        desc: {
            battle: "Prevents all Pokémon on the field from using <span data-target=\"move/selfdestruct\">Selfdestruct</span>, <span data-target=\"move/explosion\">Explosion</span>, or <span data-target=\"move/memento\">Memento</span>, and prevents <span data-target=\"ability/aftermath\">Aftermath</span>.",
            overworld: ""
        }
    },
    limber: {
        num: 7,
        id: "limber",
        name: "Limber",
        calcName: "Limber",
        desc: {
            battle: "Protects the user from Paralysis.",
            overworld: ""
        }
    },
    sandveil: {
        num: 8,
        id: "sandveil",
        name: "Sand Veil",
        calcName: "Sand Veil",
        desc: {
            battle: "Decreases the accuracy of moves targeting the user by 20% in sandstorm, and protects it from sandstorm damage.",
            overworld: "Decreases wild Pokémon encounter rates by 50% in sandstorm, if the user is the first member of the party."
        }
    },
    static: {
        num: 9,
        id: "static",
        name: "Static",
        calcName: "Static",
        desc: {
            battle: "Has a 30% chance to paralyze Pokémon that make contact with the user.",
            overworld: "Has a 50% chance to force an <span data-target=\"type/electric\">Electric</span> type wild encounter, if the user is the first member of the party."
        }
    },
    voltabsorb: {
        num: 10,
        id: "voltabsorb",
        name: "Volt Absorb",
        calcName: "Volt Absorb",
        desc: {
            battle: "Heals the user by 25% of its total HP when hit by an <span data-target=\"type/electric\">Electric</span> type move.",
            overworld: ""
        }
    },
    waterabsorb: {
        num: 11,
        id: "waterabsorb",
        name: "Water Absorb",
        calcName: "Water Absorb",
        desc: {
            battle: "Heals the user by 25% of its total HP when hit by an <span data-target=\"type/water\">Water</span> type move.",
            overworld: ""
        }
    },
    oblivious: {
        num: 12,
        id: "oblivious",
        name: "Oblivious",
        calcName: "Oblivious",
        desc: {
            battle: "Protects the user from infatuation and <span data-target=\"move/captivate\">Captivate</span>",
            overworld: ""
        }
    },
    cloudnine: {
        num: 13,
        id: "cloudnine",
        name: "Cloud Nine",
        calcName: "Cloud Nine",
        desc: {
            battle: "Negates all weather effects while the user is on the field.",
            overworld: ""
        }
    },
    compoundeyes: {
        num: 14,
        id: "compoundeyes",
        name: "Compoundeyes",
        calcName: "Compound Eyes",
        desc: {
            battle: "Increases the accuracy of the user's moves by 30%.",
            overworld: "Increases the chance to find a wild Pokémon with a held item from 50%/5% to 60%/20%."
        }
    },
    insomnia: {
        num: 15,
        id: "insomnia",
        name: "Insomnia",
        calcName: "Insomnia",
        desc: {
            battle: "Protects the user from Sleep.",
            overworld: ""
        }
    },
    colorchange: {
        num: 16,
        id: "colorchange",
        name: "Color Change",
        calcName: "Color Change",
        desc: {
            battle: "Changes the user's type to the type of the move it was hit by.",
            overworld: ""
        }
    },
    immunity: {
        num: 17,
        id: "immunity",
        name: "Immunity",
        calcName: "Immunity",
        desc: {
            battle: "Protects the user from Poison.",
            overworld: "Prevents the user from taking poison damage when walking."
        }
    },
    flashfire: {
        num: 18,
        id: "flashfire",
        name: "Flash Fire",
        calcName: "Flash Fire",
        desc: {
            battle: "Makes the user immune to <span data-target=\"type/fire\">Fire</span> type moves, and increases the user's Attack or Special Attack by 50% when using a <span data-target=\"type/fire\">Fire</span> type move after being hit by one.",
            overworld: ""
        }
    },
    shielddust: {
        num: 19,
        id: "shielddust",
        name: "Shield Dust",
        calcName: "Shield Dust",
        desc: {
            battle: "Protects the user from the secondary effects of Pokémon's moves.",
            overworld: ""
        }
    },
    owntempo: {
        num: 20,
        id: "owntempo",
        name: "Own Tempo",
        calcName: "Own Tempo",
        desc: {
            battle: "Protects the user from confusion.",
            overworld: ""
        }
    },
    suctioncups: {
        num: 21,
        id: "suctioncups",
        name: "Suction Cups",
        calcName: "Suction Cups",
        desc: {
            battle: "Protects the user from being phazed out by <span data-target=\"move/whirlwind\">Whirlwind</span> or <span data-target=\"move/roar\">Roar</span>.",
            overworld: ""
        }
    },
    intimidate: {
        num: 22,
        id: "intimidate",
        name: "Intimidate",
        calcName: "Intimidate",
        desc: {
            battle: "Lowers the Attack stat of all opposing Pokémon by one stage when the user enters the field.",
            overworld: "Decreases wild Pokémon encounter rates at least 5 levels lower than the user by 50%, if the user is the first member of the party."
        }
    },
    shadowtag: {
        num: 23,
        id: "shadowtag",
        name: "Shadow Tag",
        calcName: "Shadow Tag",
        desc: {
            battle: "Prevents all opposing Pokémon from switching out or fleeing, and protects the user from the effect of opposing Shadow Tag.",
            overworld: ""
        }
    },
    roughskin: {
        num: 24,
        id: "roughskin",
        name: "Rough Skin",
        calcName: "Rough Skin",
        desc: {
            battle: "Damages Pokémon that make contact with the user by 1/8 of their total HP.",
            overworld: ""
        }
    },
    wonderguard: {
        num: 25,
        id: "wonderguard",
        name: "Wonder Guard",
        calcName: "Wonder Guard",
        desc: {
            battle: "Makes the user immune to damaging moves that are not Super-Effective.",
            overworld: ""
        }
    },
    levitate: {
        num: 26,
        id: "levitate",
        name: "Levitate",
        calcName: "Levitate",
        desc: {
            battle: "Makes the user immune to <span data-target=\"type/ground\">Ground</span> type moves, <span data-target=\"ability/arenatrap\">Arena Trap</span>, <span data-target=\"move/spikes\">Spikes</span>, and <span data-target=\"move/toxicspikes\">Toxic Spikes</span>.",
            overworld: ""
        }
    },
    effectspore: {
        num: 27,
        id: "effectspore",
        name: "Effect Spore",
        calcName: "Effect Spore",
        desc: {
            battle: "Has a 30% chance to affect Pokémon that make contact with the user with Poison, Paralysis, or Sleep.",
            overworld: ""
        }
    },
    synchronize: {
        num: 28,
        id: "synchronize",
        name: "Synchronize",
        calcName: "Synchronize",
        desc: {
            battle: "When the user is burned, poisoned, or paralyzed by another Pokémon, that Pokémon is also inflicted with that status condition.",
            overworld: "Has a 50% chance to force a wild encounter with the same nature as the user, if the user is the first member of the party."
        }
    },
    clearbody: {
        num: 29,
        id: "clearbody",
        name: "Clear Body",
        calcName: "Clear Body",
        desc: {
            battle: "Protects the user from stat drops caused by other Pokémon.",
            overworld: ""
        }
    },
    naturalcure: {
        num: 30,
        id: "naturalcure",
        name: "Natural Cure",
        calcName: "Natural Cure",
        desc: {
            battle: "Cures the user's status condition upon switching out, or at the end of a battle if the user was on the field.",
            overworld: ""
        }
    },
    lightningrod: {
        num: 31,
        id: "lightningrod",
        name: "Lightningrod",
        calcName: "Lightning Rod",
        desc: {
            battle: "Forces <span data-target=\"type/electric\">Electric</span> type single-target moves to redirect to the user.",
            overworld: ""
        }
    },
    serenegrace: {
        num: 32,
        id: "serenegrace",
        name: "Serene Grace",
        calcName: "Serene Grace",
        desc: {
            battle: "Doubles the chance of additional effects of moves.",
            overworld: ""
        }
    },
    swiftswim: {
        num: 33,
        id: "swiftswim",
        name: "Swift Swim",
        calcName: "Swift Swim",
        desc: {
            battle: "Doubles the Speed stat of the user in rain.",
            overworld: ""
        }
    },
    chlorophyll: {
        num: 34,
        id: "chlorophyll",
        name: "Chlorophyll",
        calcName: "Chlorophyll",
        desc: {
            battle: "Doubles the Speed stat of the user in sun.",
            overworld: ""
        }
    },
    illuminate: {
        num: 35,
        id: "illuminate",
        name: "Illuminate",
        calcName: "Illuminate",
        desc: {
            battle: "",
            overworld: "Increases wild Pokémon encounter rates by 100%, if the user is the first member of the party."
        }
    },
    trace: {
        num: 36,
        id: "trace",
        name: "Trace",
        calcName: "Trace",
        desc: {
            battle: "Copies the ability of an opposing Pokémon when the user enters the field.",
            overworld: ""
        }
    },
    hugepower: {
        num: 37,
        id: "hugepower",
        name: "Huge Power",
        calcName: "Huge Power",
        desc: {
            battle: "Doubles the Attack stat of the user.",
            overworld: ""
        }
    },
    poisonpoint: {
        num: 38,
        id: "poisonpoint",
        name: "Poison Point",
        calcName: "Poison Point",
        desc: {
            battle: "Has a 30% chance to poison Pokémon that make contact with the user.",
            overworld: ""
        }
    },
    innerfocus: {
        num: 39,
        id: "innerfocus",
        name: "Inner Focus",
        calcName: "Inner Focus",
        desc: {
            battle: "Protects the user from flinching.",
            overworld: ""
        }
    },
    magmaarmor: {
        num: 40,
        id: "magmaarmor",
        name: "Magma Armor",
        calcName: "Magma Armor",
        desc: {
            battle: "Protects the user from Freeze.",
            overworld: "Halves the number of cycles required for Eggs in the party to hatch."
        }
    },
    waterveil: {
        num: 41,
        id: "waterveil",
        name: "Water Veil",
        calcName: "Water Veil",
        desc: {
            battle: "Protects the user from Burn.",
            overworld: ""
        }
    },
    magnetpull: {
        num: 42,
        id: "magnetpull",
        name: "Magnet Pull",
        calcName: "Magnet Pull",
        desc: {
            battle: "Prevents all opposing <span data-target=\"type/steel\">Steel</span> type Pokémon from switching out or fleeing.",
            overworld: "Has a 50% chance to force an <span data-target=\"type/steel\">Steel</span> type wild encounter, if the user is the first member of the party."
        }
    },
    soundproof: {
        num: 43,
        id: "soundproof",
        name: "Soundproof",
        calcName: "Soundproof",
        desc: {
            battle: "Makes the user immune to Sound-based moves.",
            overworld: ""
        }
    },
    raindish: {
        num: 44,
        id: "raindish",
        name: "Rain Dish",
        calcName: "Rain Dish",
        desc: {
            battle: "Heals the user by 1/16 of its total HP at the end of every turn in rain.",
            overworld: ""
        }
    },
    sandstream: {
        num: 45,
        id: "sandstream",
        name: "Sand Stream",
        calcName: "Sand Stream",
        desc: {
            battle: "Summons a sandstorm when the user switches in, which lasts indefinitely until replaced by another weather condition",
            overworld: ""
        }
    },
    pressure: {
        num: 46,
        id: "pressure",
        name: "Pressure",
        calcName: "Pressure",
        desc: {
            battle: "Forces all Pokémon on the field to use an additional PP for every move that targets the user or the field.",
            overworld: "Has a 50% chance to force a wild encounter at the upper bound of its level range, if the user is the first member of the party."
        }
    },
    thickfat: {
        num: 47,
        id: "thickfat",
        name: "Thick Fat",
        calcName: "Thick Fat",
        desc: {
            battle: "Halves the damage of <span data-target=\"type/fire\">Fire</span> or <span data-target=\"type/ice\">Ice<>/span type moves targeting the user.",
            overworld: ""
        }
    },
    earlybird: {
        num: 48,
        id: "earlybird",
        name: "Early Bird",
        calcName: "Early Bird",
        desc: {
            battle: "Halves the number of Sleep turns the user is put to sleep (from 1-4 to 0-2).",
            overworld: ""
        }
    },
    flamebody: {
        num: 49,
        id: "flamebody",
        name: "Flame Body",
        calcName: "Flame Body",
        desc: {
            battle: "Has a 30% chance to burn Pokémon that make contact with the user.",
            overworld: "Halves the number of cycles required for Eggs in the party to hatch."
        }
    },
    runaway: {
        num: 50,
        id: "runaway",
        name: "Run Away",
        calcName: "Run Away",
        desc: {
            battle: "The user can always flee or use <span data-target=\"move/teleport\">Teleport</span> successfully.",
            overworld: ""
        }
    },
    keeneye: {
        num: 51,
        id: "keeneye",
        name: "Keen Eye",
        calcName: "Keen Eye",
        desc: {
            battle: "Protects the user from accuracy drops caused by other Pokémon.",
            overworld: "Decreases wild Pokémon encounter rates at least 5 levels lower than the user by 50%, if the user is the first member of the party"
        }
    },
    hypercutter: {
        num: 52,
        id: "hypercutter",
        name: "Hyper Cutter",
        calcName: "Hyper Cutter",
        desc: {
            battle: "Protects the user from Attack drops caused by other Pokémon.",
            overworld: ""
        }
    },
    pickup: {
        num: 53,
        id: "pickup",
        name: "Pickup",
        calcName: "Pickup",
        desc: {
            battle: "",
            overworld: "Has a 10% chance to give the user an item after the end of a battle, if it is not holding one."
        }
    },
    truant: {
        num: 54,
        id: "truant",
        name: "Truant",
        calcName: "Truant",
        desc: {
            battle: "The user cannot move every other turn.",
            overworld: ""
        }
    },
    hustle: {
        num: 55,
        id: "hustle",
        name: "Hustle",
        calcName: "Hustle",
        desc: {
            battle: "Increases the Attack stat of the user by 50%, but lowers the accuracy of its <span data-target=\"category/physical\">Physical moves</span> by 20%.",
            overworld: "Has a 50% chance to force a wild encounter at the upper bound of its level range, if the user is the first member of the party."
        }
    },
    cutecharm: {
        num: 56,
        id: "cutecharm",
        name: "Cute Charm",
        calcName: "Cute Charm",
        desc: {
            battle: "Has a 30% chance to infatuate Pokémon of the opposite gender that make contact with the user.",
            overworld: "Has a 2/3 chance to force a wild encounter of the opposite gender of the user, if the user is the first member of the party."
        }
    },
    plus: {
        num: 57,
        id: "plus",
        name: "Plus",
        calcName: "Plus",
        desc: {
            battle: "Increases the user's Special Attack stat by 50% if its ally has the ability <span data-target=\"abiliity/minus\">Minus</span>.",
            overworld: ""
        }
    },
    minus: {
        num: 58,
        id: "minus",
        name: "Minus",
        calcName: "Minus",
        desc: {
            battle: "Increases the user's Special Attack stat by 50% if its ally has the ability <span data-target=\"abiliity/plus\">Plus</span>.",
            overworld: ""
        }
    },
    forecast: {
        num: 59,
        id: "forecast",
        name: "Forecast",
        calcName: "Forecast",
        desc: {
            battle: "Changes <span data-target=\"species/Castform\">Castform</span>'s form depending on the current weather condition.",
            overworld: ""
        }
    },
    stickyhold: {
        num: 60,
        id: "stickyhold",
        name: "Sticky Hold",
        calcName: "Sticky Hold",
        desc: {
            battle: "Prevents the user from losing its held item by <span data-target=\"move/bugbite\">Bug Bite</span>, <span data-target=\"move/pluck\">Pluck</span>, or <span data-target=\"move/knockoff\">Knock Off</span>.",
            overworld: ""
        }
    },
    shedskin: {
        num: 61,
        id: "shedskin",
        name: "Shed Skin",
        calcName: "Shed Skin",
        desc: {
            battle: "Has a 30% chance to cure the user's status condition at the end of every turn.",
            overworld: ""
        }
    },
    guts: {
        num: 62,
        id: "guts",
        name: "Guts",
        calcName: "Guts",
        desc: {
            battle: "Increases the user's Attack stat by 50% if it has a status condition, and the user does not lose Attack from Burn.",
            overworld: ""
        }
    },
    marvelscale: {
        num: 63,
        id: "marvelscale",
        name: "Marvel Scale",
        calcName: "Marvel Scale",
        desc: {
            battle: "Increases the user's Defense stat by 50% if it has a status condition.",
            overworld: ""
        }
    },
    liquidooze: {
        num: 64,
        id: "liquidooze",
        name: "Liquid Ooze",
        calcName: "Liquid Ooze",
        desc: {
            battle: "Causes draining moves targeting the user to damage the attacker instead of healing it.",
            overworld: ""
        }
    },
    overgrow: {
        num: 65,
        id: "overgrow",
        name: "Overgrow",
        calcName: "Overgrow",
        desc: {
            battle: "Increases the power of <span data-target=\"type/grass\">Grass</span> type moves when the user's HP is equal to or lower than 33% of its maximum HP.",
            overworld: ""
        }
    },
    blaze: {
        num: 66,
        id: "blaze",
        name: "Blaze",
        calcName: "Blaze",
        desc: {
            battle: "Increases the power of <span data-target=\"type/fire\">Fire</span> type moves when the user's HP is equal to or lower than 33% of its maximum HP.",
            overworld: ""
        }
    },
    torrent: {
        num: 67,
        id: "torrent",
        name: "Torrent",
        calcName: "Torrent",
        desc: {
            battle: "Increases the power of <span data-target=\"type/water\">Water</span> type moves when the user's HP is equal to or lower than 33% of its maximum HP.",
            overworld: ""
        }
    },
    swarm: {
        num: 68,
        id: "swarm",
        name: "Swarm",
        calcName: "Swarm",
        desc: {
            battle: "Increases the power of <span data-target=\"type/bug\">Bug</span> type moves when the user's HP is equal to or lower than 33% of its maximum HP.",
            overworld: ""
        }
    },
    rockhead: {
        num: 69,
        id: "rockhead",
        name: "Rock Head",
        calcName: "Rock Head",
        desc: {
            battle: "Prevents the user from taking recoil damage.",
            overworld: ""
        }
    },
    drought: {
        num: 70,
        id: "drought",
        name: "Drought",
        calcName: "Drought",
        desc: {
            battle: "Summons sun when the user switches in, which lasts indefinitely until replaced by another weather condition.",
            overworld: ""
        }
    },
    arenatrap: {
        num: 71,
        id: "arenatrap",
        name: "Arena Trap",
        calcName: "Arena Trap",
        desc: {
            battle: "Prevents all opposing grounded Pokémon from switching out or fleeing.",
            overworld: "Increases wild Pokémon encounter rates by 100%, if the user is the first member of the party."
        }
    },
    vitalspirit: {
        num: 72,
        id: "vitalspirit",
        name: "Vital Spirit",
        calcName: "Vital Spirit",
        desc: {
            battle: "Protects the user from Sleep.",
            overworld: "Has a 50% chance to force a wild encounter at the upper bound of its level range, if the user is the first member of the party."
        }
    },
    whitesmoke: {
        num: 73,
        id: "whitesmoke",
        name: "White Smoke",
        calcName: "White Smoke",
        desc: {
            battle: "Protects the user from stat drops caused by other Pokémon.",
            overworld: "Decreases wild Pokémon encounter rates by 50%, if the user is the first member of the party."
        }
    },
    purepower: {
        num: 74,
        id: "purepower",
        name: "Pure Power",
        calcName: "Pure Power",
        desc: {
            battle: "Doubles the Attack stat of the user.",
            overworld: ""
        }
    },
    shellarmor: {
        num: 75,
        id: "shellarmor",
        name: "Shell Armor",
        calcName: "Shell Armor",
        desc: {
            battle: "Protects the user from critical hits.",
            overworld: ""
        }
    },
    airlock: {
        num: 76,
        id: "airlock",
        name: "Air Lock",
        calcName: "Air Lock",
        desc: {
            battle: "Negates all weather effects while the user is on the field.",
            overworld: ""
        }
    },
    tangledfeet: {
        num: 77,
        id: "tangledfeet",
        name: "Tangled Feet",
        calcName: "Tangled Feet",
        desc: {
            battle: "Halves the accuracy of moves targeting the user when it is confused.",
            overworld: ""
        }
    },
    motordrive: {
        num: 78,
        id: "motordrive",
        name: "Motor Drive",
        calcName: "Motor Drive",
        desc: {
            battle: "Raises the Speed stat of the user by one stage when hit by an <span data-target=\"type/electric\">Electric</span> type move.",
            overworld: ""
        }
    },
    rivalry: {
        num: 79,
        id: "rivalry",
        name: "Rivalry",
        calcName: "Rivalry",
        desc: {
            battle: "Increases the damage of moves targeting the user by 25% if the attacker is of the same gender, and reduces it by 25% if they are of opposite genders.",
            overworld: ""
        }
    },
    steadfast: {
        num: 80,
        id: "steadfast",
        name: "Steadfast",
        calcName: "Steadfast",
        desc: {
            battle: "Raises the Speed stat of the user when it flinches.",
            overworld: ""
        }
    },
    snowcloak: {
        num: 81,
        id: "snowcloak",
        name: "Snow Cloak",
        calcName: "Snow Cloak",
        desc: {
            battle: "Decreases the accuracy of moves targeting the user by 20% in hail, and protects it from hail damage.",
            overworld: "Decreases wild Pokémon encounter rates by 50% in hail, if the user is the first member of the party."
        }
    },
    gluttony: {
        num: 82,
        id: "gluttony",
        name: "Gluttony",
        calcName: "Gluttony",
        desc: {
            battle: "Causes the user to consume berries that are normally consumed at 25% of its total HP, at 50% of its total HP.",
            overworld: ""
        }
    },
    angerpoint: {
        num: 83,
        id: "angerpoint",
        name: "Anger Point",
        calcName: "Anger Point",
        desc: {
            battle: "Raises the Attack stat of the user to +6 when hit by a critical hit.",
            overworld: ""
        }
    },
    unburden: {
        num: 84,
        id: "unburden",
        name: "Unburden",
        calcName: "Unburden",
        desc: {
            battle: "Increases the Speed stat of the user by 100% when its held item is consumed or lost.",
            overworld: ""
        }
    },
    heatproof: {
        num: 85,
        id: "heatproof",
        name: "Heatproof",
        calcName: "Heatproof",
        desc: {
            battle: "Halves damage done to the user by <span data-target=\"type/fire\">Fire</span> type moves and Burn.",
            overworld: ""
        }
    },
    simple: {
        num: 86,
        id: "simple",
        name: "Simple",
        calcName: "Simple",
        desc: {
            battle: "Doubles the effectiveness of stat stages.",
            overworld: ""
        }
    },
    dryskin: {
        num: 87,
        id: "dryskin",
        name: "Dry Skin",
        calcName: "Dry Skin",
        desc: {
            battle: "In rain, heals the user by 1/8 of its total HP at the end of every turn, and heals it by 25% of its total HP when hit by a <span data-target=\"type/water\">Water</span> type move. In sun, damages the user by 1/8 of its total HP at the end of every turn, and causes the it to take 25% more damage from a <span data-target=\"type/fire\">Fire</span> type move.",
            overworld: ""
        }
    },
    download: {
        num: 88,
        id: "download",
        name: "Download",
        calcName: "Download",
        desc: {
            battle: "When the user enters the field, raises its Attack stat if the opposing Pokémon's Defense stat is lower than its Special Defense stat, otherwise raises the user's Special Attack. In a double battle, it calculates the averages of the opposing team's Defense stats and Special Defense stats.",
            overworld: ""
        }
    },
    ironfist: {
        num: 89,
        id: "ironfist",
        name: "Iron Fist",
        calcName: "Iron Fist",
        desc: {
            battle: "Increases the power of Punching moves by 20%.",
            overworld: ""
        }
    },
    poisonheal: {
        num: 90,
        id: "poisonheal",
        name: "Poison Heal",
        calcName: "Poison Heal",
        desc: {
            battle: "If the user is poisoned, heals it by 1/8 of its total HP at the end of every turn instead of damaging it.",
            overworld: "The user still takes poison damage when walking."
        }
    },
    adaptability: {
        num: 91,
        id: "adaptability",
        name: "Adaptability",
        calcName: "Adaptability",
        desc: {
            battle: "Increases the user's STAB from 1.5x to 2x.",
            overworld: ""
        }
    },
    skilllink: {
        num: 92,
        id: "skilllink",
        name: "Skill Link",
        calcName: "Skill Link",
        desc: {
            battle: "Forces moves that hit up to 5 times to hit all 5 times.",
            overworld: ""
        }
    },
    hydration: {
        num: 93,
        id: "hydration",
        name: "Hydration",
        calcName: "Hydration",
        desc: {
            battle: "Cures the user's status condition at the end of every turn in rain.",
            overworld: ""
        }
    },
    solarpower: {
        num: 94,
        id: "solarpower",
        name: "Solar Power",
        calcName: "Solar Power",
        desc: {
            battle: "In sun, increases the user's Special attack by 50%, but damages it by 1/8 of its total HP at the end of every turn.",
            overworld: ""
        }
    },
    quickfeet: {
        num: 95,
        id: "quickfeet",
        name: "Quick Feet",
        calcName: "Quick Feet",
        desc: {
            battle: "Increases the user's Speed stat by 50% if it has a status condition, and the user does not lose Speed from Paralysis.",
            overworld: "Decreases wild Pokémon encounter rates by 50%, if the user is the first member of the party."
        }
    },
    normalize: {
        num: 96,
        id: "normalize",
        name: "Normalize",
        calcName: "Normalize",
        desc: {
            battle: "Changes the type of all moves used by the user to the <span data-target=\"type/normal\">Normal</span> type.",
            overworld: ""
        }
    },
    sniper: {
        num: 97,
        id: "sniper",
        name: "Sniper",
        calcName: "Sniper",
        desc: {
            battle: "Increases critical hit damage by 50%.",
            overworld: ""
        }
    },
    magicguard: {
        num: 98,
        id: "magicguard",
        name: "Magic Guard",
        calcName: "Magic Guard",
        desc: {
            battle: "Protects the user from indirect damage.",
            overworld: "The user still takes poison damage when walking."
        }
    },
    noguard: {
        num: 99,
        id: "noguard",
        name: "No Guard",
        calcName: "No Guard",
        desc: {
            battle: "Prevents the user from missing its moves.",
            overworld: "Increases wild Pokémon encounter rates by 100%, if the user is the first member of the party."
        }
    },
    stall: {
        num: 100,
        id: "stall",
        name: "Stall",
        calcName: "Stall",
        desc: {
            battle: "Forces the user to move last in its priority bracket.",
            overworld: ""
        }
    },
    technician: {
        num: 101,
        id: "technician",
        name: "Technician",
        calcName: "Technician",
        desc: {
            battle: "Increases the power of moves with a base power of 60 or less by 50%.",
            overworld: ""
        }
    },
    leafguard: {
        num: 102,
        id: "leafguard",
        name: "Leaf Guard",
        calcName: "Leaf Guard",
        desc: {
            battle: "Protects the user from status conditions in sun.",
            overworld: ""
        }
    },
    klutz: {
        num: 103,
        id: "klutz",
        name: "Klutz",
        calcName: "Klutz",
        desc: {
            battle: "Prevents the effects of the user's held item.",
            overworld: ""
        }
    },
    moldbreaker: {
        num: 104,
        id: "moldbreaker",
        name: "Mold Breaker",
        calcName: "Mold Breaker",
        desc: {
            battle: "When the user makes a move, prevents the effects of any abilities on the field that would affect that move.",
            overworld: ""
        }
    },
    superluck: {
        num: 105,
        id: "superluck",
        name: "Super Luck",
        calcName: "Super Luck",
        desc: {
            battle: "Raises the user's critical hit ratio by 1 stage.",
            overworld: ""
        }
    },
    aftermath: {
        num: 106,
        id: "aftermath",
        name: "Aftermath",
        calcName: "Aftermath",
        desc: {
            battle: "If the user faints to a move that made contact, the attacker loses 25% of its total HP, if there is not a Pokémon on the field with the ability <span data-target=\"ability/damp\">Damp</span>.",
            overworld: ""
        }
    },
    anticipation: {
        num: 107,
        id: "anticipation",
        name: "Anticipation",
        calcName: "Anticipation",
        desc: {
            battle: "Causes the user to \"shudder\" when it enters the battle, if an opposing Pokémon has a Super-Effective move, an OHKO move, or an exploding move.",
            overworld: ""
        }
    },
    forewarn: {
        num: 108,
        id: "forewarn",
        name: "Forewarn",
        calcName: "Forewarn",
        desc: {
            battle: "Warns the user of the opposing team's highest damaging move.",
            overworld: ""
        }
    },
    unaware: {
        num: 109,
        id: "unaware",
        name: "Unaware",
        calcName: "Unaware",
        desc: {
            battle: "Ignores the user's and the opposing Pokémon's stat changes when calculating damage.",
            overworld: ""
        }
    },
    tintedlens: {
        num: 110,
        id: "tintedlens",
        name: "Tinted Lens",
        calcName: "Tinted Lens",
        desc: {
            battle: "Doubles the damage of Not-Very-Effective moves.",
            overworld: ""
        }
    },
    filter: {
        num: 111,
        id: "filter",
        name: "Filter",
        calcName: "Filter",
        desc: {
            battle: "Decreases damage from Super-Effective moves by 25%.",
            overworld: ""
        }
    },
    slowstart: {
        num: 112,
        id: "slowstart",
        name: "Slow Start",
        calcName: "Slow Start",
        desc: {
            battle: "Halves the user's Attack and Speed stats for the first five turns after it enters the field.",
            overworld: ""
        }
    },
    scrappy: {
        num: 113,
        id: "scrappy",
        name: "Scrappy",
        calcName: "Scrappy",
        desc: {
            battle: "Enables the user to hit <span data-target=\"type/ghost\">Ghost</span type Pokémon with <span data-target=\"type/normal\">Normal</span> or <span data-target=\"type/fighting\">Fighting</span> type moves.",
            overworld: ""
        }
    },
    stormdrain: {
        num: 114,
        id: "stormdrain",
        name: "Storm Drain",
        calcName: "Storm Drain",
        desc: {
            battle: "Forces <span data-target=\"type/water\">Water</span> type single-target moves to redirect to the user.",
            overworld: ""
        }
    },
    icebody: {
        num: 115,
        id: "icebody",
        name: "Ice Body",
        calcName: "Ice Body",
        desc: {
            battle: "Heals the user by 1/16 of its total HP at the end of every turn in hail, and protects it from hail damage.",
            overworld: ""
        }
    },
    solidrock: {
        num: 116,
        id: "solidrock",
        name: "Solid Rock",
        calcName: "Solid Rock",
        desc: {
            battle: "Decreases damage from Super-Effective moves by 25%.",
            overworld: ""
        }
    },
    snowwarning: {
        num: 117,
        id: "snowwarning",
        name: "Snow Warning",
        calcName: "Snow Warning",
        desc: {
            battle: "Summons hail when the user switches in, which lasts indefinitely until replaced by another weather condition.",
            overworld: ""
        }
    },
    honeygather: {
        num: 118,
        id: "honeygather",
        name: "Honey Gather",
        calcName: "Honey Gather",
        desc: {
            battle: "",
            overworld: "Has a chance to give the user <span data-target=\"item/honey\">Honey</span> after the end of a battle, if it is not holding an item."
        }
    },
    frisk: {
        num: 119,
        id: "frisk",
        name: "Frisk",
        calcName: "Frisk",
        desc: {
            battle: "Reveals the held item of an opposing Pokémon when the user enters the field.",
            overworld: ""
        }
    },
    reckless: {
        num: 120,
        id: "reckless",
        name: "Reckless",
        calcName: "Reckless",
        desc: {
            battle: "Increases the power of recoil or crash damage moves by 20%.",
            overworld: ""
        }
    },
    multitype: {
        num: 121,
        id: "multitype",
        name: "Multitype",
        calcName: "Multitype",
        desc: {
            battle: "Changes the user's type depending on the plate it is holding.",
            overworld: ""
        }
    },
    flowergift: {
        num: 122,
        id: "flowergift",
        name: "Flower Gift",
        calcName: "Flower Gift",
        desc: {
            battle: "Increases the Attack and Special Attack stats of the user and its allies by 50% in sun.",
            overworld: ""
        }
    },
    baddreams: {
        num: 123,
        id: "baddreams",
        name: "Bad Dreams",
        calcName: "Bad Dreams",
        desc: {
            battle: "Damages opposing sleeping Pokémon by 1/8 of their total HP at the end of every turn.",
            overworld: ""
        }
    },
};

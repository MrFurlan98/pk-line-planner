const ITEMS = {
    masterball: {
        num: 1,
        id: "masterball",
        name: "Master Ball",
        calcName: "Master Ball",
        desc: "Used for catching Pokémon. Has a guaranteed catch rate.",
        search: true
    },
    ultraball: {
        num: 2,
        id: "ultraball",
        name: "Ultra Ball",
        calcName: "Ultra Ball",
        desc: "Used for catching Pokémon. Modifies the catch rate by 2x.",
        search: true
    },
    greatball: {
        num: 3,
        id: "greatball",
        name: "Great Ball",
        calcName: "Great Ball",
        desc: "Used for catching Pokémon. Modifies the catch rate by 1.5x.",
        search: true
    },
    pokeball: {
        num: 4,
        id: "pokeball",
        name: "Poké Ball",
        calcName: "Poké Ball",
        desc: "Used for catching Pokémon.",
        search: true
    },
    safariball: {
        num: 5,
        id: "safariball",
        name: "Safari Ball",
        calcName: "Safari Ball",
        desc: "Used for catching Pokémon. Modifies the catch rate by 1.5x, only usable in the <span data-target=\"location/greatmarsh\">Great Marsh.</span>",
        search: true
    },
    netball: {
        num: 6,
        id: "netball",
        name: "Net Ball",
        calcName: "Net Ball",
        desc: "Used for catching Pokémon. Modifies the catch rate by 3.5x if used on a <span data-target=\"type/water\">Water</span> or <span data-target=\"type/bug\">Bug</span> type Pokémon.",
        search: true
    },
    diveball: {
        num: 7,
        id: "diveball",
        name: "Dive Ball",
        calcName: "Dive Ball",
        desc: "Used for catching Pokémon. Modifies the catch rate by 3.5x if used while surfing or fishing.",
        search: true
    },
    nestball: {
        num: 8,
        id: "nestball",
        name: "Nest Ball",
        calcName: "Nest Ball",
        desc: "Used for catching Pokémon. Its catch rate modifier increases the lower the Pokémon's level is.",
        search: true
    },
    repeatball: {
        num: 9,
        id: "repeatball",
        name: "Repeat Ball",
        calcName: "Repeat Ball",
        desc: "Used for catching Pokémon. Has an increased catch rate if the Pokémon is registered in the trainer's Pokédex.",
        search: true
    },
    timerball: {
        num: 10,
        id: "timerball",
        name: "Timer Ball",
        calcName: "Timer Ball",
        desc: "Used for catching Pokémon. Its catch rate modifier increases the longer the battle lasts.",
        search: true
    },
    luxuryball: {
        num: 11,
        id: "luxuryball",
        name: "Luxury Ball",
        calcName: "Luxury Ball",
        desc: "Used for catching Pokémon. Doubles the rate at which the Pokémon's friendship increases.",
        search: true
    },
    premierball: {
        num: 12,
        id: "premierball",
        name: "Premier Ball",
        calcName: "Premier Ball",
        desc: "Used for catching Pokémon.",
        search: true
    },
    duskball: {
        num: 13,
        id: "duskball",
        name: "Dusk Ball",
        calcName: "Dusk Ball",
        desc: "Used for catching Pokémon. Modifies the catch rate by 3x if used in a cave or at night.",
        search: true
    },
    healball: {
        num: 14,
        id: "healball",
        name: "Heal Ball",
        calcName: "Heal Ball",
        desc: "Used for catching Pokémon. Heals the Pokémon upon capture, restoring its HP, PP, and curing its status condition.",
        search: true
    },
    quickball: {
        num: 15,
        id: "quickball",
        name: "Quick Ball",
        calcName: "Quick Ball",
        desc: "Used for catching Pokémon. Modifies the catch rate by 5x on the first turn of a battle.",
        search: true
    },
    cherishball: {
        num: 16,
        id: "cherishball",
        name: "Cherish Ball",
        calcName: "Cherish Ball",
        desc: "Used in special distribution events.",
        search: true
    },
    potion: {
        num: 17,
        id: "potion",
        name: "Potion",
        calcName: "Potion",
        desc: "Restores 20 HP.",
        search: false
    },
    antidote: {
        num: 18,
        id: "antidote",
        name: "Antidote",
        calcName: "Antidote",
        desc: "Cures a Pokémon's Poison.",
        search: false
    },
    burnheal: {
        num: 19,
        id: "burnheal",
        name: "Burn Heal",
        calcName: "Burn Heal",
        desc: "Cures a Pokémon's Burn.",
        search: false
    },
    iceheal: {
        num: 20,
        id: "iceheal",
        name: "Ice Heal",
        calcName: "Ice Heal",
        desc: "Cures a Pokémon's Freeze.",
        search: false
    },
    awakening: {
        num: 21,
        id: "awakening",
        name: "Awakening",
        calcName: "Awakening",
        desc: "Cures a Pokémon's Sleep.",
        search: false
    },
    parlyzheal: {
        num: 22,
        id: "parlyzheal",
        name: "Parlyz Heal",
        calcName: "Parlyz Heal",
        desc: "Cures a Pokémon's Paralysis.",
        search: false
    },
    fullrestore: {
        num: 23,
        id: "fullrestore",
        name: "Full Restore",
        calcName: "Full Restore",
        desc: "Fully restores a Pokémon's HP and cures its status condition.",
        search: false
    },
    maxpotion: {
        num: 24,
        id: "maxpotion",
        name: "Max Potion",
        calcName: "Max Potion",
        desc: "Fully restores a Pokémon's HP.",
        search: false
    },
    hyperpotion: {
        num: 25,
        id: "hyperpotion",
        name: "Hyper Potion",
        calcName: "Hyper Potion",
        desc: "Restores 200 HP.",
        search: false
    },
    superpotion: {
        num: 26,
        id: "superpotion",
        name: "Super Potion",
        calcName: "Super Potion",
        desc: "Restores 50 HP.",
        search: false
    },
    fullheal: {
        num: 27,
        id: "fullheal",
        name: "Full Heal",
        calcName: "Full Heal",
        desc: "Cures a Pokémon's status condition.",
        search: false
    },
    revive: {
        num: 28,
        id: "revive",
        name: "Revive",
        calcName: "Revive",
        desc: "Revives a fainted Pokémon, restoring 50% of its total HP.",
        search: false
    },
    maxrevive: {
        num: 29,
        id: "maxrevive",
        name: "Max Revive",
        calcName: "Max Revive",
        desc: "Revives a fainted Pokémon, fully restoring its HP.",
        search: false
    },
    freshwater: {
        num: 30,
        id: "freshwater",
        name: "Fresh Water",
        calcName: "Fresh Water",
        desc: "Restores 50 HP.",
        search: false
    },
    sodapop: {
        num: 31,
        id: "sodapop",
        name: "Soda Pop",
        calcName: "Soda Pop",
        desc: "Restores 60 HP.",
        search: false
    },
    lemonade: {
        num: 32,
        id: "lemonade",
        name: "Lemonade",
        calcName: "Lemonade",
        desc: "Restores 80 HP.",
        search: false
    },
    moomoomilk: {
        num: 33,
        id: "moomoomilk",
        name: "Moomoo Milk",
        calcName: "Moomoo Milk",
        desc: "Restores 100 HP.",
        search: false
    },
    energypowder: {
        num: 34,
        id: "energypowder",
        name: "EnergyPowder",
        calcName: "EnergyPowder",
        desc: "Restores 50 HP, but lowers friendship.",
        search: false
    },
    energyroot: {
        num: 35,
        id: "energyroot",
        name: "Energy Root",
        calcName: "Energy Root",
        desc: "Restores 200 HP, but lowers friendship.",
        search: false
    },
    healpowder: {
        num: 36,
        id: "healpowder",
        name: "Heal Powder",
        calcName: "Heal Powder",
        desc: "Cures a Pokémon's status condition, but lowers friendship.",
        search: false
    },
    revivalherb: {
        num: 37,
        id: "revivalherb",
        name: "Revival Herb",
        calcName: "Revival Herb",
        desc: "Revives a fainted Pokémon, fully restoring its HP, but lowers friendship.",
        search: false
    },
    ether: {
        num: 38,
        id: "ether",
        name: "Ether",
        calcName: "Ether",
        desc: "Restores 10 PP to one of the Pokémon's moves.",
        search: false
    },
    maxether: {
        num: 39,
        id: "maxether",
        name: "Max Ether",
        calcName: "Max Ether",
        desc: "Fully restores PP to one of the Pokémon's moves.",
        search: false
    },
    elixir: {
        num: 40,
        id: "elixir",
        name: "Elixir",
        calcName: "Elixir",
        desc: "Restores 10 PP to all of the Pokémon's moves.",
        search: false
    },
    maxelixir: {
        num: 41,
        id: "maxelixir",
        name: "Max Elixir",
        calcName: "Max Elixir",
        desc: "Fully restores PP to all of the Pokémon's moves.",
        search: false
    },
    lavacookie: {
        num: 42,
        id: "lavacookie",
        name: "Lava Cookie",
        calcName: "Lava Cookie",
        desc: "A consumable held item that cures the Pokémon's status condition.",
        search: false
    },
    berryjuice: {
        num: 43,
        id: "berryjuice",
        name: "Berry Juice",
        calcName: "Berry Juice",
        desc: "A consumable held item that restores 20 HP if the Pokémon's HP falls below 50%.",
        search: true
    },
    sacredash: {
        num: 44,
        id: "sacredash",
        name: "Sacred Ash",
        calcName: "Sacred Ash",
        desc: "Revives all fainted Pokémon, fully restoring their HP.",
        search: false
    },
    hpup: {
        num: 45,
        id: "hpup",
        name: "HP Up",
        calcName: "HP Up",
        desc: "Adds 10 HP EVs to the Pokémon, up to a cap of 100.",
        search: false
    },
    protein: {
        num: 46,
        id: "protein",
        name: "Protein",
        calcName: "Protein",
        desc: "Adds 10 Attack EVs to the Pokémon, up to a cap of 100.",
        search: false
    },
    iron: {
        num: 47,
        id: "iron",
        name: "Iron",
        calcName: "Iron",
        desc: "Adds 10 Defense EVs to the Pokémon, up to a cap of 100.",
        search: false
    },
    carbos: {
        num: 48,
        id: "carbos",
        name: "Carbos",
        calcName: "Carbos",
        desc: "Adds 10 Speed EVs to the Pokémon, up to a cap of 100.",
        search: false
    },
    calcium: {
        num: 49,
        id: "calcium",
        name: "Calcium",
        calcName: "Calcium",
        desc: "Adds 10 Special Attack EVs to the Pokémon, up to a cap of 100.",
        search: false
    },
    rarecandy: {
        num: 50,
        id: "rarecandy",
        name: "Rare Candy",
        calcName: "Rare Candy",
        desc: "Raises the Pokémon's level by 1.",
        search: false
    },
    ppup: {
        num: 51,
        id: "ppup",
        name: "PP Up",
        calcName: "PP Up",
        desc: "I will not stoop this low.",
        search: false
    },
    zinc: {
        num: 52,
        id: "zinc",
        name: "Zinc",
        calcName: "Zinc",
        desc: "Adds 10 Special Defense EVs to the Pokémon, up to a cap of 100.",
        search: false
    },
    ppmax: {
        num: 53,
        id: "ppmax",
        name: "PP Max",
        calcName: "PP Max",
        desc: "Okay, maybe I did.",
        search: false
    },
    oldgateau: {
        num: 54,
        id: "oldgateau",
        name: "Old Gateau",
        calcName: "Old Gateau",
        desc: "A consumable held item that cures the Pokémon's status condition.",
        search: false
    },
    guardspec: {
        num: 55,
        id: "guardspec",
        name: "Guard Spec.",
        calcName: "Guard Spec.",
        desc: "Heh, nice try.",
        search: false
    },
    direhit: {
        num: 56,
        id: "direhit",
        name: "Dire Hit",
        calcName: "Dire Hit",
        desc: "Heh, nice try.",
        search: false
    },
    xattack: {
        num: 57,
        id: "xattack",
        name: "X Attack",
        calcName: "X Attack",
        desc: "Heh, nice try.",
        search: false
    },
    xdefend: {
        num: 58,
        id: "xdefend",
        name: "X Defend",
        calcName: "X Defend",
        desc: "Heh, nice try.",
        search: false
    },
    xspeed: {
        num: 59,
        id: "xspeed",
        name: "X Speed",
        calcName: "X Speed",
        desc: "Heh, nice try.",
        search: false
    },
    xaccuracy: {
        num: 60,
        id: "xaccuracy",
        name: "X Accuracy",
        calcName: "X Accuracy",
        desc: "Heh, nice try.",
        search: false
    },
    xspecial: {
        num: 61,
        id: "xspecial",
        name: "X Special",
        calcName: "X Special",
        desc: "Heh, nice try.",
        search: false
    },
    xspdef: {
        num: 62,
        id: "xspdef",
        name: "X Sp. Def",
        calcName: "X Sp. Def",
        desc: "Heh, nice try.",
        search: false
    },
    pokedoll: {
        num: 63,
        id: "pokedoll",
        name: "Poké Doll",
        calcName: "Poké Doll",
        desc: "Allows the player to escape a wild battle.",
        search: false
    },
    fluffytail: {
        num: 64,
        id: "fluffytail",
        name: "Fluffy Tail",
        calcName: "Fluffy Tail",
        desc: "Allows the player to escape a wild battle.",
        search: false
    },
    blueflute: {
        num: 65,
        id: "blueflute",
        name: "Blue Flute",
        calcName: "Blue Flute",
        desc: "Cures a Pokémon's Sleep in battle.",
        search: false
    },
    yellowflute: {
        num: 66,
        id: "yellowflute",
        name: "Yellow Flute",
        calcName: "Yellow Flute",
        desc: "Cures a Pokémon's confusion.",
        search: false
    },
    redflute: {
        num: 67,
        id: "redflute",
        name: "Red Flute",
        calcName: "Red Flute",
        desc: "Cures a Pokémon's infatuation.",
        search: false
    },
    blackflute: {
        num: 68,
        id: "blackflute",
        name: "Black Flute",
        calcName: "Black Flute",
        desc: "Decreases wild Pokémon encounter rates by 50% until a map transition takes place.",
        search: false
    },
    whiteflute: {
        num: 69,
        id: "whiteflute",
        name: "White Flute",
        calcName: "White Flute",
        desc: "Increases wild Pokémon encounter rates by 50% until a map transition takes place.",
        search: false
    },
    berserkgene: {
        num: 70,
        id: "berserkgene",
        name: "Berserk Gene",
        calcName: "Berserk Gene",
        desc: "A consumable held item that increases the Attack stat of the Pokémon immediately.",
        search: true
    },
    ragecandybar: {
        num: 71,
        id: "ragecandybar",
        name: "RageCandyBar",
        calcName: "RageCandyBar",
        desc: "A consumable held item that restores 100 HP if the Pokémon's HP falls below 50%.",
        search: true
    },
    redshard: {
        num: 72,
        id: "redshard",
        name: "Red Shard",
        calcName: "Red Shard",
        desc: "Can be exchanged with Move Tutors to teach Pokémon some exclusive moves.",
        search: false
    },
    blueshard: {
        num: 73,
        id: "blueshard",
        name: "Blue Shard",
        calcName: "Blue Shard",
        desc: "Can be exchanged with Move Tutors to teach Pokémon some exclusive moves.",
        search: false
    },
    yellowshard: {
        num: 74,
        id: "yellowshard",
        name: "Yellow Shard",
        calcName: "Yellow Shard",
        desc: "Can be exchanged with Move Tutors to teach Pokémon some exclusive moves.",
        search: false
    },
    greenshard: {
        num: 75,
        id: "greenshard",
        name: "Green Shard",
        calcName: "Green Shard",
        desc: "Can be exchanged with Move Tutors to teach Pokémon some exclusive moves.",
        search: false
    },
    superrepel: {
        num: 76,
        id: "superrepel",
        name: "Super Repel",
        calcName: "Super Repel",
        desc: "Prevents wild Pokémon encounters that are lower than the lead Pokémon's level for 200 steps.",
        search: false
    },
    maxrepel: {
        num: 77,
        id: "maxrepel",
        name: "Max Repel",
        calcName: "Max Repel",
        desc: "Prevents wild Pokémon encounters that are lower than the lead Pokémon's level for 250 steps.",
        search: false
    },
    escaperope: {
        num: 78,
        id: "escaperope",
        name: "Escape Rope",
        calcName: "Escape Rope",
        desc: "If used inside a cave or dungeon, warps the player to its entrance.",
        search: false
    },
    repel: {
        num: 79,
        id: "repel",
        name: "Repel",
        calcName: "Repel",
        desc: "Prevents wild Pokémon encounters that are lower than the lead Pokémon's level for 100 steps.",
        search: false
    },
    sunstone: {
        num: 80,
        id: "sunstone",
        name: "Sun Stone",
        calcName: "Sun Stone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    moonstone: {
        num: 81,
        id: "moonstone",
        name: "Moon Stone",
        calcName: "Moon Stone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    firestone: {
        num: 82,
        id: "firestone",
        name: "Fire Stone",
        calcName: "Fire Stone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    thunderstone: {
        num: 83,
        id: "thunderstone",
        name: "Thunderstone",
        calcName: "Thunderstone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    waterstone: {
        num: 84,
        id: "waterstone",
        name: "Water Stone",
        calcName: "Water Stone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    leafstone: {
        num: 85,
        id: "leafstone",
        name: "Leaf Stone",
        calcName: "Leaf Stone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    tinymushroom: {
        num: 86,
        id: "tinymushroom",
        name: "TinyMushroom",
        calcName: "TinyMushroom",
        desc: "This item serves no purpose except to be sold.",
        search: false
    },
    bigmushroom: {
        num: 87,
        id: "bigmushroom",
        name: "Big Mushroom",
        calcName: "Big Mushroom",
        desc: "This item serves no purpose except to be sold.",
        search: false
    },
    pearl: {
        num: 88,
        id: "pearl",
        name: "Pearl",
        calcName: "Pearl",
        desc: "This item serves no purpose except to be sold.",
        search: false
    },
    bigpearl: {
        num: 89,
        id: "bigpearl",
        name: "Big Pearl",
        calcName: "Big Pearl",
        desc: "This item serves no purpose except to be sold.",
        search: false
    },
    stardust: {
        num: 90,
        id: "stardust",
        name: "Stardust",
        calcName: "Stardust",
        desc: "This item serves no purpose except to be sold.",
        search: false
    },
    starpiece: {
        num: 91,
        id: "starpiece",
        name: "Star Piece",
        calcName: "Star Piece",
        desc: "This item serves no purpose except to be sold.",
        search: false
    },
    bignugget: {
        num: 92,
        id: "bignugget",
        name: "Big Nugget",
        calcName: "Big Nugget",
        desc: "This item serves no purpose except to be sold.",
        search: false
    },
    heartscale: {
        num: 93,
        id: "heartscale",
        name: "Heart Scale",
        calcName: "Heart Scale",
        desc: "Can be exchanged with the Move Reminder to teach Pokémon a previously learned move.",
        search: false
    },
    honey: {
        num: 94,
        id: "honey",
        name: "Honey",
        calcName: "Honey",
        desc: "Used to attract wild Pokémon. Can be used in tall grass, caves, while surfing, or on Honey trees.",
        search: false
    },
    growthmulch: {
        num: 95,
        id: "growthmulch",
        name: "Growth Mulch",
        calcName: "Growth Mulch",
        desc: "This item is unobtainable.",
        search: false
    },
    dampmulch: {
        num: 96,
        id: "dampmulch",
        name: "Damp Mulch",
        calcName: "Damp Mulch",
        desc: "This item is unobtainable.",
        search: false
    },
    stablemulch: {
        num: 97,
        id: "stablemulch",
        name: "Stable Mulch",
        calcName: "Stable Mulch",
        desc: "This item is unobtainable.",
        search: false
    },
    gooeymulch: {
        num: 98,
        id: "gooeymulch",
        name: "Gooey Mulch",
        calcName: "Gooey Mulch",
        desc: "This item is unobtainable.",
        search: false
    },
    rootfossil: {
        num: 99,
        id: "rootfossil",
        name: "Root Fossil",
        calcName: "Root Fossil",
        desc: "This item is unobtainable.",
        search: true
    },
    clawfossil: {
        num: 100,
        id: "clawfossil",
        name: "Claw Fossil",
        calcName: "Claw Fossil",
        desc: "This item is unobtainable.",
        search: true
    },
    helixfossil: {
        num: 101,
        id: "helixfossil",
        name: "Helix Fossil",
        calcName: "Helix Fossil",
        desc: "This item is unobtainable.",
        search: true
    },
    domefossil: {
        num: 102,
        id: "domefossil",
        name: "Dome Fossil",
        calcName: "Dome Fossil",
        desc: "This item is unobtainable.",
        search: true
    },
    oldamber: {
        num: 103,
        id: "oldamber",
        name: "Old Amber",
        calcName: "Old Amber",
        desc: "This item is unobtainable.",
        search: true
    },
    armorfossil: {
        num: 104,
        id: "armorfossil",
        name: "Armor Fossil",
        calcName: "Armor Fossil",
        desc: "Can be revived into <span data-target=\"species/shieldon\">Shieldon</span> at the Oreburgh Mining Museum.",
        search: true
    },
    skullfossil: {
        num: 105,
        id: "skullfossil",
        name: "Skull Fossil",
        calcName: "Skull Fossil",
        desc: "Can be revived into <span data-target=\"species/cranidos\">Cranidos</span> at the Oreburgh Mining Museum.",
        search: true
    },
    rarebone: {
        num: 106,
        id: "rarebone",
        name: "Rare Bone",
        calcName: "Rare Bone",
        desc: "This item serves no purpose except to be sold.",
        search: true
    },
    shinystone: {
        num: 107,
        id: "shinystone",
        name: "Shiny Stone",
        calcName: "Shiny Stone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    duskstone: {
        num: 108,
        id: "duskstone",
        name: "Dusk Stone",
        calcName: "Dusk Stone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    dawnstone: {
        num: 109,
        id: "dawnstone",
        name: "Dawn Stone",
        calcName: "Dawn Stone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    ovalstone: {
        num: 110,
        id: "ovalstone",
        name: "Oval Stone",
        calcName: "Oval Stone",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    oddkeystone: {
        num: 111,
        id: "oddkeystone",
        name: "Odd Keystone",
        calcName: "Odd Keystone",
        desc: "Used to summon <span data-target=\"species/spiritomb\">Spiritomb</span>.",
        search: false
    },
    griseousorb: {
        num: 112,
        id: "griseousorb",
        name: "Griseous Orb",
        calcName: "Griseous Orb",
        desc: "Can be held by <span data-target=\"species/giratina\">Giratina</span> to transform it into its <span data-target=\"species/giratinaorigin\">Origin forme</span>, and increase the power of its <span data-target=\"type/dragon\">Dragon</span> and <span data-target=\"type/ghost\">Ghost</span> type moves by 20%.",
        search: true
    },
    adamantorb: {
        num: 135,
        id: "adamantorb",
        name: "Adamant Orb",
        calcName: "Adamant Orb",
        desc: "Can be held by <span data-target=\"species/dialga\">Dialga</span> to increase the power of its <span data-target=\"type/dragon\">Dragon</span> and <span data-target=\"type/steel\">Steel</span> type moves by 20%.",
        search: true
    },
    lustrousorb: {
        num: 136,
        id: "lustrousorb",
        name: "Lustrous Orb",
        calcName: "Lustrous Orb",
        desc: "Can be held by <span data-target=\"species/dialga\">Dialga</span> to increase the power of its <span data-target=\"type/dragon\">Dragon</span> and <span data-target=\"type/water\">Water</span> type moves by 20%.",
        search: true
    },
    grassmail: {
        num: 137,
        id: "grassmail",
        name: "Grass Mail",
        calcName: "Grass Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    flamemail: {
        num: 138,
        id: "flamemail",
        name: "Flame Mail",
        calcName: "Flame Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    bubblemail: {
        num: 139,
        id: "bubblemail",
        name: "Bubble Mail",
        calcName: "Bubble Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    bloommail: {
        num: 140,
        id: "bloommail",
        name: "Bloom Mail",
        calcName: "Bloom Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    tunnelmail: {
        num: 141,
        id: "tunnelmail",
        name: "Tunnel Mail",
        calcName: "Tunnel Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    steelmail: {
        num: 142,
        id: "steelmail",
        name: "Steel Mail",
        calcName: "Steel Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    heartmail: {
        num: 143,
        id: "heartmail",
        name: "Heart Mail",
        calcName: "Heart Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    snowmail: {
        num: 144,
        id: "snowmail",
        name: "Snow Mail",
        calcName: "Snow Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    spacemail: {
        num: 145,
        id: "spacemail",
        name: "Space Mail",
        calcName: "Space Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    airmail: {
        num: 146,
        id: "airmail",
        name: "Air Mail",
        calcName: "Air Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    mosaicmail: {
        num: 147,
        id: "mosaicmail",
        name: "Mosaic Mail",
        calcName: "Mosaic Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    brickmail: {
        num: 148,
        id: "brickmail",
        name: "Brick Mail",
        calcName: "Brick Mail",
        desc: "This item serves no purpose.",
        search: false
    },
    cheriberry: {
        num: 149,
        id: "cheriberry",
        name: "Cheri Berry",
        calcName: "Cheri Berry",
        desc: "A consumable held item that cures the Pokémon's Paralysis.",
        search: true
    },
    chestoberry: {
        num: 150,
        id: "chestoberry",
        name: "Chesto Berry",
        calcName: "Chesto Berry",
        desc: "A consumable held item that cures the Pokémon's Sleep.",
        search: true
    },
    pechaberry: {
        num: 151,
        id: "pechaberry",
        name: "Pecha Berry",
        calcName: "Pecha Berry",
        desc: "A consumable held item that cures the Pokémon's Poison.",
        search: true
    },
    rawstberry: {
        num: 152,
        id: "rawstberry",
        name: "Rawst Berry",
        calcName: "Rawst Berry",
        desc: "A consumable held item that cures the Pokémon's Burn.",
        search: true
    },
    aspearberry: {
        num: 153,
        id: "aspearberry",
        name: "Aspear Berry",
        calcName: "Aspear Berry",
        desc: "A consumable held item that cures the Pokémon's Freeze.",
        search: true
    },
    leppaberry: {
        num: 154,
        id: "leppaberry",
        name: "Leppa Berry",
        calcName: "Leppa Berry",
        desc: "A consumable held item that restores 10 PP to one of the Pokémon's moves.",
        search: true
    },
    oranberry: {
        num: 155,
        id: "oranberry",
        name: "Oran Berry",
        calcName: "Oran Berry",
        desc: "A consumable held item that restores 10 HP if the Pokémon's HP falls below 50%.",
        search: true
    },
    persimberry: {
        num: 156,
        id: "persimberry",
        name: "Persim Berry",
        calcName: "Persim Berry",
        desc: "A consumable held item that cures the Pokémon's confusion.",
        search: true
    },
    lumberry: {
        num: 157,
        id: "lumberry",
        name: "Lum Berry",
        calcName: "Lum Berry",
        desc: "A consumable held item that cures the Pokémon's status condition.",
        search: true
    },
    sitrusberry: {
        num: 158,
        id: "sitrusberry",
        name: "Sitrus Berry",
        calcName: "Sitrus Berry",
        desc: "A consumable held item that restores 25% HP if the Pokémon's HP falls below 50%.",
        search: true
    },
    figyberry: {
        num: 159,
        id: "figyberry",
        name: "Figy Berry",
        calcName: "Figy Berry",
        desc: "A consumable held item that restores 12.5% HP if the Pokémon's HP falls below 50%, but confuses Pokémon with a -Atk nature.",
        search: true
    },
    wikiberry: {
        num: 160,
        id: "wikiberry",
        name: "Wiki Berry",
        calcName: "Wiki Berry",
        desc: "A consumable held item that restores 12.5% HP if the Pokémon's HP falls below 50%, but confuses Pokémon with a -SpA nature.",
        search: true
    },
    magoberry: {
        num: 161,
        id: "magoberry",
        name: "Mago Berry",
        calcName: "Mago Berry",
        desc: "A consumable held item that restores 12.5% HP if the Pokémon's HP falls below 50%, but confuses Pokémon with a -Spe nature.",
        search: true
    },
    aguavberry: {
        num: 162,
        id: "aguavberry",
        name: "Aguav Berry",
        calcName: "Aguav Berry",
        desc: "A consumable held item that restores 12.5% HP if the Pokémon's HP falls below 50%, but confuses Pokémon with a -SpD nature.",
        search: true
    },
    iapapaberry: {
        num: 163,
        id: "iapapaberry",
        name: "Iapapa Berry",
        calcName: "Iapapa Berry",
        desc: "A consumable held item that restores 12.5% HP if the Pokémon's HP falls below 50%, but confuses Pokémon with a -Def nature.",
        search: true
    },
    razzberry: {
        num: 164,
        id: "razzberry",
        name: "Razz Berry",
        calcName: "Razz Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    blukberry: {
        num: 165,
        id: "blukberry",
        name: "Bluk Berry",
        calcName: "Bluk Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    nanabberry: {
        num: 166,
        id: "nanabberry",
        name: "Nanab Berry",
        calcName: "Nanab Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    wepearberry: {
        num: 167,
        id: "wepearberry",
        name: "Wepear Berry",
        calcName: "Wepear Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    pinapberry: {
        num: 168,
        id: "pinapberry",
        name: "Pinap Berry",
        calcName: "Pinap Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    pomegberry: {
        num: 169,
        id: "pomegberry",
        name: "Pomeg Berry",
        calcName: "Pomeg Berry",
        desc: "Raises the Pokémon's friendship, but lowers its HP EV by 10.",
        search: true
    },
    kelpsyberry: {
        num: 170,
        id: "kelpsyberry",
        name: "Kelpsy Berry",
        calcName: "Kelpsy Berry",
        desc: "Raises the Pokémon's friendship, but lowers its Attack EV by 10.",
        search: true
    },
    qualotberry: {
        num: 171,
        id: "qualotberry",
        name: "Qualot Berry",
        calcName: "Qualot Berry",
        desc: "Raises the Pokémon's friendship, but lowers its Defense EV by 10.",
        search: true
    },
    hondewberry: {
        num: 172,
        id: "hondewberry",
        name: "Hondew Berry",
        calcName: "Hondew Berry",
        desc: "Raises the Pokémon's friendship, but lowers its Special Attack EV by 10.",
        search: true
    },
    grepaberry: {
        num: 173,
        id: "grepaberry",
        name: "Grepa Berry",
        calcName: "Grepa Berry",
        desc: "Raises the Pokémon's friendship, but lowers its Special Defense EV by 10.",
        search: true
    },
    tamatoberry: {
        num: 174,
        id: "tamatoberry",
        name: "Tamato Berry",
        calcName: "Tamato Berry",
        desc: "Raises the Pokémon's friendship, but lowers its Speed EV by 10.",
        search: true
    },
    cornnberry: {
        num: 175,
        id: "cornnberry",
        name: "Cornn Berry",
        calcName: "Cornn Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    magostberry: {
        num: 176,
        id: "magostberry",
        name: "Magost Berry",
        calcName: "Magost Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    rabutaberry: {
        num: 177,
        id: "rabutaberry",
        name: "Rabuta Berry",
        calcName: "Rabuta Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    nomelberry: {
        num: 178,
        id: "nomelberry",
        name: "Nomel Berry",
        calcName: "Nomel Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    spelonberry: {
        num: 179,
        id: "spelonberry",
        name: "Spelon Berry",
        calcName: "Spelon Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    pamtreberry: {
        num: 180,
        id: "pamtreberry",
        name: "Pamtre Berry",
        calcName: "Pamtre Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    watmelberry: {
        num: 181,
        id: "watmelberry",
        name: "Watmel Berry",
        calcName: "Watmel Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    durinberry: {
        num: 182,
        id: "durinberry",
        name: "Durin Berry",
        calcName: "Durin Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    belueberry: {
        num: 183,
        id: "belueberry",
        name: "Belue Berry",
        calcName: "Belue Berry",
        desc: "Can only be used to make Poffins.",
        search: true
    },
    occaberry: {
        num: 184,
        id: "occaberry",
        name: "Occa Berry",
        calcName: "Occa Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/fire\">Fire</span> attack by 50%.",
        search: true
    },
    passhoberry: {
        num: 185,
        id: "passhoberry",
        name: "Passho Berry",
        calcName: "Passho Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/water\">Water</span> attack by 50%.",
        search: true
    },
    wacanberry: {
        num: 186,
        id: "wacanberry",
        name: "Wacan Berry",
        calcName: "Wacan Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/electric\">Electric</span> attack by 50%.",
        search: true
    },
    rindoberry: {
        num: 187,
        id: "rindoberry",
        name: "Rindo Berry",
        calcName: "Rindo Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/grass\">Grass</span> attack by 50%.",
        search: true
    },
    yacheberry: {
        num: 188,
        id: "yacheberry",
        name: "Yache Berry",
        calcName: "Yache Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/ice\">Ice</span> attack by 50%.",
        search: true
    },
    chopleberry: {
        num: 189,
        id: "chopleberry",
        name: "Chople Berry",
        calcName: "Chople Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/fighting\">Fighting</span> attack by 50%.",
        search: true
    },
    kebiaberry: {
        num: 190,
        id: "kebiaberry",
        name: "Kebia Berry",
        calcName: "Kebia Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/poison\">Poison</span> attack by 50%.",
        search: true
    },
    shucaberry: {
        num: 191,
        id: "shucaberry",
        name: "Shuca Berry",
        calcName: "Shuca Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/ground\">Ground</span> attack by 50%.",
        search: true
    },
    cobaberry: {
        num: 192,
        id: "cobaberry",
        name: "Coba Berry",
        calcName: "Coba Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/flying\">Flying</span> attack by 50%.",
        search: true
    },
    payapaberry: {
        num: 193,
        id: "payapaberry",
        name: "Payapa Berry",
        calcName: "Payapa Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/psychic\">Psychic</span> attack by 50%.",
        search: true
    },
    tangaberry: {
        num: 194,
        id: "tangaberry",
        name: "Tanga Berry",
        calcName: "Tanga Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/bug\">Bug</span> attack by 50%.",
        search: true
    },
    chartiberry: {
        num: 195,
        id: "chartiberry",
        name: "Charti Berry",
        calcName: "Charti Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/rock\">Rock</span> attack by 50%.",
        search: true
    },
    kasibberry: {
        num: 196,
        id: "kasibberry",
        name: "Kasib Berry",
        calcName: "Kasib Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/ghost\">Ghost</span> attack by 50%.",
        search: true
    },
    habanberry: {
        num: 197,
        id: "habanberry",
        name: "Haban Berry",
        calcName: "Haban Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/dragon\">Dragon</span> attack by 50%.",
        search: true
    },
    colburberry: {
        num: 198,
        id: "colburberry",
        name: "Colbur Berry",
        calcName: "Colbur Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/dark\">Dark</span> attack by 50%.",
        search: true
    },
    babiriberry: {
        num: 199,
        id: "babiriberry",
        name: "Babiri Berry",
        calcName: "Babiri Berry",
        desc: "A consumable held item that reduces damage taken from a Super-Effective <span data-target=\"type/steel\">Steel</span> attack by 50%.",
        search: true
    },
    chilanberry: {
        num: 200,
        id: "chilanberry",
        name: "Chilan Berry",
        calcName: "Chilan Berry",
        desc: "A consumable held item that reduces damage taken from a <span data-target=\"type/\"></span> attack by 50%.",
        search: true
    },
    liechiberry: {
        num: 201,
        id: "liechiberry",
        name: "Liechi Berry",
        calcName: "Liechi Berry",
        desc: "A consumable held item that increases the Attack stat of the Pokémon by 1 stage if its HP falls below 25%.",
        search: true
    },
    ganlonberry: {
        num: 202,
        id: "ganlonberry",
        name: "Ganlon Berry",
        calcName: "Ganlon Berry",
        desc: "A consumable held item that increases the Defense stat of the Pokémon by 1 stage immediately.",
        search: true
    },
    salacberry: {
        num: 203,
        id: "salacberry",
        name: "Salac Berry",
        calcName: "Salac Berry",
        desc: "A consumable held item that increases the Speed stat of the Pokémon by 1 stage if its HP falls below 25%.",
        search: true
    },
    petayaberry: {
        num: 204,
        id: "petayaberry",
        name: "Petaya Berry",
        calcName: "Petaya Berry",
        desc: "A consumable held item that increases the Special Attack stat of the Pokémon by 1 stage if its HP falls below 25%.",
        search: true
    },
    apicotberry: {
        num: 205,
        id: "apicotberry",
        name: "Apicot Berry",
        calcName: "Apicot Berry",
        desc: "A consumable held item that increases the Special Defense stat of the Pokémon immediately.",
        search: true
    },
    lansatberry: {
        num: 206,
        id: "lansatberry",
        name: "Lansat Berry",
        calcName: "Lansat Berry",
        desc: "A consumable held item that raises the Pokémon's critical hit ratio by 2 stages if its HP falls below 25%.",
        search: true
    },
    starfberry: {
        num: 207,
        id: "starfberry",
        name: "Starf Berry",
        calcName: "Starf Berry",
        desc: "A consumable held item that increases a random stat of the Pokémon by 2 stages if its HP falls below 25%.",
        search: true
    },
    enigmaberry: {
        num: 208,
        id: "enigmaberry",
        name: "Enigma Berry",
        calcName: "Enigma Berry",
        desc: "A consumable held item that restores 25% HP if the Pokémon gets attacked by a Super-Effective move.",
        search: true
    },
    micleberry: {
        num: 209,
        id: "micleberry",
        name: "Micle Berry",
        calcName: "Micle Berry",
        desc: "A consumable held item that increases the accuracy of the Pokémon's next move by 20% if its HP falls below 25%.",
        search: true
    },
    custapberry: {
        num: 210,
        id: "custapberry",
        name: "Custap Berry",
        calcName: "Custap Berry",
        desc: "A consumable held item that causes the Pokémon's next move to move first in its priority bracket if its HP falls below 25%.",
        search: true
    },
    jabocaberry: {
        num: 211,
        id: "jabocaberry",
        name: "Jaboca Berry",
        calcName: "Jaboca Berry",
        desc: "A consumable held item that damages Pokémon that attack the holder with a <span data-target=\"category/physical\">Physical</span> move by 1/6 of their total HP.",
        search: true
    },
    rowapberry: {
        num: 212,
        id: "rowapberry",
        name: "Rowap Berry",
        calcName: "Rowap Berry",
        desc: "A consumable held item that damages Pokémon that attack the holder with a <span data-target=\"category/special\">Special</span> move by 1/6 of their total HP.",
        search: true
    },
    brightpowder: {
        num: 213,
        id: "brightpowder",
        name: "BrightPowder",
        calcName: "Bright Powder",
        desc: "A held item that decreases the accuracy of moves targeting the holder by 11%.",
        search: true
    },
    whiteherb: {
        num: 214,
        id: "whiteherb",
        name: "White Herb",
        calcName: "White Herb",
        desc: "A consumable held item that restores any negative stats.",
        search: true
    },
    machobrace: {
        num: 215,
        id: "machobrace",
        name: "Macho Brace",
        calcName: "Macho Brace",
        desc: "A held item that halves the Pokémon's Speed stat.",
        search: true
    },
    expshare: {
        num: 216,
        id: "expshare",
        name: "Exp. Share",
        calcName: "Exp. Share",
        desc: "A held item that causes the Pokémon to gain 50% of the total experience gained when defeating an enemy Pokémon.",
        search: false
    },
    quickclaw: {
        num: 217,
        id: "quickclaw",
        name: "Quick Claw",
        calcName: "Quick Claw",
        desc: "A held item that has a 20% chance to cause the Pokémon's moves to move first in their priority bracket.",
        search: true
    },
    soothebell: {
        num: 218,
        id: "soothebell",
        name: "Soothe Bell",
        calcName: "Soothe Bell",
        desc: "A held item that causes the Pokémon to gain 50% more friendship.",
        search: false
    },
    mentalherb: {
        num: 219,
        id: "mentalherb",
        name: "Mental Herb",
        calcName: "Mental Herb",
        desc: "A consumable held item that cures a Pokémon's infatuation.",
        search: true
    },
    choiceband: {
        num: 220,
        id: "choiceband",
        name: "Choice Band",
        calcName: "Choice Band",
        desc: "A held item that increases the Attack stat of the Pokémon by 50%, but locks it into only being able to use the first move it used.",
        search: true
    },
    kingsrock: {
        num: 221,
        id: "kingsrock",
        name: "King's Rock",
        calcName: "King's Rock",
        desc: "A held item that gives certain moves a 10% chance to flinch.",
        search: true
    },
    silverpowder: {
        num: 222,
        id: "silverpowder",
        name: "SilverPowder",
        calcName: "Silver Powder",
        desc: "A held item that increases the power of <span data-target=\"type/bug\">Bug</span> type moves by 20%.",
        search: true
    },
    amuletcoin: {
        num: 223,
        id: "amuletcoin",
        name: "Amulet Coin",
        calcName: "Amulet Coin",
        desc: "A held item that doubles the amount of money obtained after winning a trainer battle, if the Pokémon took part in the battle.",
        search: false
    },
    cleansetag: {
        num: 224,
        id: "cleansetag",
        name: "Cleanse Tag",
        calcName: "Cleanse Tag",
        desc: "A held item that decreases wild Pokémon encounter rates by 33%, if the Pokémon is the first member of the party.",
        search: false
    },
    souldew: {
        num: 225,
        id: "souldew",
        name: "Soul Dew",
        calcName: "Soul Dew",
        desc: "Can be held by <span data-target=\"species/latios\">Latios</span> or <span data-target=\"species/latias\">Latias</span> to increase their Special Attack and Special Defense stats by 50%.",
        search: true
    },
    deepseatooth: {
        num: 226,
        id: "deepseatooth",
        name: "DeepSeaTooth",
        calcName: "Deep Sea Tooth",
        desc: "Can be held by <span data-target=\"species/clamperl\">Clamperl</span> to increase its Special Attack stat by 100%.",
        search: true
    },
    deepseascale: {
        num: 227,
        id: "deepseascale",
        name: "DeepSeaScale",
        calcName: "Deep Sea Scale",
        desc: "Can be held by <span data-target=\"species/clamperl\">Clamperl</span> to increase its Special Defense stat by 100%.",
        search: true
    },
    smokeball: {
        num: 228,
        id: "smokeball",
        name: "Smoke Ball",
        calcName: "Smoke Ball",
        desc: "A held item that allows the Pokémon to flee or use <span data-target=\"move/teleport\">Teleport</span> even if trapped.",
        search: false
    },
    everstone: {
        num: 229,
        id: "everstone",
        name: "Everstone",
        calcName: "Everstone",
        desc: "A held item that prevents the Pokémon from evolving.",
        search: false
    },
    focusband: {
        num: 230,
        id: "focusband",
        name: "Focus Band",
        calcName: "Focus Band",
        desc: "A held item that has a 10% chance to allow the Pokémon to survive a fatal attack with 1 HP.",
        search: true
    },
    luckyegg: {
        num: 231,
        id: "luckyegg",
        name: "Lucky Egg",
        calcName: "Lucky Egg",
        desc: "A held item that causes the Pokémon to gain 50% more experience.",
        search: false
    },
    scopelens: {
        num: 232,
        id: "scopelens",
        name: "Scope Lens",
        calcName: "Scope Lens",
        desc: "A held item that raises the Pokémon's critical hit ratio by 1 stage.",
        search: true
    },
    metalcoat: {
        num: 233,
        id: "metalcoat",
        name: "Metal Coat",
        calcName: "Metal Coat",
        desc: "A held item that increases the power of <span data-target=\"type/steel\">Steel</span> type moves by 20%.",
        search: true
    },
    leftovers: {
        num: 234,
        id: "leftovers",
        name: "Leftovers",
        calcName: "Leftovers",
        desc: "A held item that heals the user by 1/16 of its total HP at the end of every turn.",
        search: true
    },
    dragonscale: {
        num: 235,
        id: "dragonscale",
        name: "Dragon Scale",
        calcName: "Dragon Scale",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    lightball: {
        num: 236,
        id: "lightball",
        name: "Light Ball",
        calcName: "Light Ball",
        desc: "Can be held by <span data-target=\"species/pikachu\">Pikachu</span> to increase the power of its moves by 100%.",
        search: true
    },
    softsand: {
        num: 237,
        id: "softsand",
        name: "Soft Sand",
        calcName: "Soft Sand",
        desc: "A held item that increases the power of <span data-target=\"type/ground\">Ground</span> type moves by 20%.",
        search: true
    },
    hardstone: {
        num: 238,
        id: "hardstone",
        name: "Hard Stone",
        calcName: "Hard Stone",
        desc: "A held item that increases the power of <span data-target=\"type/rock\">Rock</span> type moves by 20%.",
        search: true
    },
    miracleseed: {
        num: 239,
        id: "miracleseed",
        name: "Miracle Seed",
        calcName: "Miracle Seed",
        desc: "A held item that increases the power of <span data-target=\"type/grass\">Grass</span> type moves by 20%.",
        search: true
    },
    blackglasses: {
        num: 240,
        id: "blackglasses",
        name: "BlackGlasses",
        calcName: "Black Glasses",
        desc: "A held item that increases the power of <span data-target=\"type/dark\">Dark</span> type moves by 20%.",
        search: true
    },
    blackbelt: {
        num: 241,
        id: "blackbelt",
        name: "Black Belt",
        calcName: "Black Belt",
        desc: "A held item that increases the power of <span data-target=\"type/fighting\">Fighting</span> type moves by 20%.",
        search: true
    },
    magnet: {
        num: 242,
        id: "magnet",
        name: "Magnet",
        calcName: "Magnet",
        desc: "A held item that increases the power of <span data-target=\"type/electric\">Electric</span> type moves by 20%.",
        search: true
    },
    mysticwater: {
        num: 243,
        id: "mysticwater",
        name: "Mystic Water",
        calcName: "Mystic Water",
        desc: "A held item that increases the power of <span data-target=\"type/water\">Water</span> type moves by 20%.",
        search: true
    },
    sharpbeak: {
        num: 244,
        id: "sharpbeak",
        name: "Sharp Beak",
        calcName: "Sharp Beak",
        desc: "A held item that increases the power of <span data-target=\"type/flying\">Flying</span> type moves by 20%.",
        search: true
    },
    poisonbarb: {
        num: 245,
        id: "poisonbarb",
        name: "Poison Barb",
        calcName: "Poison Barb",
        desc: "A held item that increases the power of <span data-target=\"type/poison\">Poison</span> type moves by 20%.",
        search: true
    },
    nevermeltice: {
        num: 246,
        id: "nevermeltice",
        name: "NeverMeltIce",
        calcName: "Never-Melt Ice",
        desc: "A held item that increases the power of <span data-target=\"type/ice\">Ice</span> type moves by 20%.",
        search: true
    },
    spelltag: {
        num: 247,
        id: "spelltag",
        name: "Spell Tag",
        calcName: "Spell Tag",
        desc: "A held item that increases the power of <span data-target=\"type/ghost\">Ghost</span> type moves by 20%.",
        search: true
    },
    twistedspoon: {
        num: 248,
        id: "twistedspoon",
        name: "TwistedSpoon",
        calcName: "Twisted Spoon",
        desc: "A held item that increases the power of <span data-target=\"type/psychic\">Psychic</span> type moves by 20%.",
        search: true
    },
    charcoal: {
        num: 249,
        id: "charcoal",
        name: "Charcoal",
        calcName: "Charcoal",
        desc: "A held item that increases the power of <span data-target=\"type/fire\">Fire</span> type moves by 20%.",
        search: true
    },
    dragonfang: {
        num: 250,
        id: "dragonfang",
        name: "Dragon Fang",
        calcName: "Dragon Fang",
        desc: "A held item that increases the power of <span data-target=\"type/dragon\">Dragon</span> type moves by 20%.",
        search: true
    },
    silkscarf: {
        num: 251,
        id: "silkscarf",
        name: "Silk Scarf",
        calcName: "Silk Scarf",
        desc: "A held item that increases the power of <span data-target=\"type/normal\">Normal</span> type moves by 20%.",
        search: true
    },
    upgrade: {
        num: 252,
        id: "upgrade",
        name: "Up-Grade",
        calcName: "Up-Grade",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    shellbell: {
        num: 253,
        id: "shellbell",
        name: "Shell Bell",
        calcName: "Shell Bell",
        desc: "A held item that heals the Pokémon by 1/8 of any damage it deals.",
        search: true
    },
    seaincense: {
        num: 254,
        id: "seaincense",
        name: "Sea Incense",
        calcName: "Sea Incense",
        desc: "A held item that increases the power of <span data-target=\"type/water\">Water</span> type moves by 20%.",
        search: true
    },
    laxincense: {
        num: 255,
        id: "laxincense",
        name: "Lax Incense",
        calcName: "Lax Incense",
        desc: "A held item that decreases the accuracy of moves targeting the holder by 11%.",
        search: true
    },
    luckypunch: {
        num: 256,
        id: "luckypunch",
        name: "Lucky Punch",
        calcName: "Lucky Punch",
        desc: "Can be held by <span data-target=\"species/chansey\">Chansey</span> to raise its critical hit ratio by 2 stages.",
        search: true
    },
    metalpowder: {
        num: 257,
        id: "metalpowder",
        name: "Metal Powder",
        calcName: "Metal Powder",
        desc: "Can be held by <span data-target=\"species/ditto\">Ditto</span> to increase its Defense stat by 100%.",
        search: true
    },
    thickclub: {
        num: 258,
        id: "thickclub",
        name: "Thick Club",
        calcName: "Thick Club",
        desc: "Can be held by <span data-target=\"species/cubone\">Cubone</span> or <span data-target=\"species/marowak\">Marowak</span> to increase their Attack stat by 100%.",
        search: true
    },
    leek: {
        num: 259,
        id: "leek",
        name: "Leek",
        calcName: "Leek",
        desc: "Can be held by <span data-target=\"species/farfetchd\">Farfetch’d</span> to raise its critical hit ratio by 2 stages.",
        search: true
    },
    redscarf: {
        num: 260,
        id: "redscarf",
        name: "Red Scarf",
        calcName: "Red Scarf",
        desc: "A held item that raises the Pokémon's Coolness stat in the first round of a Super Contest.",
        search: false
    },
    bluescarf: {
        num: 261,
        id: "bluescarf",
        name: "Blue Scarf",
        calcName: "Blue Scarf",
        desc: "A held item that raises the Pokémon's Beauty stat in the first round of a Super Contest.",
        search: false
    },
    pinkscarf: {
        num: 262,
        id: "pinkscarf",
        name: "Pink Scarf",
        calcName: "Pink Scarf",
        desc: "A held item that raises the Pokémon's Cuteness stat in the first round of a Super Contest.",
        search: false
    },
    greenscarf: {
        num: 263,
        id: "greenscarf",
        name: "Green Scarf",
        calcName: "Green Scarf",
        desc: "A held item that raises the Pokémon's Cleverness stat in the first round of a Super Contest.",
        search: false
    },
    yellowscarf: {
        num: 264,
        id: "yellowscarf",
        name: "Yellow Scarf",
        calcName: "Yellow Scarf",
        desc: "A held item that raises the Pokémon's Toughness stat in the first round of a Super Contest.",
        search: false
    },
    widelens: {
        num: 265,
        id: "widelens",
        name: "Wide Lens",
        calcName: "Wide Lens",
        desc: "A held item that increases the accuracy of the Pokémon's moves by 10%.",
        search: true
    },
    muscleband: {
        num: 266,
        id: "muscleband",
        name: "Muscle Band",
        calcName: "Muscle Band",
        desc: "A held item that increases the power of <span data-target=\"category/physical\">Physical</span> moves by 10%.",
        search: true
    },
    wiseglasses: {
        num: 267,
        id: "wiseglasses",
        name: "Wise Glasses",
        calcName: "Wise Glasses",
        desc: "A held item that increases the power of <span data-target=\"category/special\">Special</span> moves by 10%.",
        search: true
    },
    expertbelt: {
        num: 268,
        id: "expertbelt",
        name: "Expert Belt",
        calcName: "Expert Belt",
        desc: "A held item that increases the power of Super-Effective moves by 20%.",
        search: true
    },
    lightclay: {
        num: 269,
        id: "lightclay",
        name: "Light Clay",
        calcName: "Light Clay",
        desc: "A held item that increases the duration of <span data-target=\"move/reflect\">Reflect</span> and <span data-target=\"move/lightscreen\">Light Screen</span> to 8 turns.",
        search: true
    },
    lifeorb: {
        num: 270,
        id: "lifeorb",
        name: "Life Orb",
        calcName: "Life Orb",
        desc: "A held item that increases the power of the Pokémon's moves by 30%, but damages it by 10% of its total HP at the end of every turn.",
        search: true
    },
    powerherb: {
        num: 271,
        id: "powerherb",
        name: "Power Herb",
        calcName: "Power Herb",
        desc: "A consumable held item that causes the Pokémon to skip the charging turn of a move that would otherwise have one.",
        search: true
    },
    toxicorb: {
        num: 272,
        id: "toxicorb",
        name: "Toxic Orb",
        calcName: "Toxic Orb",
        desc: "A held item that badly poisons the Pokémon at the end of the turn.",
        search: true
    },
    flameorb: {
        num: 273,
        id: "flameorb",
        name: "Flame Orb",
        calcName: "Flame Orb",
        desc: "A held item that burns the Pokémon at the end of the turn.",
        search: true
    },
    quickpowder: {
        num: 274,
        id: "quickpowder",
        name: "Quick Powder",
        calcName: "Quick Powder",
        desc: "Can be held by <span data-target=\"species/ditto\">Ditto</span> to increase its Speed stat by 100%.",
        search: true
    },
    focussash: {
        num: 275,
        id: "focussash",
        name: "Focus Sash",
        calcName: "Focus Sash",
        desc: "A consumable held item that allows the Pokémon to survive a fatal attack from full HP with 1 HP.",
        search: true
    },
    zoomlens: {
        num: 276,
        id: "zoomlens",
        name: "Zoom Lens",
        calcName: "Zoom Lens",
        desc: "A held item that increases the accuracy of the Pokémon's moves by 20% against targets that already used a move.",
        search: true
    },
    metronome: {
        num: 277,
        id: "metronome",
        name: "Metronome",
        calcName: "Metronome",
        desc: "A held item that increases the power of a Pokémon's move by 10% for every consecutive turn where it is used, up to a maximum of 100%.",
        search: true
    },
    ironball: {
        num: 278,
        id: "ironball",
        name: "Iron Ball",
        calcName: "Iron Ball",
        desc: "A held item that halves the Pokémon's Speed stat, and grounds it.",
        search: true
    },
    laggingtail: {
        num: 279,
        id: "laggingtail",
        name: "Lagging Tail",
        calcName: "Lagging Tail",
        desc: "A held item that causes the Pokémon's moves to move last in their priority bracket.",
        search: true
    },
    destinyknot: {
        num: 280,
        id: "destinyknot",
        name: "Destiny Knot",
        calcName: "Destiny Knot",
        desc: "A held item that causes a Pokémon that infatuates the holder to also become infatuated.",
        search: true
    },
    blacksludge: {
        num: 281,
        id: "blacksludge",
        name: "Black Sludge",
        calcName: "Black Sludge",
        desc: "A held item that heals <span data-target=\"type/poison\">Poison</span> type Pokémon by 1/16 of their total HP at the end of every turn, but damages non-<span data-target=\"type/poison\">Poison</span> type Pokémon by 1/8 of their total HP at the end of every turn.",
        search: true
    },
    icyrock: {
        num: 282,
        id: "icyrock",
        name: "Icy Rock",
        calcName: "Icy Rock",
        desc: "A held item that increases the duration of hail to 12 turns.",
        search: true
    },
    smoothrock: {
        num: 283,
        id: "smoothrock",
        name: "Smooth Rock",
        calcName: "Smooth Rock",
        desc: "A held item that increases the duration of sandstorm to 12 turns.",
        search: true
    },
    heatrock: {
        num: 284,
        id: "heatrock",
        name: "Heat Rock",
        calcName: "Heat Rock",
        desc: "A held item that increases the duration of sun to 12 turns.",
        search: true
    },
    damprock: {
        num: 285,
        id: "damprock",
        name: "Damp Rock",
        calcName: "Damp Rock",
        desc: "A held item that increases the duration of rain to 12 turns.",
        search: true
    },
    gripclaw: {
        num: 286,
        id: "gripclaw",
        name: "Grip Claw",
        calcName: "Grip Claw",
        desc: "A held item that causes binding moves to last for 5 turns.",
        search: true
    },
    choicescarf: {
        num: 287,
        id: "choicescarf",
        name: "Choice Scarf",
        calcName: "Choice Scarf",
        desc: "A held item that increases the Speed stat of the Pokémon by 50%, but locks it into only being able to use the first move it used.",
        search: true
    },
    stickybarb: {
        num: 288,
        id: "stickybarb",
        name: "Sticky Barb",
        calcName: "Sticky Barb",
        desc: "A held item that damages the Pokémon by 12.5% of its total HP at the end of every turn, and transfers to any other Pokémon that attacks the holder with a contact move and is not holding an item.",
        search: true
    },
    powerbracer: {
        num: 289,
        id: "powerbracer",
        name: "Power Bracer",
        calcName: "Power Bracer",
        desc: "A held item that halves the Pokémon's Speed stat.",
        search: true
    },
    powerbelt: {
        num: 290,
        id: "powerbelt",
        name: "Power Belt",
        calcName: "Power Belt",
        desc: "A held item that halves the Pokémon's Speed stat.",
        search: true
    },
    powerlens: {
        num: 291,
        id: "powerlens",
        name: "Power Lens",
        calcName: "Power Lens",
        desc: "A held item that halves the Pokémon's Speed stat.",
        search: true
    },
    powerband: {
        num: 292,
        id: "powerband",
        name: "Power Band",
        calcName: "Power Band",
        desc: "A held item that halves the Pokémon's Speed stat.",
        search: true
    },
    poweranklet: {
        num: 293,
        id: "poweranklet",
        name: "Power Anklet",
        calcName: "Power Anklet",
        desc: "A held item that halves the Pokémon's Speed stat.",
        search: true
    },
    powerweight: {
        num: 294,
        id: "powerweight",
        name: "Power Weight",
        calcName: "Power Weight",
        desc: "A held item that halves the Pokémon's Speed stat.",
        search: true
    },
    shedshell: {
        num: 295,
        id: "shedshell",
        name: "Shed Shell",
        calcName: "Shed Shell",
        desc: "A held item that allows the Pokémon to flee or use <span data-target=\"move/teleport\">Teleport</span> even if trapped.",
        search: true
    },
    bigroot: {
        num: 296,
        id: "bigroot",
        name: "Big Root",
        calcName: "Big Root",
        desc: "A held item that increases the healing the Pokémon gets from draining moves by 30%.",
        search: true
    },
    choicespecs: {
        num: 297,
        id: "choicespecs",
        name: "Choice Specs",
        calcName: "Choice Specs",
        desc: "A held item that increases the Special Attack stat of the Pokémon by 50%, but locks it into only being able to use the first move it used.",
        search: true
    },
    flameplate: {
        num: 298,
        id: "flameplate",
        name: "Flame Plate",
        calcName: "Flame Plate",
        desc: "A held item that increases the power of <span data-target=\"type/fire\">Fire</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/fire\">Fire</span> type.",
        search: true
    },
    splashplate: {
        num: 299,
        id: "splashplate",
        name: "Splash Plate",
        calcName: "Splash Plate",
        desc: "A held item that increases the power of <span data-target=\"type/water\">Water</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/water\">Water</span> type.",
        search: true
    },
    zapplate: {
        num: 300,
        id: "zapplate",
        name: "Zap Plate",
        calcName: "Zap Plate",
        desc: "A held item that increases the power of <span data-target=\"type/electric\">Electric</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/electric\">Electric</span> type.",
        search: true
    },
    meadowplate: {
        num: 301,
        id: "meadowplate",
        name: "Meadow Plate",
        calcName: "Meadow Plate",
        desc: "A held item that increases the power of <span data-target=\"type/grass\">Grass</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/grass\">Grass</span> type.",
        search: true
    },
    icicleplate: {
        num: 302,
        id: "icicleplate",
        name: "Icicle Plate",
        calcName: "Icicle Plate",
        desc: "A held item that increases the power of <span data-target=\"type/ice\">Ice</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/ice\">Ice</span> type.",
        search: true
    },
    fistplate: {
        num: 303,
        id: "fistplate",
        name: "Fist Plate",
        calcName: "Fist Plate",
        desc: "A held item that increases the power of <span data-target=\"type/fighting\">Fighting</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/fighting\">Fighting</span> type.",
        search: true
    },
    toxicplate: {
        num: 304,
        id: "toxicplate",
        name: "Toxic Plate",
        calcName: "Toxic Plate",
        desc: "A held item that increases the power of <span data-target=\"type/poison\">Poison</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/poison\">Poison</span> type.",
        search: true
    },
    earthplate: {
        num: 305,
        id: "earthplate",
        name: "Earth Plate",
        calcName: "Earth Plate",
        desc: "A held item that increases the power of <span data-target=\"type/ground\">Ground</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/ground\">Ground</span> type.",
        search: true
    },
    skyplate: {
        num: 306,
        id: "skyplate",
        name: "Sky Plate",
        calcName: "Sky Plate",
        desc: "A held item that increases the power of <span data-target=\"type/flying\">Flying</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/flying\">Flying</span> type.",
        search: true
    },
    mindplate: {
        num: 307,
        id: "mindplate",
        name: "Mind Plate",
        calcName: "Mind Plate",
        desc: "A held item that increases the power of <span data-target=\"type/psychic\">Psychic</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/psychic\">Psychic</span> type.",
        search: true
    },
    insectplate: {
        num: 308,
        id: "insectplate",
        name: "Insect Plate",
        calcName: "Insect Plate",
        desc: "A held item that increases the power of <span data-target=\"type/bug\">Bug</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/bug\">Bug</span> type.",
        search: true
    },
    stoneplate: {
        num: 309,
        id: "stoneplate",
        name: "Stone Plate",
        calcName: "Stone Plate",
        desc: "A held item that increases the power of <span data-target=\"type/rock\">Rock</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/rock\">Rock</span> type.",
        search: true
    },
    spookyplate: {
        num: 310,
        id: "spookyplate",
        name: "Spooky Plate",
        calcName: "Spooky Plate",
        desc: "A held item that increases the power of <span data-target=\"type/ghost\">Ghost</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/ghost\">Ghost</span> type.",
        search: true
    },
    dracoplate: {
        num: 311,
        id: "dracoplate",
        name: "Draco Plate",
        calcName: "Draco Plate",
        desc: "A held item that increases the power of <span data-target=\"type/dragon\">Dragon</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/dragon\">Dragon</span> type.",
        search: true
    },
    dreadplate: {
        num: 312,
        id: "dreadplate",
        name: "Dread Plate",
        calcName: "Dread Plate",
        desc: "A held item that increases the power of <span data-target=\"type/dark\">Dark</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/dark\">Dark</span> type.",
        search: true
    },
    ironplate: {
        num: 313,
        id: "ironplate",
        name: "Iron Plate",
        calcName: "Iron Plate",
        desc: "A held item that increases the power of <span data-target=\"type/steel\">Steel</span> type moves by 50%. Can be held by <span data-target=\"species/arceus\">Arceus</span> to change its type and the type of its <span data-target=\"move/judgement\">Judgement</span> to the <span data-target=\"type/steel\">Steel</span> type.",
        search: true
    },
    oddincense: {
        num: 314,
        id: "oddincense",
        name: "Odd Incense",
        calcName: "Odd Incense",
        desc: "A held item that increases the power of <span data-target=\"type/psychic\">Psychic</span> type moves by 20%.",
        search: true
    },
    rockincense: {
        num: 315,
        id: "rockincense",
        name: "Rock Incense",
        calcName: "Rock Incense",
        desc: "A held item that increases the power of <span data-target=\"type/rock\">Rock</span> type moves by 20%.",
        search: true
    },
    fullincense: {
        num: 316,
        id: "fullincense",
        name: "Full Incense",
        calcName: "Full Incense",
        desc: "A held item that causes the Pokémon's moves to move last in their priority bracket.",
        search: true
    },
    waveincense: {
        num: 317,
        id: "waveincense",
        name: "Wave Incense",
        calcName: "Wave Incense",
        desc: "A held item that increases the power of <span data-target=\"type/water\">Water</span> type moves by 20%.",
        search: true
    },
    roseincense: {
        num: 318,
        id: "roseincense",
        name: "Rose Incense",
        calcName: "Rose Incense",
        desc: "A held item that increases the power of <span data-target=\"type/grass\">Grass</span> type moves by 20%.",
        search: true
    },
    luckincense: {
        num: 319,
        id: "luckincense",
        name: "Luck Incense",
        calcName: "Luck Incense",
        desc: "A held item that doubles the amount of money obtained after winning a trainer battle, if the Pokémon took part in the battle.",
        search: false
    },
    pureincense: {
        num: 320,
        id: "pureincense",
        name: "Pure Incense",
        calcName: "Pure Incense",
        desc: "A held item that decreases wild Pokémon encounter rates by 33%, if the Pokémon is the first member of the party.",
        search: false
    },
    protector: {
        num: 321,
        id: "protector",
        name: "Protector",
        calcName: "Protector",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    electirizer: {
        num: 322,
        id: "electirizer",
        name: "Electirizer",
        calcName: "Electirizer",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    magmarizer: {
        num: 323,
        id: "magmarizer",
        name: "Magmarizer",
        calcName: "Magmarizer",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    dubiousdisc: {
        num: 324,
        id: "dubiousdisc",
        name: "Dubious Disc",
        calcName: "Dubious Disc",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    reapercloth: {
        num: 325,
        id: "reapercloth",
        name: "Reaper Cloth",
        calcName: "Reaper Cloth",
        desc: "Used to evolve certain Pokémon.",
        search: true
    },
    razorclaw: {
        num: 326,
        id: "razorclaw",
        name: "Razor Claw",
        calcName: "Razor Claw",
        desc: "A held item that raises the Pokémon's critical hit ratio by 1 stage.",
        search: true
    },
    razorfang: {
        num: 327,
        id: "razorfang",
        name: "Razor Fang",
        calcName: "Razor Fang",
        desc: "A held item that gives certain moves a 10% chance to flinch.",
        search: true
    },
    tm01: {
        num: 328,
        id: "tm01",
        name: "TM01",
        calcName: "TM01",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/focuspunch\">Focus Punch</span>.",
        search: false
    },
    tm02: {
        num: 329,
        id: "tm02",
        name: "TM02",
        calcName: "TM02",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/dragonclaw\">Dragon Claw</span>.",
        search: false
    },
    tm03: {
        num: 330,
        id: "tm03",
        name: "TM03",
        calcName: "TM03",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/waterpulse\">Water Pulse</span>.",
        search: false
    },
    tm04: {
        num: 331,
        id: "tm04",
        name: "TM04",
        calcName: "TM04",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/calmmind\">Calm Mind</span>.",
        search: false
    },
    tm05: {
        num: 332,
        id: "tm05",
        name: "TM05",
        calcName: "TM05",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/roar\">Roar</span>.",
        search: false
    },
    tm06: {
        num: 333,
        id: "tm06",
        name: "TM06",
        calcName: "TM06",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/toxic\">Toxic</span>.",
        search: false
    },
    tm07: {
        num: 334,
        id: "tm07",
        name: "TM07",
        calcName: "TM07",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/aurorabeam\">Aurora Beam</span>.",
        search: false
    },
    tm08: {
        num: 335,
        id: "tm08",
        name: "TM08",
        calcName: "TM08",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/vitalthrow\">Vital Throw</span>.",
        search: false
    },
    tm09: {
        num: 336,
        id: "tm09",
        name: "TM09",
        calcName: "TM09",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/bulletseed\">Bullet Seed</span>.",
        search: false
    },
    tm10: {
        num: 337,
        id: "tm10",
        name: "TM10",
        calcName: "TM10",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/hiddenpower\">Hidden Power</span>.",
        search: false
    },
    tm11: {
        num: 338,
        id: "tm11",
        name: "TM11",
        calcName: "TM11",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/sunnyday\">Sunny Day</span>.",
        search: false
    },
    tm12: {
        num: 339,
        id: "tm12",
        name: "TM12",
        calcName: "TM12",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/\">-</span>.",
        search: false
    },
    tm13: {
        num: 340,
        id: "tm13",
        name: "TM13",
        calcName: "TM13",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/icebeam\">Ice Beam</span>.",
        search: false
    },
    tm14: {
        num: 341,
        id: "tm14",
        name: "TM14",
        calcName: "TM14",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/blizzard\">Blizzard</span>.",
        search: false
    },
    tm15: {
        num: 342,
        id: "tm15",
        name: "TM15",
        calcName: "TM15",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/snore\">Snore</span>.",
        search: false
    },
    tm16: {
        num: 343,
        id: "tm16",
        name: "TM16",
        calcName: "TM16",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/lightscreen\">Light Screen</span>.",
        search: false
    },
    tm17: {
        num: 344,
        id: "tm17",
        name: "TM17",
        calcName: "TM17",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/tackle\">Tackle</span>.",
        search: false
    },
    tm18: {
        num: 345,
        id: "tm18",
        name: "TM18",
        calcName: "TM18",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/raindance\">Rain Dance</span>.",
        search: false
    },
    tm19: {
        num: 346,
        id: "tm19",
        name: "TM19",
        calcName: "TM19",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/gigadrain\">Giga Drain</span>.",
        search: false
    },
    tm20: {
        num: 347,
        id: "tm20",
        name: "TM20",
        calcName: "TM20",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/safeguard\">Safeguard</span>.",
        search: false
    },
    tm21: {
        num: 348,
        id: "tm21",
        name: "TM21",
        calcName: "TM21",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/frustration\">Frustration</span>.",
        search: false
    },
    tm22: {
        num: 349,
        id: "tm22",
        name: "TM22",
        calcName: "TM22",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/solarbeam\">SolarBeam</span>.",
        search: false
    },
    tm23: {
        num: 350,
        id: "tm23",
        name: "TM23",
        calcName: "TM23",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/irontail\">Iron Tail</span>.",
        search: false
    },
    tm24: {
        num: 351,
        id: "tm24",
        name: "TM24",
        calcName: "TM24",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/thunderbolt\">Thunderbolt</span>.",
        search: false
    },
    tm25: {
        num: 352,
        id: "tm25",
        name: "TM25",
        calcName: "TM25",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/thunder\">Thunder</span>.",
        search: false
    },
    tm26: {
        num: 353,
        id: "tm26",
        name: "TM26",
        calcName: "TM26",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/earthquake\">Earthquake</span>.",
        search: false
    },
    tm27: {
        num: 354,
        id: "tm27",
        name: "TM27",
        calcName: "TM27",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/return\">Return</span>.",
        search: false
    },
    tm28: {
        num: 355,
        id: "tm28",
        name: "TM28",
        calcName: "TM28",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/dig\">Dig</span>.",
        search: false
    },
    tm29: {
        num: 356,
        id: "tm29",
        name: "TM29",
        calcName: "TM29",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/psychic\">Psychic</span>.",
        search: false
    },
    tm30: {
        num: 357,
        id: "tm30",
        name: "TM30",
        calcName: "TM30",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/shadowball\">Shadow Ball</span>.",
        search: false
    },
    tm31: {
        num: 358,
        id: "tm31",
        name: "TM31",
        calcName: "TM31",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/brickbreak\">Brick Break</span>.",
        search: false
    },
    tm32: {
        num: 359,
        id: "tm32",
        name: "TM32",
        calcName: "TM32",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/doubleteam\">Double Team</span>.",
        search: false
    },
    tm33: {
        num: 360,
        id: "tm33",
        name: "TM33",
        calcName: "TM33",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/reflect\">Reflect</span>.",
        search: false
    },
    tm34: {
        num: 361,
        id: "tm34",
        name: "TM34",
        calcName: "TM34",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/shockwave\">Shock Wave</span>.",
        search: false
    },
    tm35: {
        num: 362,
        id: "tm35",
        name: "TM35",
        calcName: "TM35",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/flamethrower\">Flamethrower</span>.",
        search: false
    },
    tm36: {
        num: 363,
        id: "tm36",
        name: "TM36",
        calcName: "TM36",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/sludgebomb\">Sludge Bomb</span>.",
        search: false
    },
    tm37: {
        num: 364,
        id: "tm37",
        name: "TM37",
        calcName: "TM37",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/sandstorm\">Sandstorm</span>.",
        search: false
    },
    tm38: {
        num: 365,
        id: "tm38",
        name: "TM38",
        calcName: "TM38",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/fireblast\">Fire Blast</span>.",
        search: false
    },
    tm39: {
        num: 366,
        id: "tm39",
        name: "TM39",
        calcName: "TM39",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/rocktomb\">Rock Tomb</span>.",
        search: false
    },
    tm40: {
        num: 367,
        id: "tm40",
        name: "TM40",
        calcName: "TM40",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/aerialace\">Aerial Ace</span>.",
        search: false
    },
    tm41: {
        num: 368,
        id: "tm41",
        name: "TM41",
        calcName: "TM41",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/torment\">Torment</span>.",
        search: false
    },
    tm42: {
        num: 369,
        id: "tm42",
        name: "TM42",
        calcName: "TM42",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/facade\">Facade</span>.",
        search: false
    },
    tm43: {
        num: 370,
        id: "tm43",
        name: "TM43",
        calcName: "TM43",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/secretpower\">Secret Power</span>.",
        search: false
    },
    tm44: {
        num: 371,
        id: "tm44",
        name: "TM44",
        calcName: "TM44",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/rest\">Rest</span>.",
        search: false
    },
    tm45: {
        num: 372,
        id: "tm45",
        name: "TM45",
        calcName: "TM45",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/attract\">Attract</span>.",
        search: false
    },
    tm46: {
        num: 373,
        id: "tm46",
        name: "TM46",
        calcName: "TM46",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/thief\">Thief</span>.",
        search: false
    },
    tm47: {
        num: 374,
        id: "tm47",
        name: "TM47",
        calcName: "TM47",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/steelwing\">Steel Wing</span>.",
        search: false
    },
    tm48: {
        num: 375,
        id: "tm48",
        name: "TM48",
        calcName: "TM48",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/skillswap\">Skill Swap</span>.",
        search: false
    },
    tm49: {
        num: 376,
        id: "tm49",
        name: "TM49",
        calcName: "TM49",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/\">-</span>.",
        search: false
    },
    tm50: {
        num: 377,
        id: "tm50",
        name: "TM50",
        calcName: "TM50",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/overheat\">Overheat</span>.",
        search: false
    },
    tm51: {
        num: 378,
        id: "tm51",
        name: "TM51",
        calcName: "TM51",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/roost\">Roost</span>.",
        search: false
    },
    tm52: {
        num: 379,
        id: "tm52",
        name: "TM52",
        calcName: "TM52",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/focusblast\">Focus Blast</span>.",
        search: false
    },
    tm53: {
        num: 380,
        id: "tm53",
        name: "TM53",
        calcName: "TM53",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/energyball\">Energy Ball</span>.",
        search: false
    },
    tm54: {
        num: 381,
        id: "tm54",
        name: "TM54",
        calcName: "TM54",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/falseswipe\">False Swipe</span>.",
        search: false
    },
    tm55: {
        num: 382,
        id: "tm55",
        name: "TM55",
        calcName: "TM55",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/brine\">Brine</span>.",
        search: false
    },
    tm56: {
        num: 383,
        id: "tm56",
        name: "TM56",
        calcName: "TM56",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/fling\">Fling</span>.",
        search: false
    },
    tm57: {
        num: 384,
        id: "tm57",
        name: "TM57",
        calcName: "TM57",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/chargebeam\">Charge Beam</span>.",
        search: false
    },
    tm58: {
        num: 385,
        id: "tm58",
        name: "TM58",
        calcName: "TM58",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/endure\">Endure</span>.",
        search: false
    },
    tm59: {
        num: 386,
        id: "tm59",
        name: "TM59",
        calcName: "TM59",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/dragonpulse\">Dragon Pulse</span>.",
        search: false
    },
    tm60: {
        num: 387,
        id: "tm60",
        name: "TM60",
        calcName: "TM60",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/drainpunch\">Drain Punch</span>.",
        search: false
    },
    tm61: {
        num: 388,
        id: "tm61",
        name: "TM61",
        calcName: "TM61",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/willowisp\">Will-O-Wisp</span>.",
        search: false
    },
    tm62: {
        num: 389,
        id: "tm62",
        name: "TM62",
        calcName: "TM62",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/silverwind\">Silver Wind</span>.",
        search: false
    },
    tm63: {
        num: 390,
        id: "tm63",
        name: "TM63",
        calcName: "TM63",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/embargo\">Embargo</span>.",
        search: false
    },
    tm64: {
        num: 391,
        id: "tm64",
        name: "TM64",
        calcName: "TM64",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/explosion\">Explosion</span>.",
        search: false
    },
    tm65: {
        num: 392,
        id: "tm65",
        name: "TM65",
        calcName: "TM65",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/shadowclaw\">Shadow Claw</span>.",
        search: false
    },
    tm66: {
        num: 393,
        id: "tm66",
        name: "TM66",
        calcName: "TM66",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/payback\">Payback</span>.",
        search: false
    },
    tm67: {
        num: 394,
        id: "tm67",
        name: "TM67",
        calcName: "TM67",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/recycle\">Recycle</span>.",
        search: false
    },
    tm68: {
        num: 395,
        id: "tm68",
        name: "TM68",
        calcName: "TM68",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/gigaimpact\">Giga Impact</span>.",
        search: false
    },
    tm69: {
        num: 396,
        id: "tm69",
        name: "TM69",
        calcName: "TM69",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/rockpolish\">Rock Polish</span>.",
        search: false
    },
    tm70: {
        num: 397,
        id: "tm70",
        name: "TM70",
        calcName: "TM70",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/flash\">Flash</span>.",
        search: false
    },
    tm71: {
        num: 398,
        id: "tm71",
        name: "TM71",
        calcName: "TM71",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/stoneedge\">Stone Edge</span>.",
        search: false
    },
    tm72: {
        num: 399,
        id: "tm72",
        name: "TM72",
        calcName: "TM72",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/avalanche\">Avalanche</span>.",
        search: false
    },
    tm73: {
        num: 400,
        id: "tm73",
        name: "TM73",
        calcName: "TM73",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/thunderwave\">Thunder Wave</span>.",
        search: false
    },
    tm74: {
        num: 401,
        id: "tm74",
        name: "TM74",
        calcName: "TM74",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/gyroball\">Gyro Ball</span>.",
        search: false
    },
    tm75: {
        num: 402,
        id: "tm75",
        name: "TM75",
        calcName: "TM75",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/swordsdance\">Swords Dance</span>.",
        search: false
    },
    tm76: {
        num: 403,
        id: "tm76",
        name: "TM76",
        calcName: "TM76",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/stealthrock\">Stealth Rock</span>.",
        search: false
    },
    tm77: {
        num: 404,
        id: "tm77",
        name: "TM77",
        calcName: "TM77",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/psychup\">Psych Up</span>.",
        search: false
    },
    tm78: {
        num: 405,
        id: "tm78",
        name: "TM78",
        calcName: "TM78",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/captivate\">Captivate</span>.",
        search: false
    },
    tm79: {
        num: 406,
        id: "tm79",
        name: "TM79",
        calcName: "TM79",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/darkpulse\">Dark Pulse</span>.",
        search: false
    },
    tm80: {
        num: 407,
        id: "tm80",
        name: "TM80",
        calcName: "TM80",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/rockslide\">Rock Slide</span>.",
        search: false
    },
    tm81: {
        num: 408,
        id: "tm81",
        name: "TM81",
        calcName: "TM81",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/xscissor\">X-Scissor</span>.",
        search: false
    },
    tm82: {
        num: 409,
        id: "tm82",
        name: "TM82",
        calcName: "TM82",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/sleeptalk\">Sleep Talk</span>.",
        search: false
    },
    tm83: {
        num: 410,
        id: "tm83",
        name: "TM83",
        calcName: "TM83",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/naturalgift\">Natural Gift</span>.",
        search: false
    },
    tm84: {
        num: 411,
        id: "tm84",
        name: "TM84",
        calcName: "TM84",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/poisonjab\">Poison Jab</span>.",
        search: false
    },
    tm85: {
        num: 412,
        id: "tm85",
        name: "TM85",
        calcName: "TM85",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/dreameater\">Dream Eater</span>.",
        search: false
    },
    tm86: {
        num: 413,
        id: "tm86",
        name: "TM86",
        calcName: "TM86",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/grassknot\">Grass Knot</span>.",
        search: false
    },
    tm87: {
        num: 414,
        id: "tm87",
        name: "TM87",
        calcName: "TM87",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/swagger\">Swagger</span>.",
        search: false
    },
    tm88: {
        num: 415,
        id: "tm88",
        name: "TM88",
        calcName: "TM88",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/pluck\">Pluck</span>.",
        search: false
    },
    tm89: {
        num: 416,
        id: "tm89",
        name: "TM89",
        calcName: "TM89",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/uturn\">U-turn</span>.",
        search: false
    },
    tm90: {
        num: 417,
        id: "tm90",
        name: "TM90",
        calcName: "TM90",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/substitute\">Substitute</span>.",
        search: false
    },
    tm91: {
        num: 418,
        id: "tm91",
        name: "TM91",
        calcName: "TM91",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/flashcannon\">Flash Cannon</span>.",
        search: false
    },
    tm92: {
        num: 419,
        id: "tm92",
        name: "TM92",
        calcName: "TM92",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/miracleeye\">Miracle Eye</span>.",
        search: false
    },
    hm01: {
        num: 420,
        id: "hm01",
        name: "HM01",
        calcName: "HM01",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/cut\">Cut</span>.",
        search: false
    },
    hm02: {
        num: 421,
        id: "hm02",
        name: "HM02",
        calcName: "HM02",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/fly\">Fly</span>.",
        search: false
    },
    hm03: {
        num: 422,
        id: "hm03",
        name: "HM03",
        calcName: "HM03",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/surf\">Surf</span>.",
        search: false
    },
    hm04: {
        num: 423,
        id: "hm04",
        name: "HM04",
        calcName: "HM04",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/strength\">Strength</span>.",
        search: false
    },
    hm05: {
        num: 424,
        id: "hm05",
        name: "HM05",
        calcName: "HM05",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/defog\">Defog</span>.",
        search: false
    },
    hm06: {
        num: 425,
        id: "hm06",
        name: "HM06",
        calcName: "HM06",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/rocksmash\">Rock Smash</span>.",
        search: false
    },
    hm07: {
        num: 426,
        id: "hm07",
        name: "HM07",
        calcName: "HM07",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/waterfall\">Waterfall</span>.",
        search: false
    },
    hm08: {
        num: 427,
        id: "hm08",
        name: "HM08",
        calcName: "HM08",
        desc: "Can be used to teach a compatible Pokémon the move <span data-target=\"move/rockclimb\">Rock Climb</span>.",
        search: false
    },
    explorerkit: {
        num: 428,
        id: "explorerkit",
        name: "Explorer Kit",
        calcName: "Explorer Kit",
        desc: "This item is unobtainable.",
        search: false
    },
    galacticcard: {
        num: 429,
        id: "galacticcard",
        name: "Galactic Card",
        calcName: "Galactic Card",
        desc: "This item is unobtainable.",
        search: false
    },
    rulebook: {
        num: 430,
        id: "rulebook",
        name: "Rule Book",
        calcName: "Rule Book",
        desc: "This item is unobtainable.",
        search: false
    },
    pokeradar: {
        num: 431,
        id: "pokeradar",
        name: "Poké Radar",
        calcName: "Poké Radar",
        desc: "https://bulbapedia.bulbagarden.net/wiki/Poké_Radar",
        search: false
    },
    pointcard: {
        num: 432,
        id: "pointcard",
        name: "Point Card",
        calcName: "Point Card",
        desc: "Holds the player's BP.",
        search: false
    },
    journal: {
        num: 433,
        id: "journal",
        name: "Journal",
        calcName: "Journal",
        desc: "Keeps a list of the player's activities.",
        search: false
    },
    sealcase: {
        num: 434,
        id: "sealcase",
        name: "Seal Case",
        calcName: "Seal Case",
        desc: "Holds the player's seals.",
        search: false
    },
    fashioncase: {
        num: 435,
        id: "fashioncase",
        name: "Fashion Case",
        calcName: "Fashion Case",
        desc: "Holds the player's accessories.",
        search: false
    },
    sealbag: {
        num: 436,
        id: "sealbag",
        name: "Seal Bag",
        calcName: "Seal Bag",
        desc: "This item is unobtainable.",
        search: false
    },
    palpad: {
        num: 437,
        id: "palpad",
        name: "Pal Pad",
        calcName: "Pal Pad",
        desc: "What exactly are you looking for? Did you really expect me to add a description for an item that, while technically does exist, can't be used?",
        search: false
    },
    workskey: {
        num: 438,
        id: "workskey",
        name: "Works Key",
        calcName: "Works Key",
        desc: "Unlocks the door to <span data-target=\"location/valleywindworks\">Valley Windworks</span>.",
        search: false
    },
    oldcharm: {
        num: 439,
        id: "oldcharm",
        name: "Old Charm",
        calcName: "Old Charm",
        desc: "Story-related item.",
        search: false
    },
    galactickey: {
        num: 440,
        id: "galactickey",
        name: "Galactic Key",
        calcName: "Galactic Key",
        desc: "Unlocks doors in <span data-target=\"location/teamgalactichq\">Team Galactic HQ</span>.",
        search: false
    },
    redchain: {
        num: 441,
        id: "redchain",
        name: "Red Chain",
        calcName: "Red Chain",
        desc: "This item is unobtainable.",
        search: false
    },
    townmap: {
        num: 442,
        id: "townmap",
        name: "Town Map",
        calcName: "Town Map",
        desc: "Opens the map.",
        search: false
    },
    vsseeker: {
        num: 443,
        id: "vsseeker",
        name: "Vs. Seeker",
        calcName: "Vs. Seeker",
        desc: "This item is unobtainable.",
        search: false
    },
    coincase: {
        num: 444,
        id: "coincase",
        name: "Coin Case",
        calcName: "Coin Case",
        desc: "Holds the player's coins.",
        search: false
    },
    oldrod: {
        num: 445,
        id: "oldrod",
        name: "Old Rod",
        calcName: "Old Rod",
        desc: "Allows the player to encounter wild Pokémon by fishing.",
        search: false
    },
    goodrod: {
        num: 446,
        id: "goodrod",
        name: "Good Rod",
        calcName: "Good Rod",
        desc: "Allows the player to encounter wild Pokémon by fishing.",
        search: false
    },
    superrod: {
        num: 447,
        id: "superrod",
        name: "Super Rod",
        calcName: "Super Rod",
        desc: "Allows the player to encounter wild Pokémon by fishing.",
        search: false
    },
    sprayduck: {
        num: 448,
        id: "sprayduck",
        name: "Sprayduck",
        calcName: "Sprayduck",
        desc: "Allows the player to water berries.",
        search: false
    },
    poffincase: {
        num: 449,
        id: "poffincase",
        name: "Poffin Case",
        calcName: "Poffin Case",
        desc: "Holds the player's Poffins.",
        search: false
    },
    bicycle: {
        num: 450,
        id: "bicycle",
        name: "Bicycle",
        calcName: "Bicycle",
        desc: "Allows the player to move faster, jump over ramps, and ride up slopes.",
        search: false
    },
    suitekey: {
        num: 451,
        id: "suitekey",
        name: "Suite Key",
        calcName: "Suite Key",
        desc: "Story-related item.",
        search: false
    },
    oaksletter: {
        num: 452,
        id: "oaksletter",
        name: "Oak's Letter",
        calcName: "Oak's Letter",
        desc: "Event-related item.",
        search: false
    },
    lunarwing: {
        num: 453,
        id: "lunarwing",
        name: "Lunar Wing",
        calcName: "Lunar Wing",
        desc: "Event-related item.",
        search: false
    },
    membercard: {
        num: 454,
        id: "membercard",
        name: "Member Card",
        calcName: "Member Card",
        desc: "Event-related item.",
        search: false
    },
    azureflute: {
        num: 455,
        id: "azureflute",
        name: "Azure Flute",
        calcName: "Azure Flute",
        desc: "Event-related item that big Pikachu does not want you to know about.",
        search: false
    },
    ssticket: {
        num: 456,
        id: "ssticket",
        name: "S.S. Ticket",
        calcName: "S.S. Ticket",
        desc: "Event-related item.",
        search: false
    },
    contestpass: {
        num: 457,
        id: "contestpass",
        name: "Contest Pass",
        calcName: "Contest Pass",
        desc: "This item is unobtainable.",
        search: false
    },
    magmastone: {
        num: 458,
        id: "magmastone",
        name: "Magma Stone",
        calcName: "Magma Stone",
        desc: "This item is unobtainable.",
        search: false
    },
    parcel: {
        num: 459,
        id: "parcel",
        name: "Parcel",
        calcName: "Parcel",
        desc: "This isn't yours, no peeking!",
        search: false
    },
    coupon1: {
        num: 460,
        id: "coupon1",
        name: "Coupon 1",
        calcName: "Coupon 1",
        desc: "VG9t",
        search: false
    },
    coupon2: {
        num: 461,
        id: "coupon2",
        name: "Coupon 2",
        calcName: "Coupon 2",
        desc: "b3Jy",
        search: false
    },
    coupon3: {
        num: 462,
        id: "coupon3",
        name: "Coupon 3",
        calcName: "Coupon 3",
        desc: "b3cu",
        search: false
    },
    storagekey: {
        num: 463,
        id: "storagekey",
        name: "Storage Key",
        calcName: "Storage Key",
        desc: "This item is unobtainable.",
        search: false
    },
    secretpotion: {
        num: 464,
        id: "secretpotion",
        name: "SecretPotion",
        calcName: "SecretPotion",
        desc: "Heals a <span data-target=\"species/psyduck\">Psyduck</span>'s headache, or an <span data-target=\"species/ampharos\">Ampharos</span>'s sickness.",
        search: false
    },
    vsrecorder: {
        num: 465,
        id: "vsrecorder",
        name: "Vs. Recorder",
        calcName: "Vs. Recorder",
        desc: "...",
        search: false
    },
    gracidea: {
        num: 466,
        id: "gracidea",
        name: "Gracidea",
        calcName: "Gracidea",
        desc: "Event-related item.",
        search: false
    },
    secretkey: {
        num: 467,
        id: "secretkey",
        name: "Secret Key",
        calcName: "Secret Key",
        desc: "Unlocks the door to <span data-target=\"species/rotom\">Rotom</span>'s Room.",
        search: false
    },
};

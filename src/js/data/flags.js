const FLAGS_PK = {
    // 1v1 doubles, 1v2 doubles, tag battles
    battleType: {
        double: [
            // Route 206
            {
                enemy1: "Cyclist Axel",
                enemy2: "Cyclist John"
            },
            {
                enemy1: "Cyclist Megan",
                enemy2: "Cyclist Nicole"
            },
            // Route 214
            {
                enemy1: "Psychic Abigail",
                enemy2: "Psychic Mitchell"
            },
            // Valor Lakefront
            {
                enemy1: "Bird Keeper Billie",
                enemy2: "Ruin Maniac Bruno"
            },
            {
                enemy1: "Sailor Gene",
                enemy2: "Poké Kid Jerry"
            },
            {
                enemy1: "Guitarist Kenny",
                enemy2: "Idol Dolly"
            },
            {
                enemy1: "Beauty Britney",
                enemy2: "Dragon Tamer Elton"
            },
            // Route 222
            {
                enemy1: "Guitarist Cole",
                enemy2: "Bird Keeper Nicola"
            },
            {
                enemy1: "Rich Boy Trey",
                enemy2: "Policeman Thomas"
            },
            {
                enemy1: "Sailor Jack",
                enemy2: "Lady Rose"
            },
            {
                enemy1: "Socialite Alec",
                enemy2: "Gentleman Luther"
            },
            // Sunyshore Gym
            {
                enemy1: "Pokéfan Liz",
                enemy2: "Pokéfan RJ"
            },
            {
                enemy1: "Worker Hugh",
                enemy2: "Waiter Reynolds"
            },
            // Galactic Warehouse
            {
                enemy1: "Galactic Portia",
                enemy2: "Galactic Cressida #1"
            },
            {
                enemy1: "Galactic Umbriel #1",
                enemy2: "Galactic Francisco #2"
            },
            {
                enemy1: "Galactic Miranda #2",
                enemy2: "Galactic Ferdinand #1"
            },
            {
                enemy1: "Galactic Margaret",
                enemy2: "Galactic Cupid #2"
            },
            {
                enemy1: "Galactic Setebos #2",
                enemy2: "Galactic Sycorax #2"
            },
            {
                enemy1: "Galactic Ariel #1",
                enemy2: "Galactic Bianca #2"
            },
            {
                enemy1: "Galactic Oberon #1",
                enemy2: "Galactic Puck #2"
            },
            {
                enemy1: "Galactic Hyperion #2",
                enemy2: "Galactic Prometheus #2"
            },
            {
                enemy1: "Galactic Tethys #2",
                enemy2: "Galactic Dione #2"
            },
            {
                enemy1: "Galactic Epimetheus #2",
                enemy2: "Galactic Pandora #2"
            },
            {
                enemy1: "Galactic Enceladus #2",
                enemy2: "Galactic Mimas #2"
            },
            {
                enemy1: "Galactic Daphnis #2",
                enemy2: "Galactic Pan #2"
            },
            {
                enemy1: "Galactic Geirrod",
                enemy2: "Galactic Greip"
            },
            {
                enemy1: "Galactic Iapetus #2",
                enemy2: "Galactic Phoebe #2"
            },
            // Mt. Coronet
            {
                enemy1: "Galactic Ganymede #3",
                enemy2: "Galactic Halimede #2"
            },
            // Coronet Highlands
            {
                enemy1: "Galactic Despina #2",
                enemy2: "Galactic Bianca #3"
            },
            {
                enemy1: "Galactic Cupid #3",
                enemy2: "Galactic Cressida #2"
            },
            {
                enemy1: "Galactic Callisto #3",
                enemy2: "Galactic Hippocamp #2"
            }
        ],
        trueDouble: {
            // Route 204 (North)
            "Twins Liv & Liz": {},
            // Valley Windworks
            "Galactic Pluto #1": {},
            "Galactic Squad Deimos #1": {},
            "Galactic Squad Phobos #1": {},
            "Commander Mars #1": {},
            // Route 209
            "Twins Emma & Lil": {},
            "Young Couple Ty & Sue": {},
            // Route 210
            "Belle & Pa Ava & Matt": {},
            // Route 215
            "Twins Teri & Tia": {},
            "Double Team Nate & Lisa": {},
            // Valor Lakefront
            "Interviewers Molly & Shannon": {},
            "Double Team Stevie & Lindsey": {},
            // Clamberclaw Cliffs
            "Galactic Leda": {},
            "Galactic Themisto": {},
            "Galactic Io #3": {},
            "Commander Jupiter #2": {},
            // Celestic Town
            "Galactic Mercury #3": {},
            // Route 222
            "Belle & Pa Scout & Atticus": {},
            "Interviewers Barbara & Walter": {},
            // Sunyshore Gym
            "Leader Volkner": {},
            // Route 221
            "Sis and Bro Dora & Diego": {},
            "Fisherman Greg": {},
            // Galactic Warehouse
            "Galactic Squad Juliet": {},
            "Galactic Squad Perdita #1": {},
            "Galactic Squad Mab": {},
            "Galactic Squad Belinda": {},
            // Mt. Coronet
            "Galactic Squad Phobos #3": {},
            "Galactic Squad Deimos #3": {},
            // Coronet Highlands
            "Galactic Squad Perdita #2": {},
            "Galactic Squad Amalthia": {},
            // Distortion World
            "Galactic Boss Cyrus #3": {},
            // Pokémon League
            "Sinister Hooded Figure": {}
        },
        tag: [
            // Jubilife City
            {
                enemy1: "Galactic Venus #1",
                enemy2: "Galactic Luna #1",
                partner: "Pokémon Trainer {RIVAL2_NAME} @ Jubilife City [{RIVAL2_STARTER_2}]"
            },
            // Eterna Forest
            {
                enemy1: "Galactic Ophelia",
                enemy2: "Galactic Bianca #1",
                partner: "Pokémon Trainer Cheryl @ Eterna Forest"
            },
            {
                enemy1: "Galactic Setebos #1",
                enemy2: "Galactic Sycorax #1",
                partner: "Pokémon Trainer Cheryl @ Eterna Forest"
            },
            {
                enemy1: "Galactic Prospero #1",
                enemy2: "Galactic Miranda #1",
                partner: "Pokémon Trainer Cheryl @ Eterna Forest"
            },
            {
                enemy1: "Galactic Uranus #1",
                enemy2: "Galactic Francisco #1",
                partner: "Pokémon Trainer Cheryl @ Eterna Forest"
            },
            {
                enemy1: "Galactic Triton #1",
                enemy2: "Galactic Neptune #1",
                partner: "Pokémon Trainer Cheryl @ Eterna Forest"
            },
            {
                enemy1: "Galactic Terra #2",
                enemy2: "Galactic Luna #2",
                partner: "Pokémon Trainer Cheryl @ Eterna Forest"
            },
            // Veilstone City
            {
                enemy1: "Galactic Uranus #2",
                enemy2: "Galactic Cupid #1",
                partner: "Pokémon Trainer {RIVAL2_NAME} @ Veilstone City [{RIVAL2_STARTER_3}]"
            },
            // Iron Island
            {
                enemy1: "Galactic Calypso",
                enemy2: "Galactic Thalassa #1",
                partner: "Pokémon Trainer Riley @ Iron Island"
            },
            {
                enemy1: "Galactic Despina #1",
                enemy2: "Galactic Galatea",
                partner: "Pokémon Trainer Riley @ Iron Island"
            },
            {
                enemy1: "Galactic Hippocamp #1",
                enemy2: "Galactic Psamanthe",
                partner: "Pokémon Trainer Riley @ Iron Island"
            },
            {
                enemy1: "Galactic Sao",
                enemy2: "Galactic Neso #1",
                partner: "Pokémon Trainer Riley @ Iron Island"
            },
            {
                enemy1: "Galactic Halimede #1",
                enemy2: "Galactic Proteus #1",
                partner: "Pokémon Trainer Riley @ Iron Island"
            },
            {
                enemy1: "Galactic Naid",
                enemy2: "Galactic Nereid",
                partner: "Pokémon Trainer Riley @ Iron Island"
            },
            {
                enemy1: "Galactic Larissa #1",
                enemy2: "Galactic Laomedeia #1",
                partner: "Pokémon Trainer Riley @ Iron Island"
            },
            {
                enemy1: "Galactic Triton #2",
                enemy2: "Galactic Neptune #2",
                partner: "Pokémon Trainer Riley @ Iron Island"
            },
            // Lake Valor
            {
                enemy1: "Galactic Pan #1",
                enemy2: "Galactic Daphnis #1",
                partner: "Pokémon Trainer Marley @ Lake Valor"
            },
            {
                enemy1: "Galactic Epimetheus #1",
                enemy2: "Galactic Prometheus #1",
                partner: "Pokémon Trainer Marley @ Lake Valor"
            },
            {
                enemy1: "Galactic Phoebe #1",
                enemy2: "Galactic Iapetus #1",
                partner: "Pokémon Trainer Marley @ Lake Valor"
            },
            {
                enemy1: "Galactic Enceladus #1",
                enemy2: "Galactic Mimas #1",
                partner: "Pokémon Trainer Marley @ Lake Valor"
            },
            {
                enemy1: "Galactic Pandora #1",
                enemy2: "Galactic Dione #1",
                partner: "Pokémon Trainer Marley @ Lake Valor"
            },
            {
                enemy1: "Galactic Atlas #1",
                enemy2: "Galactic Hyperion #1",
                partner: "Pokémon Trainer Marley @ Lake Valor"
            },
            {
                enemy1: "Galactic Tethys #1",
                enemy2: "Galactic Rhea #1",
                partner: "Pokémon Trainer Marley @ Lake Valor"
            },
            {
                enemy1: "Commander Saturn #1",
                enemy2: "Galactic Titan #1",
                partner: "Pokémon Trainer Marley @ Lake Valor"
            },
            // Lake Verity
            {
                enemy1: "Galactic Mercury #4",
                enemy2: "Galactic Venus #4",
                partner: "Pokémon Trainer {RIVAL2_NAME} @ Lake Verity"
            },
            {
                enemy1: "Galactic Luna #4",
                enemy2: "Galactic Pluto #3",
                partner: "Pokémon Trainer {RIVAL2_NAME} @ Lake Verity"
            },
            {
                enemy1: "Galactic Squad Deimos #2",
                enemy2: "Galactic Squad Phobos #2",
                partner: "Pokémon Trainer {RIVAL2_NAME} @ Lake Verity"
            },
            {
                enemy1: "Commander Mars #2",
                enemy2: "Galactic Terra #4",
                partner: "Pokémon Trainer {RIVAL2_NAME} @ Lake Verity"
            },
            // Wayward Cave
            {
                enemy1: "Collector Gerald",
                enemy2: "Clown Bob",
                partner: "Pokémon Trainer Mira @ Wayward Cave"
            },
            {
                enemy1: "Camper Parker",
                enemy2: "Picnicker Tori",
                partner: "Pokémon Trainer Mira @ Wayward Cave"
            },
            {
                enemy1: "Bug Catcher Adalbert",
                enemy2: "Camper Mike",
                partner: "Pokémon Trainer Mira @ Wayward Cave"
            },
            {
                enemy1: "Lass Cassidy",
                enemy2: "Youngster Butch",
                partner: "Pokémon Trainer Mira @ Wayward Cave"
            },
            {
                enemy1: "Hiker Reginald",
                enemy2: "Hiker Lorenzo",
                partner: "Pokémon Trainer Mira @ Wayward Cave"
            },
            {
                enemy1: "Castle Valet Darach",
                enemy2: "Pokémon Trainer Caitlin",
                partner: "Pokémon Trainer Mira @ Wayward Cave"
            },
            // Coronet Highlands
            {
                enemy1: "Galactic Oberon #2",
                enemy2: "Galactic Titania",
                partner: "Pokémon Trainer Cheryl @ Coronet Highlands"
            },
            {
                enemy1: "Galactic Terra #5",
                enemy2: "Galactic Luna #5",
                partner: "Pokémon Trainer Riley @ Coronet Highlands"
            },
            {
                enemy1: "Galactic Neptune #3",
                enemy2: "Galactic Triton #3",
                partner: "Pokémon Trainer Marley @ Coronet Highlands"
            },
            {
                enemy1: "Galactic Mercury #5",
                enemy2: "Galactic Venus #5",
                partner: "Pokémon Trainer Mira @ Spear Pillar"
            },
            {
                enemy1: "Commander Mars #3",
                enemy2: "Commander Jupiter #3",
                partner: "Pokémon Trainer Barry @ Spear Pillar [{RIVAL_STARTER_3}]"
            }
        ]
    },
    // ignore when navigating (optionals, rematches, tag partners, rival battles)
    hidden: [
        // Route 201
        "Pokémon Trainer Barry #1 [Chimchar]",
        "Pokémon Trainer Barry #1 [Piplup]",
        "Pokémon Trainer Barry #1 [Turtwig]",
        // Route 203
        "Pokémon Trainer Barry #2 [Chimchar]",
        "Pokémon Trainer Barry #2 [Piplup]",
        "Pokémon Trainer Barry #2 [Turtwig]",
        // Jubilife City
        "Pokémon Trainer Dawn @ Jubilife City [Prinplup]",
        "Pokémon Trainer Dawn @ Jubilife City [Grotle]",
        "Pokémon Trainer Dawn @ Jubilife City [Monferno]",
        "Pokémon Trainer Lucas @ Jubilife City [Prinplup]",
        "Pokémon Trainer Lucas @ Jubilife City [Grotle]",
        "Pokémon Trainer Lucas @ Jubilife City [Monferno]",
        "Pokémon Trainer {RIVAL2_NAME} @ Jubilife City [{RIVAL2_STARTER_2}]",
        // Eterna Forest
        "Pokémon Trainer Cheryl @ Eterna Forest",
        // Route 206
        "Cyclist James",
        "Cyclist Rachel",
        // Hearthome City
        "Pokémon Trainer Barry #3 [Infernape]",
        "Pokémon Trainer Barry #3 [Empoleon]",
        "Pokémon Trainer Barry #3 [Torterra]",
        // Route 209
        "Jogger Raul",
        // Route 210
        "Jogger Wyatt",
        // Cafe
        "Waitress Kati",
        "Gambler John Keating",
        // Route 215
        "Jogger Scott",
        // Veilstone City
        "Pokémon Trainer Dawn @ Veilstone City [Empoleon]",
        "Pokémon Trainer Dawn @ Veilstone City [Torterra]",
        "Pokémon Trainer Dawn @ Veilstone City [Infernape]",
        "Pokémon Trainer Lucas @ Veilstone City [Empoleon]",
        "Pokémon Trainer Lucas @ Veilstone City [Torterra]",
        "Pokémon Trainer Lucas @ Veilstone City [Infernape]",
        "Pokémon Trainer {RIVAL2_NAME} @ Veilstone City [{RIVAL2_STARTER_3}]",
        // Route 213
        "Tuber Jared",
        "Tuber Chelsea",
        // Pastoria City
        "Pokémon Breeder Frank",
        "Pokémon Trainer Barry #4 [Infernape]",
        "Pokémon Trainer Barry #4 [Empoleon]",
        "Pokémon Trainer Barry #4 [Torterra]",
        // Pokémon Mansion
        "Policeman Danny",
        // Clamberclaw Cliffs
        "Galactic Valetudo #1",
        "Galactic Dia",
        // Fuego Ironworks
        "Worker Dillan",
        "Worker Holden",
        "Worker Conrad",
        // Canalave City
        "Pokémon Trainer Barry #5 [Infernape]",
        "Pokémon Trainer Barry #5 [Empoleon]",
        "Pokémon Trainer Barry #5 [Torterra]",
        // Iron Island
        "Pokémon Trainer Riley @ Iron Island",
        // Lake Valor
        "Pokémon Trainer Marley @ Lake Valor",
        // Lake Verity
        "Pokémon Trainer Dawn @ Lake Verity",
        "Pokémon Trainer Lucas @ Lake Verity",
        "Pokémon Trainer {RIVAL2_NAME} @ Lake Verity",
        // Route 216
        "Ace Trainer Blake",
        "Skier Bradley",
        "Ace Trainer Maria",
        "Skier Andrea",
        // Route 222
        "Tuber Holly",
        // Route 220
        "Swimmer Wang [A]",
        "Swimmer Wang [B]",
        "Swimmer Wang [C]",
        "Swimmer Wang [D]",
        // Wayward Cave
        "Pokémon Trainer Mira @ Wayward Cave",
        // Mt. Coronet
        "Galactic Squad Deimos #3",
        // Coronet Highlands
        "Pokémon Trainer Cheryl @ Coronet Highlands",
        "Galactic Squad Perdita #2",
        "Galactic Laomedeia #2",
        "Pokémon Trainer Riley @ Coronet Highlands",
        "Pokémon Trainer Marley @ Coronet Highlands",
        "Pokémon Trainer Mira @ Spear Pillar",
        "Pokémon Trainer Barry @ Spear Pillar [Infernape]",
        "Pokémon Trainer Barry @ Spear Pillar [Empoleon]",
        "Pokémon Trainer Barry @ Spear Pillar [Torterra]",
        "Pokémon Trainer Barry @ Spear Pillar [{RIVAL_STARTER_3}]",
        // Pokémon League
        "Pokémon Trainer Barry #6 [Infernape]",
        "Pokémon Trainer Barry #6 [Empoleon]",
        "Pokémon Trainer Barry #6 [Torterra]",
        "Sinister Hooded Figure"
    ],
    weather: {
        "": [],
        clear: [],
        sun: [
            // Jubilife City
            "Galactic Venus #1",
            "Galactic Luna #1",
            // Eterna Forest
            "Galactic Mercury #2",
            // Eterna Gym
            "Aroma Lady Jenna",
            // Route 210
            "Pokémon Breeder Johnny",
            // Valor Lakefront
            "Galactic Io #2",
            // Iron Island
            "Galactic Sao",
            "Galactic Neso #1",
            // Lake Valor
            "Galactic Epimetheus #1",
            "Galactic Prometheus #1",
            "Galactic Atlas #1",
            "Galactic Hyperion #1",
            // Lake Verity
            "Galactic Mercury #4",
            "Galactic Venus #4",
            // Route 222
            "Guitarist Cole",
            "Bird Keeper Nicola",
            "Pokéfan June",
            "Rich Boy Trey",
            "Policeman Thomas",
            "Belle & Pa Scout & Atticus",
            "Aroma Lady Carolina",
            "Pokéfan Sheen",
            "Sailor Jack",
            "Lady Rose",
            "Interviewers Barbara & Walter",
            "Socialite Alec",
            "Gentleman Luther",
            "Tuber Holly",
            // Galactic Warehouse
            "Galactic Margaret",
            "Galactic Cupid #2",
            "Galactic Prospero #2",
            "Galactic Loge",
            "Galactic Hyperion #2",
            "Galactic Prometheus #2",
            "Galactic Atlas #2",
            "Galactic Io #4",
            // Spear Pillar
            "Galactic Mercury #5",
            "Galactic Venus #5",
            // Pokémon League
            "Elite Four Flint"
        ],
        rain: [
            // Eterna Forest
            "Galactic Triton #1",
            "Galactic Neptune #1",
            // Eterna Gym
            "Lass Caroline",
            // "Aroma Lady Jenna", (Her lead sets up Drought)
            "Artist Angel",
            "Leader Gardenia",
            // Route 215
            "Ruin Maniac Calvin",
            "Cyclist Cecelia",
            "Twins Teri & Tia",
            "Rancher Gregory",
            "Black Belt Derek",
            "Jogger Scott",
            "Beauty Jasmine #1",
            "Double Team Nate & Lisa",
            // Route 213
            "Tuber Jared",
            "Tuber Chelsea",
            "Swimmer Mary",
            "Swimmer Sheltin",
            "Swimmer Haley",
            "Fisherman Kenneth",
            "Sailor Paul",
            "Beauty Chelle",
            // Pastoria Gym
            "Roughneck Walter",
            "Fisherman Josh",
            "Tuber Jacky",
            "Parasol Lady Monet",
            "Tuber Caitlyn",
            "Pokémon Ranger Erick",
            "Pokémon Ranger Sam",
            "Leader Wake",
            // Iron Island
            "Galactic Calypso",
            "Galactic Thalassa #1",
            "Galactic Naid",
            "Galactic Nereid",
            "Galactic Triton #2",
            "Galactic Neptune #2",
            // Canalave Gym
            "Sailor Cesar",
            // Lake Valor
            "Galactic Pan #1",
            "Galactic Daphnis #1",
            "Galactic Phoebe #1",
            "Galactic Iapetus #1",
            "Galactic Pandora #1",
            "Galactic Dione #1",
            "Galactic Tethys #1",
            "Galactic Rhea #1",
            "Commander Saturn #1",
            "Galactic Titan #1",
            // Sunyshore Gym
            "Leader Volkner",
            // Route 212
            "Pokémon Ranger Jeffrey",
            "Pokémon Ranger Allison",
            "Pokémon Ranger Taylor",
            // Route 220
            "Swimmer Wang [A]",
            "Swimmer Wang [B]",
            "Swimmer Wang [C]",
            "Swimmer Wang [D]",
            // Route 221
            "Sis and Bro Dora & Diego",
            "Fisherman Greg",
            "Swimmer Ledecky",
            // Galactic Warehouse
            "Galactic Portia",
            "Galactic Cressida #1",
            "Galactic Setebos #2",
            "Galactic Sycorax #2",
            "Galactic Ariel #1",
            "Galactic Bianca #2",
            "Galactic Squad Belinda",
            "Galactic Bebhionn",
            "Galactic Erripaus",
            "Galactic Tethys #2",
            "Galactic Dione #2",
            "Galactic Geirrod",
            "Galactic Greip",
            "Galactic Rhea #2",
            // Coronet Highlands
            "Galactic Neptune #3",
            "Galactic Triton #3",
            // Route 223
            "Swimmer Miranda",
            "Swimmer Aubree",
            "Swimmer Paige",
            "Swimmer Wesley",
            "Sailor Zachariah",
            "Swimmer Francisco",
            // Victory Road
            "Clown Julia",
            // Pokémon League
            "Elite Four Aaron"
        ],
        sand: [
            // Oreburgh Gym
            "Scientist Jonathon",
            "Ruin Maniac Darius",
            "Leader Roark",
            // Valley Windworks
            "Commander Mars #1",
            // Team Galactic Eterna Building
            "Galactic Callisto #1",
            // Iron Island
            "Galactic Hippocamp #1",
            "Galactic Psamanthe",
            "Galactic Larissa #1",
            "Galactic Laomedeia #1",
            // Canalave Gym
            "Idol Skylar",
            // Lake Verity
            "Galactic Squad Deimos #2",
            "Galactic Squad Phobos #2",
            "Commander Mars #2",
            "Galactic Terra #4",
            // Galactic Warehouse
            "Galactic Miranda #2",
            "Galactic Ferdinand #1",
            "Scientist Stephano",
            "Galactic Kari",
            // Mt. Coronet
            "Galactic Squad Phobos #3",
            // Coronet Highlands
            "Galactic Callisto #3",
            "Galactic Hippocamp #2",
            // Victory Road
            "Ruin Maniac Greg",
            // Pokémon League
            "Elite Four Bertha"
        ],
        hail: [
            // Eterna Forest
            "Galactic Uranus #1",
            "Galactic Francisco #1",
            // Team Galactic Eterna Building
            "Galactic Europa #1",
            // Veilstone City
            "Galactic Uranus #2",
            "Galactic Cupid #1",
            // Lake Valor
            "Galactic Enceladus #1",
            "Galactic Mimas #1",
            // Lake Verity
            "Galactic Luna #4",
            "Galactic Pluto #3",
            // Route 216
            "Skier Edward",
            "Skier Kaitlyn",
            "Black Belt Philip",
            "Guitarist Garrett",
            "Ace Trainer Laura",
            "Ace Trainer Blake",
            "Skier Bradley",
            "Ace Trainer Maria",
            "Skier Andrea",
            // Route 217
            "Ace Trainer Olivia",
            "Ninja Boy Ethan",
            "Skier Madison",
            "Black Belt Luke",
            "Ace Trainer Dalton",
            "Ninja Boy Matthew",
            "Skier Bjorn",
            "Skier Shawn",
            // Snowpoint Gym
            "Veteran Anton",
            "Ace Trainer Tenzing",
            "Skier Mirabelle",
            "Skier Isaiah",
            "Skier Savannah",
            "Ace Trainer Alicia",
            "Leader Candice",
            // Galactic Warehouse
            "Galactic Squad Perdita #1",
            "Galactic Oberon #1",
            "Galactic Puck #2",
            "Galactic Enceladus #2",
            "Galactic Mimas #2",
            "Galactic Uranus #3",
            // Coronet Highlands
            "Galactic Despina #2",
            "Galactic Bianca #3",
            "Galactic Ferdinand #2",
            "Galactic Rosalind",
            "Galactic Squad Perdita #2",
            "Galactic Valetudo #2",
            "Galactic Cupid #3",
            "Galactic Cressida #2",
            "Galactic Cordelia",
            "Galactic Oberon #2",
            "Galactic Titania",
            "Galactic Europa #3",
            "Galactic Pluto #4",
            "Galactic Prospero #3",
            "Galactic Squad Amalthia",
            "Galactic Miranda #3",
            "Galactic Angrboda",
            "Galactic Ariel #2",
            "Galactic Umbriel #2"
        ],
        fog: [
            // Hearthome Gym
            "Ninja Boy Donny #1",
            "Policeman Morton",
            "Psychic Tony",
            "Ninja Boy Drew",
            "Clown Justin",
            "Psychic Helen",
            "Policeman Kevin",
            "Psychic Theodore",
            "Idol Catherine #2",
            "Ninja Boy Donny #2",
            "Psychic Cheyenne",
            // Clamberclaw Cliffs
            "Galactic Luna #3",
            "Galactic Valetudo #1",
            "Galactic Terra #3",
            "Galactic Venus #3",
            "Galactic Leda",
            "Galactic Amalthia #2",
            "Galactic Metis",
            "Galactic Themisto",
            "Galactic Dia",
            "Galactic Thebe",
            "Galactic Himalia",
            "Galactic Callisto #2",
            "Galactic Europa #2",
            "Galactic Pluto #2",
            "Galactic Ganymede #2",
            "Galactic Io #3",
            "Commander Jupiter #2",
            // Celestic Town
            "Galactic Boss Cyrus #1",
            // Coronet Highlands
            "Galactic Proteus #2",
            "Galactic Laomedeia #2",
            "Galactic Larissa #2",
            "Galactic Terra #5",
            "Galactic Luna #5"
        ]
    }
};

function getTagBattle(trainerName) {
    for (var i in Object.values(FLAGS_PK.battleType.tag)) {
        var battle = Object.values(FLAGS_PK.battleType.tag)[i];
        if (battle.enemy1 == trainerName || battle.enemy2 == trainerName) return battle;
    }
    return undefined;
}

function getDoubleBattle(trainerName) {
    for (var i in Object.values(FLAGS_PK.battleType.double)) {
        var battle = Object.values(FLAGS_PK.battleType.double)[i];
        if (battle.enemy1 == trainerName || battle.enemy2 == trainerName) return battle;
    }
    return undefined;
}

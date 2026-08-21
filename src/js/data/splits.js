/*
 * Which trainers belong to which split - the stretch of the game between one
 * gym leader and the next. Read by the planner's quick-setup buttons.
 *
 * Hand-maintained: this is a judgement about how the run is divided, not
 * something derivable from the game's data, so it lives here as the source of
 * truth rather than behind a generator. Edit it directly.
 *
 * First filled in from the community's Platinum Kaizo reference sheet, with
 * thanks - https://docs.google.com/spreadsheets/d/1y95UYKY9HNgZjUlbeZbQ3BWf5IqcFqAkmstC-OSa6vc/
 * - and corrected by hand from there.
 *
 * Every name must match a trainer in sets.js exactly: that is the key the
 * planner looks a fight up by. Order within a split is the order the lines are
 * created in, so keep it the order you fight them.
 *
 * `unassigned` is ignored by the planner and only counted, as a reminder that
 * the list isn't finished. What is left in it are trainers the sheet doesn't
 * place: rematches, the tag partners, and a few that may simply be unused.
 */
const SPLITS_PK = {
    "Roark": [
        "Youngster Tristan",                                 // Lv   5, 3 mon
        "Lass Natalie",                                      // Lv   6, 3 mon
        "Bug Catcher Logan",                                 // Lv   7, 4 mon
        "Clown Moe",                                         // Lv  10, 3 mon
        "Clown Mickey",                                      // Lv   8, 3 mon
        "Clown Ronald",                                      // Lv   8, 3 mon
        "Lass Samantha",                                     // Lv   7, 3 mon
        "Youngster Tyler",                                   // Lv  10, 3 mon
        "Lass Sarah",                                        // Lv   8, 3 mon
        "Pokémon Trainer Barry #2 [Chimchar]",               // Lv  10, 6 mon
        "Pokémon Trainer Barry #2 [Piplup]",                 // Lv  10, 6 mon
        "Pokémon Trainer Barry #2 [Turtwig]",                // Lv  10, 6 mon
        "Youngster Dallas",                                  // Lv  10, 4 mon
        "Youngster Michael",                                 // Lv  10, 4 mon
        "Bug Catcher Sebastian",                             // Lv  12, 5 mon
        "Lass Kaitlin",                                      // Lv  10, 4 mon
        "Lass Madeline",                                     // Lv  10, 4 mon
        "Camper Curtis",                                     // Lv  10, 5 mon
        "Picnicker Diana",                                   // Lv  10, 5 mon
        "Worker Mason",                                      // Lv  12, 4 mon
        "Worker Colin",                                      // Lv  11, 4 mon
        "Scientist Jonathon",                                // Lv  15, 5 mon
        "Ruin Maniac Darius",                                // Lv  12, 5 mon
        "Leader Roark",                                      // Lv  16, 6 mon
    ],
    "Gardenia": [
        "Galactic Venus #1",                                 // Lv  16, 4 mon
        "Galactic Luna #1",                                  // Lv  16, 4 mon
        "Twins Liv & Liz",                                   // Lv  19, 4 mon
        "Bug Catcher Brandon",                               // Lv  19, 5 mon
        "Aroma Lady Taylor",                                 // Lv  19, 5 mon
        "Galactic Mercury #1",                               // Lv  18, 4 mon
        "Galactic Terra #1",                                 // Lv  18, 4 mon
        "Galactic Pluto #1",                                 // Lv  20, 5 mon
        "Galactic Squad Deimos #1",                          // Lv  19, 5 mon
        "Galactic Squad Phobos #1",                          // Lv  19, 5 mon
        "Commander Mars #1",                                 // Lv  22, 6 mon
        "Camper Jacob",                                      // Lv  22, 4 mon
        "Hiker Daniel",                                      // Lv  21, 4 mon
        "Aroma Lady Elizabeth",                              // Lv  24, 4 mon
        "Picnicker Siena",                                   // Lv  23, 4 mon
        "Camper Zackary",                                    // Lv  23, 4 mon
        "Hiker Nicholas",                                    // Lv  22, 4 mon
        "Picnicker Karina",                                  // Lv  23, 4 mon
        "Battle Girl Kelsey",                                // Lv  23, 4 mon
        "Galactic Ophelia",                                  // Lv  22, 3 mon
        "Galactic Bianca #1",                                // Lv  22, 3 mon
        "Galactic Setebos #1",                               // Lv  23, 3 mon
        "Galactic Sycorax #1",                               // Lv  22, 3 mon
        "Galactic Prospero #1",                              // Lv  22, 3 mon
        "Galactic Miranda #1",                               // Lv  22, 3 mon
        "Galactic Puck #1",                                  // Lv  24, 4 mon
        "Galactic Trinculo #1",                              // Lv  23, 4 mon
        "Galactic Mercury #2",                               // Lv  22, 5 mon
        "Galactic Venus #2",                                 // Lv  21, 5 mon
        "Galactic Uranus #1",                                // Lv  23, 3 mon
        "Galactic Francisco #1",                             // Lv  24, 3 mon
        "Galactic Triton #1",                                // Lv  23, 3 mon
        "Galactic Neptune #1",                               // Lv  24, 3 mon
        "Galactic Terra #2",                                 // Lv  24, 4 mon
        "Galactic Luna #2",                                  // Lv  24, 4 mon
        "Fisherman Joseph",                                  // Lv  23, 5 mon
        "Fisherman Andrew",                                  // Lv  24, 5 mon
        "Fisherman Zachary",                                 // Lv  24, 5 mon
        "Lass Caroline",                                     // Lv  24, 5 mon
        "Aroma Lady Jenna",                                  // Lv  23, 5 mon
        "Artist Angel",                                      // Lv  25, 5 mon
        "Leader Gardenia",                                   // Lv  28, 6 mon
    ],
    "Fantina": [
        "Galactic Amalthia #1",                              // Lv  31, 5 mon
        "Scientist Galileo",                                 // Lv  31, 5 mon
        "Galactic Callisto #1",                              // Lv  31, 5 mon
        "Galactic Europa #1",                                // Lv  31, 5 mon
        "Galactic Ganymede #1",                              // Lv  31, 5 mon
        "Galactic Io #1",                                    // Lv  32, 5 mon
        "Commander Jupiter #1",                              // Lv  34, 6 mon
        "Cyclist Axel",                                      // Lv  31, 2 mon
        "Cyclist John",                                      // Lv  31, 2 mon
        "Cyclist Megan",                                     // Lv  31, 2 mon
        "Cyclist Nicole",                                    // Lv  32, 2 mon
        "Cyclist James",                                     // Lv  32, 5 mon
        "Cyclist Rachel",                                    // Lv  32, 5 mon
        "Cyclist Ryan",                                      // Lv  33, 5 mon
        "Cyclist Karen",                                     // Lv  33, 5 mon
        "Roughneck Robert",                                  // Lv  34, 4 mon
        "Pokéfan Stewart",                                   // Lv  42, 4 mon
        "Pokéfan Martha",                                    // Lv  36, 4 mon
        "Black Belt Kyle",                                   // Lv  33, 4 mon
        "Aroma Lady Hannah",                                 // Lv  35, 5 mon
        "Hiker Alexander",                                   // Lv  34, 5 mon
        "Hiker Jonathan",                                    // Lv  35, 5 mon
        "Dragon Tamer Drax",                                 // Lv  35, 5 mon
        "Artist William",                                    // Lv  35, 5 mon
        "Ninja Boy Donny #1",                                // Lv  35, 6 mon
        "Policeman Morton",                                  // Lv  31, 5 mon
        "Psychic Tony",                                      // Lv  32, 5 mon
        "Idol Catherine #1",                                 // Lv  34, 6 mon
        "Clown Chance",                                      // Lv  33, 4 mon
        "Artist Allen",                                      // Lv  34, 5 mon
        "Idol Amber",                                        // Lv  33, 4 mon
        "Leader Fantina?",                                   // Lv  34, 6 mon
        "Clown Justin",                                      // Lv  33, 4 mon
        "Policeman Kevin",                                   // Lv  35, 4 mon
        "Psychic Helen",                                     // Lv  33, 4 mon
        "Psychic Theodore",                                  // Lv  34, 4 mon
        "Ninja Boy Drew",                                    // Lv  34, 4 mon
        "Idol Catherine #2",                                 // Lv  34, 4 mon
        "Clown Luigi",                                       // Lv  35, 6 mon
        "Ninja Boy Donny #2",                                // Lv  35, 6 mon
        "Psychic Cheyenne",                                  // Lv  32, 5 mon
        "Leader Fantina",                                    // Lv  38, 6 mon
    ],
    "Maylene": [
        "Pokémon Trainer Barry #3 [Empoleon]",               // Lv  40, 6 mon
        "Pokémon Trainer Barry #3 [Infernape]",              // Lv  40, 6 mon
        "Pokémon Trainer Barry #3 [Torterra]",               // Lv  40, 6 mon
        "Pokémon Breeder Albert",                            // Lv  38, 4 mon
        "Jogger Richard",                                    // Lv  39, 3 mon
        "Twins Emma & Lil",                                  // Lv  42, 5 mon
        "Poké Kid Danielle",                                 // Lv  44, 5 mon
        "Pokémon Breeder Jennifer",                          // Lv  39, 4 mon
        "Jogger Raul",                                       // Lv  89, 1 mon
        "Cowgirl Shelley",                                   // Lv  40, 4 mon
        "Young Couple Ty & Sue",                             // Lv  40, 6 mon
        "Rancher Marco",                                     // Lv  41, 4 mon
        "Jogger Wyatt",                                      // Lv  76, 2 mon
        "Belle & Pa Ava & Matt",                             // Lv  45, 5 mon
        "Pokémon Breeder Johnny",                            // Lv  55, 6 mon
        "Waitress Kati",                                     // Lv  90, 2 mon
        "Gambler John Keating",                              // Lv 100, 6 mon
        "Ruin Maniac Calvin",                                // Lv  40, 5 mon
        "Cyclist Cecelia",                                   // Lv  41, 4 mon
        "Twins Teri & Tia",                                  // Lv  40, 6 mon
        "Rancher Gregory",                                   // Lv  42, 4 mon
        "Black Belt Derek",                                  // Lv  41, 5 mon
        "Jogger Scott",                                      // Lv  66, 3 mon
        "Beauty Jasmine #1",                                 // Lv  52, 6 mon
        "Double Team Nate & Lisa",                           // Lv  41, 6 mon
        "Galactic Uranus #2",                                // Lv  41, 6 mon
        "Galactic Cupid #1",                                 // Lv  40, 5 mon
        "Battle Girl Carly",                                 // Lv  41, 5 mon
        "Black Belt Daniel",                                 // Lv  43, 5 mon
        "Roughneck Rafael",                                  // Lv  43, 5 mon
        "Battle Girl Jedrzejczyk",                           // Lv  45, 5 mon
        "Bird Keeper Kahlil",                                // Lv  44, 5 mon
        "Roughneck Magnus",                                  // Lv  45, 5 mon
        "Leader Maylene",                                    // Lv  47, 6 mon
    ],
    "Wake": [
        "Psychic Abigail",                                   // Lv  46, 3 mon
        "Psychic Mitchell",                                  // Lv  46, 3 mon
        "Gambler Carlos",                                    // Lv  46, 5 mon
        "Ruin Maniac Bryan",                                 // Lv  45, 4 mon
        "Collector Ripper",                                  // Lv  49, 6 mon
        "Beauty Cyndy",                                      // Lv  50, 4 mon
        "Ruin Maniac Jones",                                 // Lv  46, 4 mon
        "Collector Brady",                                   // Lv  46, 6 mon
        "Interviewers Molly & Shannon",                      // Lv  51, 4 mon
        "Bird Keeper Billie",                                // Lv  51, 2 mon
        "Ruin Maniac Bruno",                                 // Lv  49, 2 mon
        "Sailor Gene",                                       // Lv  50, 2 mon
        "Poké Kid Jerry",                                    // Lv  51, 2 mon
        "Guitarist Kenny",                                   // Lv  49, 2 mon
        "Idol Dolly",                                        // Lv  50, 2 mon
        "Beauty Britney",                                    // Lv  50, 2 mon
        "Dragon Tamer Elton",                                // Lv  53, 2 mon
        "Double Team Stevie & Lindsey",                      // Lv  53, 6 mon
        "Tuber Jared",                                       // Lv 100, 2 mon
        "Tuber Chelsea",                                     // Lv 100, 2 mon
        "Swimmer Mary",                                      // Lv  47, 3 mon
        "Swimmer Sheltin",                                   // Lv  48, 3 mon
        "Swimmer Haley",                                     // Lv  48, 3 mon
        "Fisherman Kenneth",                                 // Lv  50, 4 mon
        "Sailor Paul",                                       // Lv  48, 4 mon
        "Beauty Chelle",                                     // Lv  58, 6 mon
        "Pokémon Breeder Frank",                             // Lv  96, 6 mon
        "Pokémon Trainer Barry #4 [Empoleon]",               // Lv  50, 6 mon
        "Pokémon Trainer Barry #4 [Infernape]",              // Lv  50, 6 mon
        "Pokémon Trainer Barry #4 [Torterra]",               // Lv  50, 6 mon
        "Roughneck Walter",                                  // Lv  49, 6 mon
        "Fisherman Josh",                                    // Lv  47, 6 mon
        "Tuber Jacky",                                       // Lv  47, 6 mon
        "Parasol Lady Monet",                                // Lv  50, 6 mon
        "Tuber Caitlyn",                                     // Lv  52, 6 mon
        "Pokémon Ranger Erick",                              // Lv  49, 6 mon
        "Pokémon Ranger Sam",                                // Lv  50, 6 mon
        "Leader Wake",                                       // Lv  54, 6 mon
    ],
    "Byron": [
        "Galactic Io #2",                                    // Lv  52, 6 mon
        "Policeman Bobby",                                   // Lv  57, 1 mon
        "Lady Melissa",                                      // Lv  56, 1 mon
        "Rich Boy Jason",                                    // Lv  55, 1 mon
        "Socialite Reina",                                   // Lv  54, 1 mon
        "Gentleman Jeremy",                                  // Lv  52, 1 mon
        "Artist Alexander",                                  // Lv  60, 1 mon
        "Gambler Nicky",                                     // Lv  54, 1 mon
        "Beauty Elle",                                       // Lv  54, 1 mon
        "Lady Celeste",                                      // Lv  60, 1 mon
        "Socialite Scarlet",                                 // Lv  55, 1 mon
        "Policeman Caleb",                                   // Lv  53, 1 mon
        "Rich Boy Liam",                                     // Lv  56, 1 mon
        "Waiter Affogato",                                   // Lv  55, 1 mon
        "Waiter Doppio",                                     // Lv  57, 1 mon
        "Maid Latte",                                        // Lv  55, 1 mon
        "Maid Mocha",                                        // Lv  62, 1 mon
        "Gentleman Butler",                                  // Lv  58, 1 mon
        "Policeman Danny",                                   // Lv 100, 6 mon
        "Pokémon Ranger Allison",                            // Lv 100, 1 mon
        "Pokémon Ranger Jeffrey",                            // Lv 100, 1 mon
        "Pokémon Ranger Taylor",                             // Lv 100, 1 mon
        "Galactic Luna #3",                                  // Lv  51, 6 mon
        "Galactic Valetudo #1",                              // Lv  52, 6 mon
        "Galactic Terra #3",                                 // Lv  54, 6 mon
        "Galactic Venus #3",                                 // Lv  53, 6 mon
        "Galactic Leda",                                     // Lv  53, 6 mon
        "Galactic Amalthia #2",                              // Lv  54, 6 mon
        "Galactic Metis",                                    // Lv  54, 6 mon
        "Galactic Squad Themisto",                           // Lv  55, 6 mon
        "Galactic Dia",                                      // Lv  55, 6 mon
        "Galactic Thebe",                                    // Lv  54, 6 mon
        "Galactic Squad Himalia",                            // Lv  54, 6 mon
        "Galactic Callisto #2",                              // Lv  54, 6 mon
        "Galactic Europa #2",                                // Lv  54, 6 mon
        "Galactic Pluto #2",                                 // Lv  53, 6 mon
        "Galactic Ganymede #2",                              // Lv  55, 6 mon
        "Galactic Io #3",                                    // Lv  56, 6 mon
        "Commander Jupiter #2",                              // Lv  56, 6 mon
        "Galactic Mercury #3",                               // Lv  55, 5 mon
        "Galactic Boss Cyrus #1",                            // Lv  57, 6 mon
        "Veteran Grant",                                     // Lv  99, 5 mon
        "Worker Dillan",                                     // Lv  98, 5 mon
        "Worker Holden",                                     // Lv  90, 5 mon
        "Worker Conrad",                                     // Lv  96, 5 mon
        "Pokémon Trainer Barry #5 [Empoleon]",               // Lv  57, 6 mon
        "Pokémon Trainer Barry #5 [Infernape]",              // Lv  57, 6 mon
        "Pokémon Trainer Barry #5 [Torterra]",               // Lv  57, 6 mon
        "Galactic Calypso",                                  // Lv  55, 4 mon
        "Galactic Thalassa #1",                              // Lv  55, 4 mon
        "Galactic Despina #1",                               // Lv  56, 4 mon
        "Galactic Galatea",                                  // Lv  55, 4 mon
        "Galactic Hippocamp #1",                             // Lv  56, 4 mon
        "Galactic Psamanthe",                                // Lv  57, 4 mon
        "Galactic Sao",                                      // Lv  57, 4 mon
        "Galactic Neso #1",                                  // Lv  56, 4 mon
        "Galactic Halimede #1",                              // Lv  55, 4 mon
        "Galactic Proteus #1",                               // Lv  56, 4 mon
        "Galactic Naid",                                     // Lv  56, 4 mon
        "Galactic Nereid",                                   // Lv  56, 4 mon
        "Galactic Larissa #1",                               // Lv  56, 4 mon
        "Galactic Laomedeia #1",                             // Lv  56, 4 mon
        "Galactic Triton #2",                                // Lv  57, 4 mon
        "Galactic Neptune #2",                               // Lv  60, 4 mon
        "Sailor Cesar",                                      // Lv  62, 5 mon
        "Scientist Bill",                                    // Lv  61, 5 mon
        "Idol Skylar",                                       // Lv  62, 6 mon
        "Hiker David",                                       // Lv  62, 5 mon
        "Leader Byron",                                      // Lv  65, 6 mon
    ],
    "Candice": [
        "Galactic Pan #1",                                   // Lv  65, 4 mon
        "Galactic Daphnis #1",                               // Lv  63, 4 mon
        "Galactic Epimetheus #1",                            // Lv  70, 4 mon
        "Galactic Prometheus #1",                            // Lv  64, 4 mon
        "Galactic Phoebe #1",                                // Lv  66, 3 mon
        "Galactic Iapetus #1",                               // Lv  63, 5 mon
        "Galactic Enceladus #1",                             // Lv  66, 3 mon
        "Galactic Mimas #1",                                 // Lv  66, 4 mon
        "Galactic Pandora #1",                               // Lv  66, 3 mon
        "Galactic Dione #1",                                 // Lv  67, 3 mon
        "Galactic Atlas #1",                                 // Lv  66, 3 mon
        "Galactic Hyperion #1",                              // Lv  72, 3 mon
        "Galactic Tethys #1",                                // Lv  67, 4 mon
        "Galactic Rhea #1",                                  // Lv  67, 4 mon
        "Commander Saturn #1",                               // Lv  67, 5 mon
        "Galactic Titan #1",                                 // Lv  65, 4 mon
        "Galactic Mercury #4",                               // Lv  65, 4 mon
        "Galactic Venus #4",                                 // Lv  65, 4 mon
        "Galactic Luna #4",                                  // Lv  65, 4 mon
        "Galactic Pluto #3",                                 // Lv  65, 4 mon
        "Galactic Squad Deimos #2",                          // Lv  69, 6 mon
        "Galactic Squad Phobos #2",                          // Lv  60, 6 mon
        "Commander Mars #2",                                 // Lv  67, 6 mon
        "Galactic Terra #4",                                 // Lv  67, 4 mon
        "Skier Edward",                                      // Lv  72, 4 mon
        "Skier Kaitlyn",                                     // Lv  75, 4 mon
        "Black Belt Philip",                                 // Lv  74, 4 mon
        "Guitarist Garrett",                                 // Lv  72, 4 mon
        "Ace Trainer Laura",                                 // Lv  71, 5 mon
        "Ace Trainer Blake",                                 // Lv  95, 4 mon
        "Skier Bradley",                                     // Lv  99, 3 mon
        "Ace Trainer Maria",                                 // Lv  94, 4 mon
        "Skier Andrea",                                      // Lv  98, 4 mon
        "Ace Trainer Olivia",                                // Lv  71, 6 mon
        "Ninja Boy Ethan",                                   // Lv  72, 6 mon
        "Skier Madison",                                     // Lv  68, 6 mon
        "Black Belt Luke",                                   // Lv  72, 6 mon
        "Ace Trainer Dalton",                                // Lv  68, 6 mon
        "Ninja Boy Matthew",                                 // Lv  87, 6 mon
        "Skier Bjorn",                                       // Lv  84, 1 mon
        "Skier Shawn",                                       // Lv  74, 6 mon
        "Veteran Anton",                                     // Lv  72, 5 mon
        "Ace Trainer Tenzing",                               // Lv  73, 5 mon
        "Skier Mirabelle",                                   // Lv  69, 5 mon
        "Skier Anas",                                        // Lv  72, 5 mon
        "Skier Savannah",                                    // Lv  73, 5 mon
        "Ace Trainer Alicia",                                // Lv  73, 5 mon
        "Leader Candice",                                    // Lv  74, 6 mon
    ],
    "Volkner": [
        "Guitarist Cole",                                    // Lv  75, 3 mon
        "Bird Keeper Nicola",                                // Lv  76, 3 mon
        "Pokéfan June",                                      // Lv  75, 5 mon
        "Rich Boy Trey",                                     // Lv  73, 3 mon
        "Policeman Thomas",                                  // Lv  75, 3 mon
        "Belle & Pa Scout & Atticus",                        // Lv  76, 5 mon
        "Aroma Lady Carolina",                               // Lv  77, 4 mon
        "Pokéfan Sheen",                                     // Lv  80, 4 mon
        "Sailor Jack",                                       // Lv  76, 3 mon
        "Lady Rose",                                         // Lv  77, 3 mon
        "Interviewers Barbara & Walter",                     // Lv  84, 5 mon
        "Socialite Alec",                                    // Lv  77, 3 mon
        "Gentleman Luther",                                  // Lv  77, 3 mon
        "Tuber Holly",                                       // Lv 100, 4 mon
        "Pokéfan Liz",                                       // Lv  80, 3 mon
        "Pokéfan RJ",                                        // Lv  80, 3 mon
        "Clown Forrest",                                     // Lv  80, 5 mon
        "Poké Kid Maggie",                                   // Lv  83, 5 mon
        "Cowgirl Meghan",                                    // Lv  80, 6 mon
        "Worker Hugh",                                       // Lv  82, 3 mon
        "Waiter Reynolds",                                   // Lv  81, 3 mon
        "Psychic Destiny",                                   // Lv  80, 6 mon
        "Gambler Ace",                                       // Lv  80, 5 mon
        "Guitarist Preston",                                 // Lv  82, 6 mon
        "Leader Volkner",                                    // Lv  84, 6 mon
    ],
    "Galactic": [
        "Pokémon Ranger Allison",                            // Lv 100, 1 mon
        "Pokémon Ranger Jeffrey",                            // Lv 100, 1 mon
        "Pokémon Ranger Taylor",                             // Lv 100, 1 mon
        "Swimmer Wang [A]",                                  // Lv  94, 4 mon
        "Swimmer Wang [B]",                                  // Lv  94, 4 mon
        "Swimmer Wang [C]",                                  // Lv  96, 4 mon
        "Swimmer Wang [D]",                                  // Lv  94, 4 mon
        "Sis and Bro Dora & Diego",                          // Lv  99, 5 mon
        "Fisherman Greg",                                    // Lv  97, 6 mon
        "Collector Gerald",                                  // Lv  85, 3 mon
        "Clown Bob",                                         // Lv  86, 3 mon
        "Camper Parker",                                     // Lv  93, 2 mon
        "Picnicker Tori",                                    // Lv  91, 2 mon
        "Bug Catcher Adalbert",                              // Lv  97, 2 mon
        "Camper Mike",                                       // Lv  95, 2 mon
        "Lass Cassidy",                                      // Lv  88, 2 mon
        "Youngster Butch",                                   // Lv  98, 2 mon
        "Hiker Reginald",                                    // Lv  89, 3 mon
        "Hiker Lorenzo",                                     // Lv  89, 3 mon
        "Castle Valet Darach",                               // Lv  94, 3 mon
        "Lady Caitlin",                                      // Lv  92, 3 mon
        "Scientist Caliban",                                 // Lv  92, 6 mon
        "Galactic Portia",                                   // Lv  92, 3 mon
        "Galactic Cressida #1",                              // Lv  88, 3 mon
        "Galactic Trinculo #2",                              // Lv  90, 5 mon
        "Galactic Umbriel #1",                               // Lv  87, 3 mon
        "Galactic Francisco #2",                             // Lv  89, 3 mon
        "Galactic Miranda #2",                               // Lv  88, 3 mon
        "Galactic Ferdinand #1",                             // Lv  89, 3 mon
        "Galactic Squad Juliet",                             // Lv  92, 6 mon
        "Galactic Margaret",                                 // Lv  86, 3 mon
        "Galactic Cupid #2",                                 // Lv  88, 3 mon
        "Galactic Squad Perdita #1",                         // Lv  87, 5 mon
        "Galactic Setebos #2",                               // Lv  92, 4 mon
        "Galactic Sycorax #2",                               // Lv  88, 2 mon
        "Galactic Ariel #1",                                 // Lv  88, 3 mon
        "Galactic Bianca #2",                                // Lv  89, 3 mon
        "Galactic Squad Mab",                                // Lv  88, 5 mon
        "Galactic Rosalind",                                 // Lv  93, 5 mon
        "Galactic Squad Belinda",                            // Lv  87, 6 mon
        "Galactic Bebhionn",                                 // Lv  89, 3 mon
        "Galactic Erripaus",                                 // Lv  89, 3 mon
        "Galactic Janus",                                    // Lv  88, 5 mon
        "Scientist Stephano",                                // Lv  90, 5 mon
        "Galactic Oberon #1",                                // Lv  83, 3 mon
        "Galactic Puck #2",                                  // Lv   1, 3 mon
        "Galactic Prospero #2",                              // Lv  90, 6 mon
        "Galactic Alborix",                                  // Lv  87, 4 mon
        "Galactic Skymir",                                   // Lv  94, 3 mon
        "Galactic Loge",                                     // Lv  90, 3 mon
        "Galactic Hyperion #2",                              // Lv  91, 3 mon
        "Galactic Prometheus #2",                            // Lv  90, 3 mon
        "Galactic Tethys #2",                                // Lv  89, 3 mon
        "Galactic Dione #2",                                 // Lv  96, 3 mon
        "Galactic Titan #2",                                 // Lv  86, 6 mon
        "Galactic Epimetheus #2",                            // Lv  89, 3 mon
        "Galactic Pandora #2",                               // Lv  90, 3 mon
        "Galactic Enceladus #2",                             // Lv  88, 3 mon
        "Galactic Mimas #2",                                 // Lv  87, 3 mon
        "Galactic Daphnis #2",                               // Lv  89, 3 mon
        "Galactic Pan #2",                                   // Lv  92, 3 mon
        "Galactic Kari",                                     // Lv  89, 5 mon
        "Galactic Geirrod",                                  // Lv  90, 3 mon
        "Galactic Greip",                                    // Lv  90, 3 mon
        "Galactic Iapetus #2",                               // Lv  90, 3 mon
        "Galactic Phoebe #2",                                // Lv  95, 3 mon
        "Galactic Atlas #2",                                 // Lv  86, 5 mon
        "Galactic Rhea #2",                                  // Lv  89, 5 mon
        "Galactic Uranus #3",                                // Lv  94, 6 mon
        "Galactic Boss Cyrus #2",                            // Lv  96, 6 mon
        "Galactic Io #4",                                    // Lv  88, 6 mon
        "Commander Saturn #2",                               // Lv  95, 6 mon
        "Galactic Ganymede #3",                              // Lv 100, 3 mon
        "Galactic Halimede #2",                              // Lv  92, 3 mon
        "Galactic Squad Phobos #3",                          // Lv 100, 6 mon
        "Galactic Squad Deimos #3",                          // Lv  89, 6 mon
        "Galactic Despina #2",                               // Lv  93, 3 mon
        "Galactic Bianca #3",                                // Lv  93, 3 mon
        "Galactic Ferdinand #2",                             // Lv  94, 5 mon
        "Galactic Squad Perdita #2",                         // Lv  93, 6 mon
        "Galactic Valetudo #2",                              // Lv  94, 5 mon
        "Galactic Cupid #3",                                 // Lv  93, 3 mon
        "Galactic Cressida #2",                              // Lv  92, 3 mon
        "Galactic Cordelia",                                 // Lv  93, 6 mon
        "Galactic Oberon #2",                                // Lv  92, 6 mon
        "Galactic Titania",                                  // Lv  93, 6 mon
        "Galactic Proteus #2",                               // Lv 100, 6 mon
        "Galactic Laomedeia #2",                             // Lv 100, 4 mon
        "Galactic Larissa #2",                               // Lv  95, 5 mon
        "Galactic Terra #5",                                 // Lv  92, 6 mon
        "Galactic Luna #5",                                  // Lv  90, 6 mon
        "Galactic Europa #3",                                // Lv  93, 5 mon
        "Galactic Pluto #4",                                 // Lv  92, 6 mon
        "Galactic Prospero #3",                              // Lv  94, 6 mon
        "Galactic Squad Amalthia",                           // Lv  91, 5 mon
        "Galactic Miranda #3",                               // Lv  92, 5 mon
        "Galactic Angrboda",                                 // Lv  95, 5 mon
        "Galactic Ariel #2",                                 // Lv  94, 3 mon
        "Galactic Umbriel #2",                               // Lv  94, 3 mon
        "Galactic Callisto #3",                              // Lv  95, 3 mon
        "Galactic Hippocamp #2",                             // Lv  94, 3 mon
        "Galactic Neptune #3",                               // Lv  92, 6 mon
        "Galactic Triton #3",                                // Lv  90, 6 mon
        "Galactic Mercury #5",                               // Lv  94, 3 mon
        "Galactic Venus #5",                                 // Lv  94, 3 mon
        "Commander Mars #3",                                 // Lv  95, 6 mon
        "Commander Jupiter #3",                              // Lv  95, 6 mon
        "Galactic Boss Cyrus #3",                            // Lv  98, 6 mon
        "Galactic Boss Cyrus #4",                            // Lv 100, 1 mon
    ],
    "Elite Four": [
        "Swimmer Miranda",                                   // Lv  97, 4 mon
        "Swimmer Aubree",                                    // Lv  96, 4 mon
        "Swimmer Paige",                                     // Lv  91, 4 mon
        "Swimmer Wesley",                                    // Lv  94, 4 mon
        "Sailor Zachariah",                                  // Lv  94, 4 mon
        "Swimmer Francisco",                                 // Lv  94, 4 mon
        "Swimmer Ledecky",                                   // Lv  99, 3 mon
        "Cameraman Matt",                                    // Lv  93, 6 mon
        "Roughneck Wyatt",                                   // Lv  93, 6 mon
        "Black Belt Roku",                                   // Lv  93, 6 mon
        "Beauty Jasmine #2",                                 // Lv  94, 6 mon
        "Aroma Lady Fadel",                                  // Lv  95, 6 mon
        "Collector Tobias",                                  // Lv  91, 6 mon
        "Clown Julia",                                       // Lv  92, 6 mon
        "Hiker J.J Ahern",                                   // Lv  96, 6 mon
        "Bug Catcher Ford",                                  // Lv  96, 6 mon
        "Ruin Maniac Greg",                                  // Lv 100, 6 mon
        "Idol Zoe",                                          // Lv  99, 6 mon
        "Dragon Tamer Clinton",                              // Lv  97, 6 mon
        "Sinister Hooded Figure",                            // Lv 100, 6 mon
        "Pokémon Trainer Barry #6 [Empoleon]",               // Lv 100, 6 mon
        "Pokémon Trainer Barry #6 [Infernape]",              // Lv 100, 6 mon
        "Pokémon Trainer Barry #6 [Torterra]",               // Lv 100, 6 mon
        "Elite Four Aaron",                                  // Lv 100, 6 mon
        "Elite Four Bertha",                                 // Lv 100, 6 mon
        "Elite Four Flint",                                  // Lv 100, 6 mon
        "Elite Four Lucian",                                 // Lv 100, 6 mon
        "Champion Cynthia",                                  // Lv 100, 6 mon
    ],

    // Not in any split or Tag Partner. In level order, which is close to play order.
    "unassigned": [
        "Pokémon Trainer Barry #1 [Chimchar]",               // Lv   5, 1 mon
        "Pokémon Trainer Barry #1 [Piplup]",                 // Lv   5, 1 mon
        "Pokémon Trainer Barry #1 [Turtwig]",                // Lv   5, 1 mon
        "Pokémon Trainer Dawn @ Jubilife City [Grotle]",     // Lv  16, 6 mon
        "Pokémon Trainer Dawn @ Jubilife City [Monferno]",   // Lv  16, 6 mon
        "Pokémon Trainer Dawn @ Jubilife City [Prinplup]",   // Lv  16, 6 mon
        "Pokémon Trainer Lucas @ Jubilife City [Grotle]",    // Lv  16, 6 mon
        "Pokémon Trainer Lucas @ Jubilife City [Monferno]",  // Lv  16, 6 mon
        "Pokémon Trainer Lucas @ Jubilife City [Prinplup]",  // Lv  16, 6 mon
        "Pokémon Trainer Cheryl @ Eterna Forest",            // Lv  24, 6 mon
        "Pokémon Trainer Dawn @ Veilstone City [Empoleon]",  // Lv  44, 6 mon
        "Pokémon Trainer Dawn @ Veilstone City [Infernape]", // Lv  44, 6 mon
        "Pokémon Trainer Dawn @ Veilstone City [Torterra]",  // Lv  44, 6 mon
        "Pokémon Trainer Lucas @ Veilstone City [Empoleon]", // Lv  44, 6 mon
        "Pokémon Trainer Lucas @ Veilstone City [Infernape]", // Lv  44, 6 mon
        "Pokémon Trainer Lucas @ Veilstone City [Torterra]", // Lv  44, 6 mon
        "Pokémon Trainer Riley @ Iron Island",               // Lv  62, 5 mon
        "Pokémon Trainer Marley @ Lake Valor",               // Lv  67, 6 mon
        "Pokémon Trainer Dawn @ Lake Verity",                // Lv  68, 6 mon
        "Pokémon Trainer Lucas @ Lake Verity",               // Lv  68, 6 mon
        "Pokémon Trainer Mira @ Wayward Cave",               // Lv  97, 4 mon
        "Lady Emi",                                          // Lv 100, 2 mon
        "Pokémon Trainer Barry @ Spear Pillar [Empoleon]",   // Lv 100, 6 mon
        "Pokémon Trainer Barry @ Spear Pillar [Infernape]",  // Lv 100, 6 mon
        "Pokémon Trainer Barry @ Spear Pillar [Torterra]",   // Lv 100, 6 mon
        "Pokémon Trainer Cheryl @ Coronet Highlands",        // Lv 100, 6 mon
        "Pokémon Trainer Marley @ Coronet Highlands",        // Lv 100, 6 mon
        "Pokémon Trainer Mira @ Spear Pillar",               // Lv 100, 6 mon
        "Pokémon Trainer Riley @ Coronet Highlands",         // Lv 100, 6 mon
    ]
};

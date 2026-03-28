LAST_DEX_ENTRY = "";

const classes = "species move location item ability type category nature";

const trappingAbilities = ["shadowtag", "arenatrap", "magnetpull"];
const teleportingMoves = ["teleport"];
const roaringMoves = ["whirlwind", "roar"];
const selfKoMoves = ["selfdestruct", "explosion", "memento"];
const recoilMoves = ["doubleedge", "hyperbeam", "takedown", "thrash", "skyattack", "outrage", "overheat", "volttackle", "blastburn", "eruption", "hydrocannon", "superpower", "waterspout", "bravebird", "flareblitz", "headsmash", "woodhammer", "dracometeor", "roaroftime", "closecombat", "gigaimpact", "wildcharge", "solidplant"];
const trappingMoves = ["wrap", "submission", "firespin", "meanlook", "twister", "whirlpool", "swallow", "sandtomb", "block"];

function loadDexEntry(entryID) {
    var namespace = entryID.split("/")[0];
    var id = entryID.split("/")[1];
    LAST_DEX_ENTRY = entryID;
    switch (namespace) {
        case "species":
            var species = SPECIES[id];
            var abilities = species.abilities.map(x => ABILITIES[x]);
            var heldItems = Object.keys(species.heldItems).map(x => {return {item: ITEMS[x], chance: species.heldItems[x]}});
            var evos = "<i>No evolutionary line</i>";
            if (species.prevo || species.evos.length) {
                var first = species;
                while (first.prevo) first = SPECIES[first.prevo];
                var firstName = first.id == id ? `<b>${first.name}</b>` : first.name;
                evos = `<td><span${first.id != id ? ` data-target="species/${first.id}"` : ``}><img src="/img/dex/icon/species/${first.id}.png">${firstName}</span></td>`;
                if (first.evos.length == 1) {
                    var second = SPECIES[first.evos[0].species];
                    var secondName = second.id == id ? `<b>${second.name}</b>` : second.name;
                    evos += `<td class="arrow">→</td><td><span${second.id != id ? ` data-target="species/${second.id}"` : ``}><img src="/img/dex/icon/species/${second.id}.png">${secondName}</span></td>`;
                    if (second.evos.length == 1) {
                        var third = SPECIES[second.evos[0].species];
                        var thirdName = third.id == id ? `<b>${third.name}</b>` : third.name;
                        evos += `<td class="arrow">→</td><td><span${third.id != id ? ` data-target="species/${third.id}"` : ``}><img src="/img/dex/icon/species/${third.id}.png">${thirdName}</span></td>`;
                    } else if (second.evos.length > 1) {
                        var thirdA = SPECIES[second.evos[0].species];
                        var thirdAName = thirdA.id == id ? `<b>${thirdA.name}</b>` : thirdA.name;
                        var thirdB = SPECIES[second.evos[1].species];
                        var thirdBName = thirdB.id == id ? `<b>${thirdB.name}</b>` : thirdB.name;
                        evos += `<td><span class="arrow">→</span><span class="arrow">→</span></td><td><span data-target="species/${thirdA.id}"><img src="/img/dex/icon/species/${thirdA.id}.png">${thirdAName}</span><span data-target="species/${thirdB.id}"><img src="/img/dex/icon/species/${thirdB.id}.png">${thirdBName}</span></td>`;
                    }
                } else {
                    var secondArrows = "<td>";
                    var secondHTML = "<td>";
                    var thirdArrows = "<td>";
                    var thirdHTML = "<td>";
                    for (var i in first.evos.map(x => x.species).filter((x, y, z) => z.indexOf(x) == y)) {
                        var second = SPECIES[first.evos[i].species];
                        var secondName = second.id == id ? `<b>${second.name}</b>` : second.name;
                        secondArrows += `<span class="arrow">→</span>`;
                        secondHTML += `<span${second.id != id ? ` data-target="species/${second.id}"` : ``}><img src="/img/dex/icon/species/${second.id}.png">${secondName}</span>`;
                        if (second.evos.length) {
                            var third = SPECIES[second.evos[0].species];
                            var thirdName = third.id == id ? `<b>${third.name}</b>` : third.name;
                            thirdArrows += `<span class="arrow">→</span>`;
                            thirdHTML += `<span${third.id != id ? ` data-target="species/${third.id}"` : ``}><img src="/img/dex/icon/species/${third.id}.png">${thirdName}</span>`;
                        }
                    }
                    secondArrows += "</td>";
                    secondHTML += "</td>";
                    evos += secondArrows + secondHTML;
                    thirdArrows += "</td>";
                    thirdHTML += "</td>";
                    evos += thirdArrows + thirdHTML;
                }
            }
            var evoMethod = "";
            if (species.prevo) {
                var evo_entries = SPECIES[species.prevo].evos.filter(x => x.species == species.id);
                evoMethod = "";
                for (var i in evo_entries) {
                    var evo = evo_entries[i];
                    switch (evo.method) {
                        case "Friendship":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> when leveled up with 220 Friendship`
                            break;
                        case "Level":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> at level ${evo.extra}`
                            break;
                        case "Item":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> by using a <span data-target=\"item/${evo.extra}\">${ITEMS[evo.extra].name}</span>`
                            break;
                        case "Atk > Def":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> at level ${evo.extra} if its Attack stat is higher than its Defense stat`
                            break;
                        case "Atk = Def":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> at level ${evo.extra} if its Attack stat is lower than its Defense stat`
                            break;
                        case "Atk < Def":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> at level ${evo.extra} if its Attack stat is equal to its Defense stat`
                            break;
                        case "Random":
                            evoMethod += `Can randomly evolve from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> at level ${evo.extra}`
                            break;
                        case "Level (Party slot)":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> at level ${evo.extra} if the player has a free party slot and at least one <span data-target=\"item/pokeball\">Poké Ball</span> in the bag`
                            break;
                        case "Beauty":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> when leveled up with 170 Beauty`
                            break;
                        case "Item (Female)":
                            evoMethod += `Evolves from female <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> by using a <span data-target=\"item/${evo.extra}\">${ITEMS[evo.extra].name}</span>`
                            break;
                        case "Item (Day)":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> by using a <span data-target=\"item/${evo.extra}\">${ITEMS[evo.extra].name}</span> at day`
                            break;
                        case "Item (Night)":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> by using a <span data-target=\"item/${evo.extra}\">${ITEMS[evo.extra].name}</span> at night`
                            break;
                        case "Move learned":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> when leveled up after learning <span data-target=\"move/${evo.extra}\">${MOVES[evo.extra].name}</span>`
                            break;
                        case "Party Pokemon":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> when leveled up with a <span data-target=\"species/${evo.extra}\">${SPECIES[evo.extra].name}</span> in the party`
                            break;
                        case "Level (Male)":
                            evoMethod += `Evolves from male <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> at level ${evo.extra}`
                            break;
                        case "Level (Female)":
                            evoMethod += `Evolves from female <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> at level ${evo.extra}`
                            break;
                        case "Magnetic Field":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> when leveled up inside a Magnetic Field (at <span data-target=\"location/mtcoronet\">Mt. Coronet</span>)`
                            break;
                        case "Moss Rock":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> when leveled up near a Moss Rock (in <span data-target=\"location/eternaforest\">Eterna Forest</span>)`
                            break;
                        case "Ice Rock":
                            evoMethod += `Evolves from <span data-target=\"species/${species.prevo}\">${SPECIES[species.prevo].name}</span> when leveled up near a Ice Rock (on <span data-target=\"location/route217\">Route 217</span>)`
                            break;
                        default:
                            evoMethod += evo.method;
                            break;
                    }
                    evoMethod += "<br />";
                }
            }
            var statTable = `<table class="stat-table">`;
            var total = 0;
            for (var id in species.baseStats) {
                var stat = dex_STATS[id];
                var val = species.baseStats[id];
                total += val;
                var color = val < 50 ? "red" : val < 75 ? "orange" : val < 100 ? "yellow" : val < 150 ? "lime" : "aqua";
                statTable += `<tr><th>${stat.shortName}</th><td class="number">${val}</td><td><span class="bar" style="background-color: ${color}; width: ${val}px;"></span></td></tr>`;
            }
            statTable += `<tfoot><tr><th>BST</th><td class="number">${total}</td><td></td></tr></tfoot>`;
            statTable += `</table>`;
            var stat_changes = [];
            for (var field in species.changes) {
                if (field in dex_STATS) stat_changes.push(`${species.changes[field] > 0 ? "+" + species.changes[field] : species.changes[field]} ${dex_STATS[field].abbr}`);
            }
            var formes = "";
            var baseSpecies = species.baseSpecies ? SPECIES[species.baseSpecies] : species;
            if (baseSpecies.formes.length) {
                formes = baseSpecies.formes.map(x => `<span class="forme" data-target="species/${x}"><img src="/img/dex/icon/species/${x}.png">${x == species.id ? `<b>${SPECIES[x].name}</b>` : SPECIES[x].name}</span>`).join("");
            }
            var html = `
            <div class="info">
                <img src="img/dex/large/species/${species.id}.png" class="sprite">
                <span class="name">${species.name}</span>
                <span class="types">${species.types.map(x => `<img src="img/dex/large/types/${x}.png" data-target="type/${x}">`).join("")}</span>
                <span class="abilities">Abilities: ${abilities.map(x => `<span data-target="ability/${x.id}">${x.name}</span>`).join(", ")}</span>
                <span class="genderRatio">Gender: ${species.genderRatio}</span>
                <span class="catchRate">Catch Rate: ${species.catchRate}<!--<br /><span class="catchRate-hint">(${Math.round(species.catchRate / 3 * 10) / 10}% with a <span data-target="item/pokeball">Poké Ball</span> at full HP)</span>--></span>
                <span class="weight">Weight: ${species.weight.toFixed(1)} lbs</span>
                ${Object.keys(species.heldItems).length ? `<span class="heldItems">Held Items: ${heldItems.map(x => `<span class="heldItem"><span class="itemName" data-target="item/${x.item.id}"><img src="/img/dex/icon/items/${x.item.id}.png">${x.item.name}</span><span class="itemChance"> (${x.chance}%)</span></span>`).join("")}</span>` : ``}
                <span class="evos"><table class="evos-table"><tbody><tr>${evos}</tr></tbody></table><span class="evo-method">${evoMethod}</span></span>
                <span class="stats">
                    Base stats: ${statTable}
                    ${stat_changes.length ? `<span class="stat-changes">Changes: ${stat_changes.join(", ")}</span>` : ""}
                </span>
                ${formes ? `<span class="formes">Formes:${formes}</span>` : ""}
            </div>
            <div class="list">
                <ul class="list-nav">
                    <li class="current" data-tab="learnset">Learnset</li>
                    <li data-tab="locations">Locations</li>
                </ul>
                <ul class="results">
                    
                </ul>
            </div>`;
            $(".dex-info").removeClass(classes).addClass("species").html(html);
            function listSpeciesLearnset() {
                $(".dex-info .results").empty();
                var lastMethod = "";
                for (var i in species.learnset) {
                    var learnset = species.learnset[i];
                    var move = MOVES[learnset.move];
                    switch (learnset.method) {
                        case "level":
                            var data = `Lv. ${learnset.level}`;
                            var method = "Level-up";
                            break;
                        case "prevo":
                            var prevo = SPECIES[learnset.prevo];
                            var data = `Lv. ${learnset.level}`;
                            var method = `Level-up (${prevo.name})`;
                            break;
                        case "tm":
                            var machine = ITEMS[move.machine > 0 ? `tm${String(move.machine).padStart(2, "0")}` : `hm${String(-move.machine).padStart(2, "0")}`];
                            var data = `<img src="/img/dex/icon/items/${machine.id}.png">`;
                            var method = "TM/HM";
                            break;
                        case "tutor":
                            var data = `<img src="/img/dex/icon/other/tutor.png">`;
                            var method = "Move tutor";
                            break;
                    }
                    if (lastMethod !== learnset.method + (learnset.prevo ?? "")) $(".dex-info .results").append(`<legend class="result-header">${method}</legend>`);
                    lastMethod = learnset.method + (learnset.prevo ?? "");
                    $(".dex-info .results").append(`
                        <li class="species-learnset" data-target="move/${move.id}">
                            <span class="data">${data}</span>
                            <span class="name">${move.shortName}</span>
                            <span class="type"><img src="/img/dex/icon/types/${move.type}.png"></span>
                            <span class="category"><img src="/img/dex/icon/other/${move.category}.png"></span>
                            <span class="basePower">${move.basePower > 1 ? move.basePower : "-"}</span>
                            <span class="accuracy">${move.accuracy > 0 ? `${move.accuracy}%` : "-"}</span>
                            <span class="powerPoints">${move.pp}<br />PP</span>
                        </li>`);
                }
            }
            function listSpeciesLocations() {
                $(".dex-info .results").empty();
                var locationList = Object.values(LOCATIONS).filter(x => x.encounters.some(x => x.species == species.id));
                if (!locationList.length) {
                    $(".dex-info .results").append("This Pokémon is not available.");
                }
                var dupes = getDupedLocations();
                var locations = {};
                for (var i in locationList) {
                    var location = locationList[i];
                    var encounters = location.encounters.filter(x => x.species == species.id);
                    for (var j in encounters) {
                        var encounter = encounters[j];
                        var chance = encounter.chance ?? 0;
                        var minLevel = encounter.minLevel;
                        var maxLevel = encounter.maxLevel;
                        if (!locations[location.id]) locations[location.id] = {};
                        var fullMethod = encounter.method + ("-" + encounter.time ?? "")
                        if (!locations[location.id][fullMethod]) locations[location.id][fullMethod] = {
                            chance: chance,
                            minLevel: minLevel,
                            maxLevel: maxLevel
                        };
                        else {
                            locations[location.id][fullMethod].chance += chance;
                            if (minLevel < locations[location.id][fullMethod].minLevel) locations[location.id][fullMethod].minLevel = minLevel;
                            if (maxLevel > locations[location.id][fullMethod].maxLevel) locations[location.id][fullMethod].maxLevel = maxLevel;
                        }
                    }
                }
                for (var id in locations) {
                    var encounters = locations[id];
                    var location = LOCATIONS[id];
                    if (encounters["grass-morning"] && JSON.stringify(encounters["grass-morning"]) == JSON.stringify(encounters["grass-day"]) && JSON.stringify(encounters["grass-morning"]) == JSON.stringify(encounters["grass-night"])) {
                        encounters["grass"] = encounters["grass-morning"];
                        delete encounters["grass-morning"];
                        delete encounters["grass-day"];
                        delete encounters["grass-night"];
                    } else if (encounters["grass-morning"] && JSON.stringify(encounters["grass-morning"]) == JSON.stringify(encounters["grass-day"])) {
                        encounters["grass-morning-day"] = encounters["grass-morning"];
                        delete encounters["grass-morning"];
                        delete encounters["grass-day"];
                    } else if (encounters["grass-day"] && JSON.stringify(encounters["grass-day"]) == JSON.stringify(encounters["grass-night"])) {
                        encounters["grass-day-night"] = encounters["grass-day"];
                        delete encounters["grass-day"];
                        delete encounters["grass-night"];
                    } else if (encounters["grass-morning"] && JSON.stringify(encounters["grass-morning"]) == JSON.stringify(encounters["grass-night"])) {
                        encounters["grass-morning-night"] = encounters["grass-morning"];
                        delete encounters["grass-morning"];
                        delete encounters["grass-night"];
                    }
                    for (var fullMethod in encounters) {
                        var encounter = encounters[fullMethod];
                        var dupe = dupes.includes(location.id);
                        var data = encounter.chance ? `${encounter.chance}%` : `-`;
                        var minLevel = encounter.minLevel;
                        var maxLevel = encounter.maxLevel;
                        var level;
                        if ([].includes(encounter.method)) level = "-";
                        else level = minLevel == maxLevel ? `Lv. ${minLevel}` : `Lv. ${minLevel}-${maxLevel}`;
                        var method = ENCOUNTER_METHODS[fullMethod.split("-")[0]];
                        $(".dex-info .results").append(`
                            <li class="species-location${dupe ? " dupe" : ""}" data-target="location/${location.id}">
                                <span class="data">${data}</span>
                                <span class="name">${location.name}</span>
                                <span class="level">${level}</span>
                                <span class="method" title="${method.name}${fullMethod.split("-").length > 1 ? ` [${fullMethod.split("-").slice(1).join(", ")}]` : ""}"><img src="/img/dex/icon/other/${method.id}.png"></span>
                            </li>`);
                    }
                }
            }
            listSpeciesLearnset();
            $(".list-nav li").on("click", function() {
                if ($(this).is(".current")) return;
                $(".current").removeClass("current");
                $($(this)).addClass("current");
                if ($(this).attr("data-tab") == "learnset") listSpeciesLearnset();
                else listSpeciesLocations();
                $(".dex-info").find("[data-target]").on("click", function() {
                    var target = $(this).attr("data-target");
                    window.location = `#/dex/${target}`;
                });
            });
            $(".dex-info").find("[data-target]").on("click", function() {
                var target = $(this).attr("data-target");
                window.location = `#/dex/${target}`;
            });
            break;
        case "move":
            var move = MOVES[id];
            var machine = ITEMS[move.machine > 0 ? `tm${String(move.machine).padStart(2, "0")}` : `hm${String(-move.machine).padStart(2, "0")}`];
            var tutorLocation = move.tutor;
            var html = `
            <div class="info">
                <span class="name">${move.name}</span>
                <span class="type-category"><img src="img/dex/large/types/${move.type}.png" data-target="type/${move.type}"><img src="img/dex/large/other/${move.category}.png" data-target="category/${move.category}"></span>
                ${!move.available ? `<span class="note">This move is not available to the player.</span>` : ""}
                <span class="basePower">Base Power: ${move.basePower > 1 ? move.basePower : "-"}</span>
                <span class="accuracy">Accuracy: ${move.accuracy > 0 ? `${move.accuracy}%` : "-"}</span>
                <span class="powerPoints">PP: ${move.pp}</span>
                ${move.priority ? `<span class="priority">Priority: ${move.priority > 0 ? "+" : ""}${move.priority}</span>` : ""}
                <span class="description">${move.effect}</span>
                ${move.machine ? `<span class="machine">Machine: <span data-target="item/${machine.id}"><img src="/img/dex/icon/items/${machine.id}.png">${machine.name}</span></span>` : ""}
                ${move.tutor ? `<span class="tutor">Tutor location: <span data-target="location/${tutorLocation}">${tutorLocation}</span></span>` : ""}
                <span class="flags">
                    ${move.flags.includes("Contact") ? `<span class="contact">This move makes contact with the target.</span>` : ""}
                    ${move.flags.includes("Punch") ? `<span class="punch">This move is a Punching move, which is boosted by <span data-target=\"ability/ironfist\">Iron Fist</span>.</span>` : ""}
                    ${move.flags.includes("Sound") ? `<span class="sound">This move is a Sound-based move, which does not affect Pokémon with the ability <span data-target=\"ability/soundproof\">Soundproof</span>.</span>` : ""}
                </span>
            </div>
            <div class="list">
                <ul class="list-nav">
                    <li class="current" data-tab="learnset">Learnset</li>
                </ul>
                <ul class="results">
                    
                </ul>
            </div>`;
            $(".dex-info").removeClass(classes).addClass("move").html(html);
            function listMoveLearnset() {
                $(".dex-info .results").empty();
                var levelLearnset = [];
                var tmLearnset = [];
                var tutorLearnset = [];
                for (var speciesID in SPECIES) {
                    var species = SPECIES[speciesID];
                    var learnsets = species.learnset.filter(x => x.move == move.id);
                    for (var i in learnsets) {
                        var learnset = learnsets[i];
                        switch (learnset.method) {
                            case "level":
                                data = `Lv. ${learnset.level}`;
                                method = "Level-up";
                                levelLearnset.push({level: learnset.level, html: `
                                    <li class="move-learnset" data-target="species/${species.id}">
                                        <span class="data">${data}</span>
                                        <span class="icon"><img src="/img/dex/icon/species/${species.id}.png"></span>
                                        <span class="name">${species.name}</span>
                                        <span class="method">${method}</span>
                                    </li>`});
                                break;
                            case "tm":
                                data = `<img src="/img/dex/icon/items/${machine.id}.png">`;
                                method = machine.name;
                                tmLearnset.push({html: `
                                    <li class="move-learnset" data-target="species/${species.id}">
                                        <span class="data">${data}</span>
                                        <span class="icon"><img src="/img/dex/icon/species/${species.id}.png"></span>
                                        <span class="name">${species.name}</span>
                                        <span class="method">${method}</span>
                                    </li>`});
                                break;
                            case "tutor":
                                data = `Tutor`;
                                method = move.tutor;
                                tutorLearnset.push({html: `
                                    <li class="move-learnset" data-target="species/${species.id}">
                                        <span class="data">${data}</span>
                                        <span class="icon"><img src="/img/dex/icon/species/${species.id}.png"></span>
                                        <span class="name">${species.name}</span>
                                        <span class="method">${method}</span>
                                    </li>`});
                                break;
                        }
                    }
                }
                var learnset = levelLearnset.sort((a, b) => a.level - b.level).concat(tmLearnset).concat(tutorLearnset).map(x => x.html);
                if (!learnset.length) {
                    $(".dex-info .results").append("This move cannot be normally learned.");
                }
                for (var i in learnset) $(".dex-info .results").append(learnset[i]);
            }
            listMoveLearnset();
            $(".dex-info").find("[data-target]").on("click", function() {
                var target = $(this).attr("data-target");
                window.location = `#/dex/${target}`;
            });
            break;
        case "location":
                var location = LOCATIONS[id];
                var html = `
                <div class="info">
                    <span class="name">${location.name}</span>
                    ${location.sublocations.length ? `
                        <span class="description">Included locations:</span>
                        <ul class="sublocations">
                            ${location.sublocations.map(x => `<li><span data-target="location/${x}">${LOCATIONS[x].name}</span></li>`).join("")}
                        </ul>
                    ` : ``}
                </div>
                <div class="list">
                    <ul class="list-nav">
                        <li class="current" data-tab="pokemon">Pokémon</li>
                        <li data-tab="items">Items</li>
                    </ul>
                    <ul class="results">
                        
                    </ul>
                </div>`;
                $(".dex-info").removeClass(classes).addClass("location").html(html);
                function listLocationPokemon() {
                    $(".dex-info .results").empty();
                    $(".dex-info .results").append(`
                        <ul class="encounter-time-nav">
                            <li class="current-time" data-time="morning" title="Morning (4:00 AM - 10:00 AM)">🌅</li>
                            <li data-time="day" title="Day (10:00 AM - 8:00 PM)">☀️</li>
                            <li data-time="night" title="Night (8:00 PM - 4:00 AM)">🌙</li>
                        </ul>`);
                    var dupes = getDupes();
                    var lastMethod = "";
                    for (var i in location.encounters) {
                        var encounter = location.encounters[i];
                        if (lastMethod !== encounter.method) $(".dex-info .results").append(`<legend class="result-header">${ENCOUNTER_METHODS[encounter.method].name}</legend>`);
                        lastMethod = encounter.method;
                        var species = SPECIES[encounter.species];
                        var base = species;
                        while (base.prevo) base = SPECIES[base.prevo];
                        var dupe = dupes.includes(base.id);
                        var data = encounter.chance ? `${encounter.chance}%` : `-`;
                        var minLevel = encounter.minLevel;
                        var maxLevel = encounter.maxLevel;
                        var level;
                        if ([].includes(encounter.method)) level = "-";
                        else level = minLevel == maxLevel ? `Lv. ${minLevel}` : `Lv. ${minLevel}-${maxLevel}`;
                        var learnset = species.learnset.filter(x => x.method == "level" && x.level <= minLevel).slice(-4).map(x => x.move);
                        if (minLevel !== maxLevel) learnset = learnset.concat(species.learnset.filter(x => x.method == "level" && x.level > minLevel && x.level <= maxLevel).map(x => x.move));
                        var danger = [];
                        for (var j in learnset) {
                            var move = MOVES[learnset[j]];
                            if (teleportingMoves.includes(move.id) && !danger.includes("teleport")) danger.push("teleport");
                            if (roaringMoves.includes(move.id) && !danger.includes("roar")) danger.push("roar");
                            if (selfKoMoves.includes(move.id) && !danger.includes("self-ko")) danger.push("self-ko");
                            if (recoilMoves.includes(move.id) && !danger.includes("recoil")) danger.push("recoil");
                            if (trappingMoves.includes(move.id) && !danger.includes("trap-move")) danger.push("trap-move");
                        }
                        for (var j in species.abilities) {
                            var ability = ABILITIES[species.abilities[j]];
                            if (trappingAbilities.includes(ability.id) && !danger.includes("trap-ability")) danger.push("trap-ability");
                        }
                        var dangerStyle = "";
                        if (danger.length) {
                            dangerStyle += "background: linear-gradient(to right";
                            var sliceSize = 100 / danger.length;
                            for (var j in danger) {
                                var start = sliceSize * j;
                                var end = sliceSize * (parseInt(j) + 1);
                                if (danger[j] == "teleport") dangerStyle += `, #cc99ff ${start}%, #cc99ff ${end}%`;
                                if (danger[j] == "roar") dangerStyle += `, #ffc000 ${start}%, #ffc000 ${end}%`;
                                if (danger[j] == "self-ko") dangerStyle += `, #ff5353 ${start}%, #ff5353 ${end}%`;
                                if (danger[j] == "recoil") dangerStyle += `, #66ffcc ${start}%, #66ffcc ${end}%`;
                                if (danger[j] == "trap-move") dangerStyle += `, #fff2cc ${start}%, #fff2cc ${end}%`;
                                if (danger[j] == "trap-ability") dangerStyle += `, #fff2cc ${start}%, #fff2cc ${end}%`;
                            }
                            dangerStyle += "); color: black;";
                        }
                        if (["gift", "egg"].includes(encounter.method)) {
                            danger = [];
                            dangerStyle = "";
                        }
                        var target = species.id !== "none" ? `species/${species.id}` : `location/${id}`;
                        $(".dex-info .results").append(`
                            <li class="location-species${dupe ? " dupe" : ""}" data-target="${target}"${encounter.time ? ` data-encounter-time="${encounter.time}"` : ``}>
                                <span class="data" style="${dangerStyle}" title="${danger.join(", ")}">${data}</span>
                                <span class="icon"><img src="/img/dex/icon/species/${species.id}.png"></span>
                                <span class="name">${species.name}</span>
                                <span class="level">${level}</span>
                                <span class="method" title="${ENCOUNTER_METHODS[encounter.method].name}"><img src="/img/dex/icon/other/${encounter.method}.png"></span>
                            </li>`);
                            $(`[data-encounter-time="day"], [data-encounter-time="night"]`).hide();
                    }

                    if (!location.encounters.length) {
                        $(".dex-info .results").empty().append("This location does not have any wild Pokémon.");
                    }
                    
                    $(".dex-info").find("[data-target]").on("click", function(e) {
                        var target = $(this).attr("data-target");
                        if (e.ctrlKey) {
                            var species = SPECIES[target.split("/")[1]];
                            var level = $(this).find(".level").html().split(" ")[1];
                            if (level.includes("-")) level = level.split("-")[1];
                            var moves = species.learnset.filter(x => x.method == "level" && x.level <= level).slice(-4).map(x => x.move);
                            loadSet(`${species.name} (Blank Set)`, "p2", { level: level, moves: moves });
                            window.location = `#/calc`;
                        } else {
                            window.location = `#/dex/${target}`;
                        }
                    });
                }
                function listLocationItems() {
                    $(".dex-info .results").empty();
                    $(".dex-info .results").append("Location data coming soon");

                    $(".dex-info").find("[data-target]").on("click", function() {
                        var target = $(this).attr("data-target");
                        window.location = `#/dex/${target}`;
                    });
                }
                listLocationPokemon();
                $(".list-nav > li").on("click", function() {
                    if ($(this).is(".current")) return;
                    $(".current").removeClass("current");
                    $($(this)).addClass("current");
                    if ($(this).attr("data-tab") == "pokemon") listLocationPokemon();
                    else listLocationItems();
                });
                $(".encounter-time-nav > li").on("click", function() {
                    if ($(this).is(".current-time")) return;
                    $(".current-time").removeClass("current-time");
                    $($(this)).addClass("current-time");
                    $(`[data-encounter-time]`).hide();
                    $(`[data-encounter-time="${$(this).attr("data-time")}"]`).show();
                });
                break;
        case "item":
            var item = ITEMS[id];
            var isMachine = item.name.startsWith("TM") || item.name.startsWith("HM");
            var machineMove = "";
            if (isMachine) {
                var machineNumber = parseInt(item.name.substring(2)) * (item.name.startsWith("HM") ? -1 : 1);
                machineMove = Object.values(MOVES).filter(x => x.machine == machineNumber)[0];
            }
            var html = `
            <div class="info">
                <img src="img/dex/large/items/${item.id}.png" class="sprite">
                <span class="name">${item.name}</span>
                <span class="description">${item.desc}</span>
                ${machineMove ? `<span class="move">Move: <span data-target="move/${machineMove.id}">${machineMove.name}</span></span>` : ""}
            </div>
            <div class="list">
                <ul class="list-nav">
                    <li class="current" data-tab="locations">Locations</li>
                    <li data-tab="heldby">Held By</li>
                </ul>
                <ul class="results">
                    
                </ul>
            </div>`;
            $(".dex-info").removeClass(classes).addClass("item").html(html);
            function listItemLocations() {
                $(".dex-info .results").empty();
                $(".dex-info .results").append("Location data coming soon");
            }
            function listItemHeldBy() {
                $(".dex-info .results").empty();
                var speciesList = Object.values(SPECIES).filter(x => x.heldItems && item.id in x.heldItems);
                if (!speciesList.length) {
                    $(".dex-info .results").append("This item is not held by any wild Pokémon.");
                }
                for (var i in speciesList) {
                    var species = speciesList[i];
                    $(".dex-info .results").append(`
                        <li class="item-heldby" data-target="species/${species.id}">
                            <span class="data">${species.heldItems[item.id]}%</span>
                            <span class="icon"><img src="/img/dex/icon/species/${species.id}.png"></span>
                            <span class="name">${species.name}</span>
                            <span class="types">${species.types.map(x => `<img src="/img/dex/icon/types/${x}.png">`).join("")}</span>
                        </li>`);
                }
            }
            listItemLocations();
            $(".list-nav li").on("click", function() {
                if ($(this).is(".current")) return;
                $(".current").removeClass("current");
                $($(this)).addClass("current");
                if ($(this).attr("data-tab") == "locations") listItemLocations();
                else listItemHeldBy();
                $(".dex-info").find("[data-target]").on("click", function() {
                    var target = $(this).attr("data-target");
                    window.location = `#/dex/${target}`;
                });
            });
            $(".dex-info").find("[data-target]").on("click", function() {
                var target = $(this).attr("data-target");
                window.location = `#/dex/${target}`;
            });
            break;
        case "ability":
            var ability = ABILITIES[id];
            var html = `
            <div class="info">
                <span class="name">${ability.name}</span>
                <span class="battle-desc"><b>Battle effect: </b>${ability.desc.battle ? ability.desc.battle : "<i>None.</i>"}</span>
                <span class="overworld-desc"><b>Overworld effect: </b>${ability.desc.overworld ? ability.desc.overworld : "<i>None.</i>"}</span>
            </div>
            <div class="list">
                <ul class="list-nav">
                    <li class="current" data-tab="pokemon">Pokémon</li>
                </ul>
                <ul class="results">
                    
                </ul>
            </div>`;
            $(".dex-info").removeClass(classes).addClass("ability").html(html);
            function listAbilityPokemon() {
                $(".dex-info .results").empty();
                var speciesList = Object.values(SPECIES).filter(x => x.abilities.includes(ability.id));
                if (!speciesList.length) {
                    $(".dex-info .results").append("No Pokémon normally has this ability.");
                }
                for (var i in speciesList) {
                    var species = speciesList[i];
                    $(".dex-info .results").append(`
                        <li class="ability-pokemon" data-target="species/${species.id}">
                            <span class="data">${species.abilities.indexOf(ability.id) + 1}</span>
                            <span class="icon"><img src="/img/dex/icon/species/${species.id}.png"></span>
                            <span class="name">${species.name}</span>
                            <span class="types">${species.types.map(x => `<img src="/img/dex/icon/types/${x}.png">`).join("")}</span>
                        </li>`);
                }
            }
            listAbilityPokemon();
            $(".dex-info").find("[data-target]").on("click", function() {
                var target = $(this).attr("data-target");
                window.location = `#/dex/${target}`;
            });
            break;
        case "type":
            var type = TYPES[id];
            var html = `
            <div class="info">
                <span class="name">${type.name} Type</span>
                <span class="type-icon"><img src="/img/dex/large/types/${type.id}.png"></span>
                <span class="weak">Weaknesses: ${type.weak.map(t => `<span data-target="type/${TYPES[t].id}"><img src="/img/dex/icon/types/${TYPES[t].id}.png"></span>`).join(" ") || `<i>None</i>`}</span>
                <span class="resist">Resistances: ${type.resist.map(t => `<span data-target="type/${TYPES[t].id}"><img src="/img/dex/icon/types/${TYPES[t].id}.png"></span>`).join(" ") || `<i>None</i>`}</span>
                <span class="immune">Immunities: ${type.immune.map(t => `<span data-target="type/${TYPES[t].id}"><img src="/img/dex/icon/types/${TYPES[t].id}.png"></span>`).join(" ") || `<i>None</i>`}</span>
            </div>
            <div class="list">
                <ul class="list-nav">
                    <li class="current" data-tab="pokemon">Pokémon</li>
                    <li data-tab="moves">Moves</li>
                </ul>
                <ul class="results">
                    
                </ul>
            </div>`;
            $(".dex-info").removeClass(classes).addClass("type").html(html);
            function listTypePokemon() {
                $(".dex-info .results").empty();
                var speciesList = Object.values(SPECIES).filter(x => x.types.includes(type.id));
                if (!speciesList.length) {
                    $(".dex-info .results").append("There are no Pokémon with this type.");
                }
                for (var i in speciesList) {
                    var species = speciesList[i];
                    $(".dex-info .results").append(`
                        <li class="type-pokemon" data-target="species/${species.id}">
                            <span class="data">${species.types.indexOf(type.id) + 1}</span>
                            <span class="icon"><img src="/img/dex/icon/species/${species.id}.png"></span>
                            <span class="name">${species.name}</span>
                            <span class="types">${species.types.map(x => `<img src="/img/dex/icon/types/${x}.png">`).join("")}</span>
                        </li>`);
                }
            }
            function listTypeMoves() {
                $(".dex-info .results").empty();
                var moveList = Object.values(MOVES).filter(x => x.type == type.id);
                for (var i in moveList) {
                    var move = moveList[i];
                    $(".dex-info .results").append(`
                        <li class="type-move" data-target="move/${move.id}">
                            <span class="name">${move.shortName}</span>
                            <span class="type"><img src="/img/dex/icon/types/${move.type}.png"></span>
                            <span class="category"><img src="/img/dex/icon/other/${move.category}.png"></span>
                            <span class="basePower">${move.basePower > 1 ? move.basePower : "-"}</span>
                            <span class="accuracy">${move.accuracy > 0 ? `${move.accuracy}%` : "-"}</span>
                            <span class="powerPoints">${move.pp}<br />PP</span>
                        </li>`);
                }
            }
            listTypePokemon();
            $(".list-nav li").on("click", function() {
                if ($(this).is(".current")) return;
                $(".current").removeClass("current");
                $($(this)).addClass("current");
                if ($(this).attr("data-tab") == "pokemon") listTypePokemon();
                else listTypeMoves();
                $(".dex-info").find("[data-target]").on("click", function() {
                    var target = $(this).attr("data-target");
                    window.location = `#/dex/${target}`;
                });
            });
            $(".dex-info").find("[data-target]").on("click", function() {
                var target = $(this).attr("data-target");
                window.location = `#/dex/${target}`;
            });
            break;
        case "category":
            var category = CATEGORIES[id];
            var html = `
            <div class="info">
                <span class="name">${category.name} Moves</span>
                <span class="category-icon"><img src="/img/dex/large/other/${category.id}.png"></span>
            </div>
            <div class="list">
                <ul class="list-nav">
                    <li class="current" data-tab="moves">Moves</li>
                </ul>
                <ul class="results">
                    
                </ul>
            </div>`;
            $(".dex-info").removeClass(classes).addClass("category").html(html);
            function listCategoryMoves() {
                $(".dex-info .results").empty();
                var moveList = Object.values(MOVES).filter(x => x.category == category.id);
                for (var i in moveList) {
                    var move = moveList[i];
                    $(".dex-info .results").append(`
                        <li class="category-move" data-target="move/${move.id}">
                            <span class="name">${move.shortName}</span>
                            <span class="type"><img src="/img/dex/icon/types/${move.type}.png"></span>
                            <span class="category"><img src="/img/dex/icon/other/${move.category}.png"></span>
                            <span class="basePower">${move.basePower > 1 ? move.basePower : "-"}</span>
                            <span class="accuracy">${move.accuracy > 0 ? `${move.accuracy}%` : "-"}</span>
                            <span class="powerPoints">${move.pp}<br />PP</span>
                        </li>`);
                }
            }
            listCategoryMoves();
            $(".dex-info").find("[data-target]").on("click", function() {
                var target = $(this).attr("data-target");
                window.location = `#/dex/${target}`;
            });
            break;
        case "nature":
            var nature = NATURES[id];
            var html = `
            <div class="info">
                <span class="name">${nature.name} Nature</span>
                ${nature.boostedStat !== nature.nerfedStat ? `
                    <span class="description">Boosted stat: ${dex_STATS[nature.boostedStat].name}</span>
                    <span class="description">Nerfed stat: ${dex_STATS[nature.nerfedStat].name}</span>` : `
                    <span class="description"><i>Neutral Nature</i></span>`}
            </div>
            <div class="list">
                <ul class="list-nav">
                    <li class="current" data-tab=""></li>
                </ul>
                <ul class="results">
                    
                </ul>
            </div>`;
            $(".dex-info").removeClass(classes).addClass("nature").html(html);
            $(".dex-info").find("[data-target]").on("click", function() {
                var target = $(this).attr("data-target");
                window.location = `#/dex/${target}`;
            });
            break;
        default:
            $(".dex-info").removeClass(classes).html(entryID);
            break;
    }
}

var TOTAL_RESULTS = [];
function search(term) {
    var results = $(".search .results").empty();
    if (!term && $("#all").prop("checked")) return;
    if (term) TOTAL_RESULTS = TOTAL_RESULTS.sort((a, b) => a.split("/")[1].localeCompare(b.split("/")[1])).sort((a, b) => b.split("/")[1].startsWith(term) - a.split("/")[1].startsWith(term));
    else {
        var filter = $("input[name=filter]:checked").val();
        switch (filter) {
            case "species":
                TOTAL_RESULTS = Object.keys(SPECIES).map(x => `species/${x}`).slice(1);
                break;
            case "moves":
                TOTAL_RESULTS = Object.keys(MOVES).map(x => `move/${x}`);
                break;
            case "locations":
                TOTAL_RESULTS = Object.keys(LOCATIONS).filter(x => LOCATIONS[x].search).map(x => `location/${x}`);
                break;
        }
    }
    for (var i in TOTAL_RESULTS) {
        var target = TOTAL_RESULTS[i];
        var namespace = target.split("/")[0];
        var id = target.split("/")[1];
        switch (namespace) {
            case "species":
                var species = SPECIES[id];
                if (species.id.includes(term)) results.append(`
                    <li class="species" data-target="species/${species.id}">
                        <span class="icon"><img src="/img/dex/icon/species/${species.id}.png"></span>
                        <span class="name">${species.name}</span>
                        <span class="types">${species.types.map(x => `<img src="/img/dex/icon/types/${x}.png">`).join("")}</span>
                    </li>`);
                break;
            case "move":
                var move = MOVES[id];
                if (move.id.includes(term)) results.append(`
                    <li class="move" data-target="move/${move.id}">
                        <span class="name">${move.shortName}</span>
                        <span class="type"><img src="/img/dex/icon/types/${move.type}.png"></span>
                        <span class="category"><img src="/img/dex/icon/other/${move.category}.png"></span>
                        <span class="basePower">${move.basePower > 1 ? move.basePower : "-"}</span>
                        <span class="accuracy">${move.accuracy > 0 ? `${move.accuracy}%` : "-"}</span>
                        <span class="powerPoints">${move.pp}<br />PP</span>
                    </li>`)
                break;
            case "location":
                var location = LOCATIONS[id];
                var dupes = getDupedLocations();
                var dupe = dupes.includes(id) || (dupes.includes(Object.keys(LOCATIONS).filter(x => LOCATIONS[x].sublocations.includes(id))[0]));
                if (location.id.includes(term)) results.append(`
                    <li class="location${dupe ? " dupe" : ""}" data-target="location/${location.id}">
                        <span class="name">${location.name}</span>
                    </li>`);
                break;
            case "item":
                var item = ITEMS[id];
                if (item.id.includes(term)) results.append(`
                    <li class="item" data-target="item/${item.id}">
                        <span class="icon"><img src="/img/dex/icon/items/${item.id}.png"></span>
                        <span class="name">${item.name}</span>
                    </li>`);
                break;
            case "ability":
                var ability = ABILITIES[id];
                if (ability.id.includes(term)) results.append(`
                    <li class="ability" data-target="ability/${ability.id}">
                        <span class="name">${ability.name}</span>
                    </li>`);
                break;
            case "nature":
                var nature = NATURES[id];
                var desc = "Neutral";
                if (nature.boostedStat != nature.nerfedStat) {
                    desc = `+${dex_STATS[nature.boostedStat].abbr}, -${dex_STATS[nature.nerfedStat].abbr}`;
                }
                if (nature.id.includes(term)) results.append(`
                    <li class="nature" data-target="nature/${nature.id}">
                        <span class="name">${nature.name} Nature</span>
                        <span class="desc">${desc}</span>
                    </li>`);
                break;
            default:
                if (id.includes(term)) results.append(`<li data-target="${target}">${target}</li>`);
                break;
        }
    }
    results.children().first().addClass("hover");
    results.find(`[data-target="${LAST_DEX_ENTRY}"]`).addClass("selected");
    results.find("[data-target]").on("mouseover", function() {
        if (!$(this).hasClass("hover")) $(".hover").removeClass("hover");
        $(this).addClass("hover");
    }).on("click", function() {
        var target = $(this).attr("data-target");
        window.location = `#/dex/${target}`;
        $(".selected").removeClass("selected");
        $(this).addClass("selected");
    });
}

$(document).ready(function() {
    $("input[name=filter]").on("change", function() {
        var filter = $(this).val();
        switch (filter) {
            case "species":
                TOTAL_RESULTS = Object.keys(SPECIES).map(x => `species/${x}`);
                break;
            case "moves":
                TOTAL_RESULTS = Object.keys(MOVES).map(x => `move/${x}`);
                break;
            case "locations":
                TOTAL_RESULTS = Object.keys(LOCATIONS).filter(x => LOCATIONS[x].search).map(x => `location/${x}`);
                break;
            default:
                TOTAL_RESULTS = [...Object.keys(SPECIES).map(x => `species/${x}`).slice(1), ...Object.keys(MOVES).map(x => `move/${x}`), ...Object.keys(ITEMS).filter(x => ITEMS[x].search).map(x => `item/${x}`), ...Object.keys(ABILITIES).map(x => `ability/${x}`), ...Object.keys(NATURES).map(x => `nature/${x}`), ...Object.keys(LOCATIONS).filter(x => LOCATIONS[x].search).map(x => `location/${x}`)];
                break;
        }
        $(".dex-searchbar").val("").trigger("input").select();
    });
    $("#all").prop("checked", true).change();
    $(".dex-searchbar").on("input", function() {
        search(toID($(this).val()));
    }).on("keydown", function(e) {
        var selected = $(".hover");
        switch (e.which) {
            case 38: // Up
                e.preventDefault();
                if (selected.prev().length) $(".hover").removeClass("hover").prev().addClass("hover");
                break;
            case 40: // Down
                e.preventDefault();
                if (selected.next().length) $(".hover").removeClass("hover").next().addClass("hover");
                break;
            case 13: // Enter
                e.preventDefault();
                if (!$(".hover").length) return;
                var target = $(".hover").attr("data-target");
                window.location = `#/dex/${target}`;
                $(".selected").removeClass("selected");
                $(".hover").addClass("selected");
                break;
        }
    }).val("").trigger("input");
});

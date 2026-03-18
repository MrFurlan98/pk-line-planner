var editEncounterPopup = `
<fieldset class="edit-encounter-popup">
    <legend align="center">Edit Set</legend>
    <select class="edit-species-selector"></select>
    <label>Nickname</label><input class="edit-nickname" type="text" maxlength="10" />
    <hr />
    <label>Gender</label><select class="edit-gender"><option value="">None</option><option>Male</option><option>Female</option></select><br />
    <label>Level</label><input class="edit-level" value="100" type="number" min="1" max="100" inputmode="decimal" />
    <hr />
    <label>HP</label><input class="edit-iv" id="edit-iv-hp" value="31" type="number" min="0" max="31" inputmode="decimal"><input class="edit-ev" id="edit-ev-hp" value="0" type="number" min="0" max="255" inputmode="decimal"><br />
    <label>Atk</label><input class="edit-iv" id="edit-iv-atk" value="31" type="number" min="0" max="31" inputmode="decimal"><input class="edit-ev" id="edit-ev-atk" value="0" type="number" min="0" max="255" inputmode="decimal"><br />
    <label>Def</label><input class="edit-iv" id="edit-iv-def" value="31" type="number" min="0" max="31" inputmode="decimal"><input class="edit-ev" id="edit-ev-def" value="0" type="number" min="0" max="255" inputmode="decimal"><br />
    <label>SpA</label><input class="edit-iv" id="edit-iv-spa" value="31" type="number" min="0" max="31" inputmode="decimal"><input class="edit-ev" id="edit-ev-spa" value="0" type="number" min="0" max="255" inputmode="decimal"><br />
    <label>SpD</label><input class="edit-iv" id="edit-iv-spd" value="31" type="number" min="0" max="31" inputmode="decimal"><input class="edit-ev" id="edit-ev-spd" value="0" type="number" min="0" max="255" inputmode="decimal"><br />
    <label>Spe</label><input class="edit-iv" id="edit-iv-spe" value="31" type="number" min="0" max="31" inputmode="decimal"><input class="edit-ev" id="edit-ev-spe" value="0" type="number" min="0" max="255" inputmode="decimal">
    <hr />
    <label>Nature</label><select class="edit-nature-selector"><option value="Adamant">Adamant (+Atk, -SpA)</option><option value="Bashful">Bashful</option><option value="Bold">Bold (+Def, -Atk)</option><option value="Brave">Brave (+Atk, -Spe)</option><option value="Calm">Calm (+SpD, -Atk)</option><option value="Careful">Careful (+SpD, -SpA)</option><option value="Docile">Docile</option><option value="Gentle">Gentle (+SpD, -Def)</option><option value="Hardy">Hardy</option><option value="Hasty">Hasty (+Spe, -Def)</option><option value="Impish">Impish (+Def, -SpA)</option><option value="Jolly">Jolly (+Spe, -SpA)</option><option value="Lax">Lax (+Def, -SpD)</option><option value="Lonely">Lonely (+Atk, -Def)</option><option value="Mild">Mild (+SpA, -Def)</option><option value="Modest">Modest (+SpA, -Atk)</option><option value="Naive">Naive (+Spe, -SpD)</option><option value="Naughty">Naughty (+Atk, -SpD)</option><option value="Quiet">Quiet (+SpA, -Spe)</option><option value="Quirky">Quirky</option><option value="Rash">Rash (+SpA, -SpD)</option><option value="Relaxed">Relaxed (+Def, -Spe)</option><option value="Sassy">Sassy (+SpD, -Spe)</option><option value="Serious">Serious</option><option value="Timid">Timid (+Spe, -Atk)</option></select><br />
    <label>Ability</label><select class="edit-ability-selector"></select><br />
    <label>Item</label><select class="edit-item-selector"></select><br />
    <label>Met Location</label><select class="edit-location-selector"></select>
    <hr />
    <select class="edit-move-selector small-select" id="edit-move1"></select>
    <select class="edit-move-selector small-select" id="edit-move2"></select>
    <select class="edit-move-selector small-select" id="edit-move3"></select>
    <select class="edit-move-selector small-select" id="edit-move4"></select>
    <hr />
    <span class="buttons">
        <button id="cancel-edit" class="btn">Cancel</button>
        <button id="save-edit" class="btn">Save</button>
    </span>
</fieldset>`;

var EDITING = "";
var EDIT_SPECIES = "";

function reloadEncounters() {
    $(".encounter-list").empty();
    var customSets = JSON.parse(localStorage.customsets ?? '{}');
    for (var i in customSets) {
        var species = SPECIES[toID(i)];
        for (var j in customSets[i]) {
            var nickname = j == "Custom Set" ? "" : j;
            var set = customSets[i][j];

            var level = set.level ?? 100;
            var ivs = set.ivs ? {"hp": set.ivs.hp ?? 31, "atk": set.ivs.at ?? 31, "def": set.ivs.df ?? 31, "spa": set.ivs.sa ?? 31, "spd": set.ivs.sd ?? 31, "spe": set.ivs.sp ?? 31} : {"hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31};
            var evs = set.evs ? {"hp": set.evs.hp ?? 0, "atk": set.evs.at ?? 0, "def": set.evs.df ?? 0, "spa": set.evs.sa ?? 0, "spd": set.evs.sd ?? 0, "spe": set.evs.sp ?? 0} : {"hp": 0, "atk": 0, "def": 0, "spa": 0, "spd": 0, "spe": 0};
            var nature = NATURES[toID(set.nature ?? "hardy")];
		    var boostedStat = dex_STATS[nature.boostedStat];
		    var nerfedStat = dex_STATS[nature.nerfedStat];
            var statsIV = Object.keys(ivs).map(x => `<span${boostedStat == nerfedStat ? '' : x == boostedStat.id ? ' class="boosted"' : x == nerfedStat.id ? ' class="nerfed"' : ''}>${ivs[x]}</span>`).join(" / ");
            var statsEV = Object.keys(evs).map(x => `${evs[x] ? `${evs[x]} ${dex_STATS[x].abbr}` : ""}`).filter(x => x).join(" / ");
            var gender = set.gender ? `(${set.gender[0]})` : "";
            var item = ITEMS[toID(set.item)] ?? "";
            var ability = ABILITIES[toID(set.ability) ?? species.abilities[0]];
            var location = LOCATIONS[toID(set.location)] ?? undefined;
            var moves = set.moves.map(x => Object.values(MOVES).find(y => y.calcName == x)).filter(x => x);

            var index = 1;
            while ($(`.encounter-list #dead-encounter-${index}`).length) index++;

            $(".encounter-list").append(
                `<span class="encounter${set.dead ? " dead" : ""}" data-set-name="${i} (${j})">
                    <img src="/img/dex/large/species/${species.id}.png" class="icon" data-target="species/${species.id}">
                    <span class="info">
                        <span class="name-level">
                            <span class="name"><span class="species" data-target="species/${species.id}">${species.name}</span>${nickname ? `<span class="nickname"> (${nickname})</span>` : ``}</span>
                            <span class="level">Lv. ${level}</span>
                        </span>
                        <span class="ivs-gender">
                            <span class="stats">${statsIV}</span>
                            <span class="gender">${gender}</span>
                        </span>
                        <span class="stats">${!Object.values(evs).every(x => x == 0) ? "EVs: " + statsEV : ""}</span>
                        <span class="item">${item ? `@ <span data-target="item/${item.id}"><img src="/img/dex/icon/items/${item.id}.png"> ${item.name}</span>` : ``}</span>
                        <span class="ability">Ability: <span data-target="ability/${ability.id}">${ability.name}</span></span>
                        <span class="location">${location ? `Met location: <span${location.id !== "linktrade" ? ` data-target="location/${location.id}"` : ""}>${location.name}</span>` : ""}</span>
                    </span>
                    <span class="moves">
                        <table>
                            <tr>
                                <td>${moves[0] ? `<span data-target="move/${moves[0].id}"><img src=\"/img/dex/icon/types/${moves[0].type}.png\"> ${moves[0].name}</span>` : ``}</td>
                                <td>${moves[1] ? `<span data-target="move/${moves[1].id}"><img src=\"/img/dex/icon/types/${moves[1].type}.png\"> ${moves[1].name}</span>` : ``}</td>
                            </tr>
                            <tr>
                                <td>${moves[2] ? `<span data-target="move/${moves[2].id}"><img src=\"/img/dex/icon/types/${moves[2].type}.png\"> ${moves[2].name}</span>` : ``}</td>
                                <td>${moves[3] ? `<span data-target="move/${moves[3].id}"><img src=\"/img/dex/icon/types/${moves[3].type}.png\"> ${moves[3].name}</span>` : ``}</td>
                            </tr>
                        </table>
                    </span>
                    <hr />
                    <span class="buttons">
                        <button class="edit-encounter btn">Edit</button>
                        <button class="delete-encounter btn">Delete</button>
                        <button class="dead-encounter btn">Dead?</button>
                    </span>
                </span>`);
        }
    }

    $(".encounter [data-target]").on("click", function() {
        var target = $(this).attr("data-target");
        window.location = `#/dex/${target}`;
    });
    $(".edit-encounter").on("click", function() {
        var dataSetName = $(this).closest(".encounter").attr("data-set-name");
        EDITING = dataSetName;
        var mon = dataSetName.substring(0, dataSetName.indexOf(" ("));
	    var setName = dataSetName.substring(dataSetName.indexOf("(") + 1, dataSetName.lastIndexOf(")"));
	    var customSets = JSON.parse(localStorage.customsets);
        var set = customSets[mon][setName];
        $(".edit-species-selector").val(mon).change();
        $(".edit-nickname").val(setName !== "Custom Set" ? setName : "").change();
        $(".edit-gender").val(set.gender ?? "None").change();
        $(".edit-level").val(set.level ?? 100).change();
        $(".edit-ivs").val(31).change();
        if (set.ivs) {
            for (var cStat in set.ivs) {
                var stat = Object.values(dex_STATS).find(x => x.shortId == cStat);
                var iv = set.ivs[cStat];
                $(`#edit-iv-${stat.id}`).val(iv).change();
            }
        }
        $(".edit-evs").val(0).change();
        if (set.evs) {
            for (var cStat in set.evs) {
                var stat = Object.values(dex_STATS).find(x => x.shortId == cStat);
                var ev = set.evs[cStat];
                $(`#edit-ev-${stat.id}`).val(ev).change();
            }
        }
        $(".edit-nature-selector").val(set.nature ?? "Hardy").change();
        $(".edit-ability-selector").val(set.ability ?? "").change();
        $(".edit-item-selector").val(set.item ?? "").change();
        $(".edit-location-selector").val(set.location ?? "").change();
        $(".edit-move-selector").val("").change();
        for (var i in set.moves) {
            var move = Object.values(MOVES).find(x => x.calcName == set.moves[i]);
            $(`#edit-move${parseInt(i) + 1}`).val(move.calcName).change();
        }
        $("#popup-container").show();
    });
    $(".delete-encounter").on("click", function() {
        if (confirm("Are you sure you want to delete this Pokémon?")) {
            removeSet($(this).closest(".encounter").attr("data-set-name"));
        }
    });
    $(".dead-encounter").on("click", function() {
        deadSet($(this).closest(".encounter").attr("data-set-name"), !$(this).closest(".encounter").hasClass("dead"));
    });
}

function getDupes() {
    if (!SETTINGS.dupeTracker) return [];
    var dupes = SETTINGS.dupes.slice();
    var customSets = JSON.parse(localStorage.customsets ?? '{}');
    for (var i in customSets) {
        var species = SPECIES[toID(i)];
        while (species.prevo) species = SPECIES[species.prevo];
        if (!dupes.includes(species.id)) dupes.push(species.id);
    }
    return dupes;
}

function getDupedLocations() {
    if (!SETTINGS.dupeTracker) return [];
    var dupes = [];
    var customSets = JSON.parse(localStorage.customsets ?? '{}');
    for (var i in customSets) {
        var species = customSets[i];
        for (var j in species) {
            var set = species[j];
            if (!set.location) continue;
            var location = LOCATIONS[toID(set.location)];
            if (!dupes.includes(location.id)) dupes.push(location.id);
        }
    }
    return dupes;
}

$(document).ready(function() {
    reloadEncounters();

    $("#popup-container").html(editEncounterPopup);
    var speciesOptions = getSelectOptions(Object.keys(calc.SPECIES[gen]), true);
    $(".edit-species-selector").append(speciesOptions).select2({
        dropdownAutoWidth: true
    });
    var moveOptions = getSelectOptions(Object.keys(calc.MOVES[gen]), true);
    $(".edit-move-selector").append(moveOptions).select2({
        dropdownAutoWidth: true
    });
    var abilityOptions = getSelectOptions(calc.ABILITIES[gen], true);
    $(".edit-ability-selector").append("<option value=\"\">(other)</option>" + abilityOptions);
    var itemOptions = getSelectOptions(calc.ITEMS[gen], true);
    $(".edit-item-selector").append("<option value=\"\">(none)</option>" + itemOptions);
    var locationOptions = getSelectOptions(Object.values(LOCATIONS).filter(x => x.metLocationId >= 0).map(x => x.name), true);
    $(".edit-location-selector").append("<option value=\"\">(none)</option>" + locationOptions);
    $("#cancel-edit").on("click", function() {
        $("#popup-container").hide();
    });
    $("#save-edit").on("click", function() {
        var currentPoke = JSON.parse(JSON.stringify(calc.SPECIES[4][$("select.edit-species-selector").val()]));
        currentPoke.name = $("select.edit-species-selector").val();
        currentPoke.gender = $(".edit-gender").val();
        currentPoke.item = $(".edit-item-selector").val();
        currentPoke.isCustomSet = true;
        currentPoke.ability = $(".edit-ability-selector").val();
        currentPoke.level = $(".edit-level").val();
        currentPoke.ivs = {
            "hp": $("#edit-iv-hp").val(),
            "at": $("#edit-iv-atk").val(),
            "df": $("#edit-iv-def").val(),
            "sa": $("#edit-iv-spa").val(),
            "sd": $("#edit-iv-spd").val(),
            "sp": $("#edit-iv-spe").val()
        };
        currentPoke.evs = {
            "hp": $("#edit-ev-hp").val(),
            "at": $("#edit-ev-atk").val(),
            "df": $("#edit-ev-def").val(),
            "sa": $("#edit-ev-spa").val(),
            "sd": $("#edit-ev-spd").val(),
            "sp": $("#edit-ev-spe").val()
        };
        currentPoke.location = $(".edit-location-selector").val();
        currentPoke.nature = $(".edit-nature-selector").val();
        currentPoke.moves = [];
        if ($("#edit-move1").val() !== "(No Move)") currentPoke.moves.push($("#edit-move1").val());
        if ($("#edit-move2").val() !== "(No Move)") currentPoke.moves.push($("#edit-move2").val());
        if ($("#edit-move3").val() !== "(No Move)") currentPoke.moves.push($("#edit-move3").val());
        if ($("#edit-move4").val() !== "(No Move)") currentPoke.moves.push($("#edit-move4").val());
        var set = EDITING;
        var mon = set.substring(0, set.indexOf(" ("));
	    var setName = set.substring(set.indexOf("(") + 1, set.lastIndexOf(")"));
        currentPoke.nameProp = $(".edit-nickname").val() ? $(".edit-nickname").val() : "Custom Set";
        addToDex(currentPoke);
        $("#popup-container").hide();
        if (mon !== currentPoke.name || setName !== currentPoke.nameProp) removeSet(set);
    });
});

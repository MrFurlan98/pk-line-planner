RIVAL_STARTER_1 = "";
RIVAL_STARTER_2 = "";
RIVAL_STARTER_3 = "";
RIVAL2_STARTER_1 = "";
RIVAL2_STARTER_2 = "";
RIVAL2_STARTER_3 = "";
RIVAL2_NAME = "";

NO_CALC = true;

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (searchElement, fromIndex) { // eslint-disable-line no-extend-native
		var k;
		if (this == null) {
			throw new TypeError('"this" equals null or n is undefined');
		}
		var O = Object(this);
		var len = O.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = +fromIndex || 0;
		if (Math.abs(n) === Infinity) {
			n = 0;
		}
		if (n >= len) {
			return -1;
		}
		k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
		while (k < len) {
			if (k in O && O[k] === searchElement) {
				return k;
			}
			k++;
		}
		return -1;
	};
}

function startsWith(string, target) {
	return (string || '').slice(0, target.length) === target;
}

function endsWith(string, target) {
	return (string || '').slice(-target.length) === target;
}

var LEGACY_STATS_RBY = ["hp", "at", "df", "sl", "sp"];
var LEGACY_STATS_GSC = ["hp", "at", "df", "sa", "sd", "sp"];
var LEGACY_STATS = [[], LEGACY_STATS_RBY, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC];
var HIDDEN_POWER_REGEX = /Hidden Power (\w*)/;

var CALC_STATUS = {
	'Healthy': '',
	'Paralyzed': 'par',
	'Poisoned': 'psn',
	'Badly Poisoned': 'tox',
	'Burned': 'brn',
	'Asleep': 'slp',
	'Frozen': 'frz'
};

function legacyStatToStat(st) {
	switch (st) {
	case 'hp':
		return "hp";
	case 'at':
		return "atk";
	case 'df':
		return "def";
	case 'sa':
		return "spa";
	case 'sd':
		return "spd";
	case 'sp':
		return "spe";
	case 'sl':
		return "spc";
	}
}

// input field validation
var bounds = {
	"level": [0, 100],
	"base": [1, 255],
	"evs": [0, 252],
	"ivs": [0, 31],
	"dvs": [0, 15],
	"move-bp": [0, 65535]
};
for (var bounded in bounds) {
	attachValidation(bounded, bounds[bounded][0], bounds[bounded][1]);
}
function attachValidation(clazz, min, max) {
	$("." + clazz).keyup(function () {
		validate($(this), min, max);
	});
}
function validate(obj, min, max) {
	obj.val(Math.max(min, Math.min(max, ~~obj.val())));
}

$("input:radio[name='format']").change(function () {
	var gameType = $("input:radio[name='format']:checked").val();
	if (gameType === 'Singles') {
		$("input:checkbox[name='ruin']:checked").prop("checked", false);
	}
	$(".format-specific." + gameType.toLowerCase()).each(function () {
		if ($(this).hasClass("gen-specific") && !$(this).hasClass("g" + gen)) {
			return;
		}
		$(this).show();
	});
	$(".format-specific").not("." + gameType.toLowerCase()).hide();
});

var defaultLevel = 100;

// auto-calc stats and current HP on change
$(".level").bind("keyup change", function () {
	var poke = $(this).closest(".poke-info");
	calcHP(poke);
	calcStats(poke);
});
$(".nature").bind("keyup change", function () {
	calcStats($(this).closest(".poke-info"));
});
$(".hp .base, .hp .evs, .hp .ivs").bind("keyup change", function () {
	calcHP($(this).closest(".poke-info"));
});
$(".at .base, .at .evs, .at .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'at');
});
$(".df .base, .df .evs, .df .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'df');
});
$(".sa .base, .sa .evs, .sa .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'sa');
});
$(".sd .base, .sd .evs, .sd .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'sd');
});
$(".sp .base, .sp .evs, .sp .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'sp');
});
$(".sl .base").keyup(function () {
	calcStat($(this).closest(".poke-info"), 'sl');
});
$(".at .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'at');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".df .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'df');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sa .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'sa');
	poke.find(".sd .dvs").val($(this).val());
	calcStat(poke, 'sd');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sp .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'sp');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sl .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'sl');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});

function getForcedTeraType(pokemonName) {
	if (startsWith(pokemonName, "Ogerpon-Cornerstone")) {
		return "Rock";
	} else if (startsWith(pokemonName, "Ogerpon-Hearthflame")) {
		return "Fire";
	} else if (pokemonName === "Ogerpon" || startsWith(pokemonName, "Ogerpon-Teal")) {
		return "Grass";
	} else if (startsWith(pokemonName, "Ogerpon-Wellspring")) {
		return "Water";
	} else if (startsWith(pokemonName, "Terapagos")) {
		return "Stellar";
	}
	return null;
}

function getHPDVs(poke) {
	return (~~poke.find(".at .dvs").val() % 2) * 8 +
(~~poke.find(".df .dvs").val() % 2) * 4 +
(~~poke.find(".sp .dvs").val() % 2) * 2 +
(~~poke.find(gen === 1 ? ".sl .dvs" : ".sa .dvs").val() % 2);
}

function calcStats(poke) {
	for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
		calcStat(poke, LEGACY_STATS[gen][i]);
	}
}

function calcCurrentHP(poke, max, percent, skipDraw) {
	var current = Math.round(Number(percent) * Number(max) / 100);
	poke.find(".current-hp").val(current);
	if (!skipDraw) drawHealthBar(poke, max, current);
	return current;
}
function calcPercentHP(poke, max, current, skipDraw) {
	var percent = Math.round(100 * Number(current) / Number(max));
	if (percent === 0 && current > 0) {
		percent = 1;
	} else if (percent === 100 & current < max) {
		percent = 99;
	}

	poke.find(".percent-hp").val(percent);
	if (!skipDraw) drawHealthBar(poke, max, current);
	return percent;
}
function drawHealthBar(poke, max, current) {
	var fillPercent = 100 * current / max;
	var fillColor = fillPercent > 50 ? "green" : fillPercent > 20 ? "yellow" : "red";

	var healthbar = poke.find(".hpbar");
	healthbar.addClass("hp-" + fillColor);
	var unwantedColors = ["green", "yellow", "red"];
	unwantedColors.splice(unwantedColors.indexOf(fillColor), 1);
	for (var i = 0; i < unwantedColors.length; i++) {
		healthbar.removeClass("hp-" + unwantedColors[i]);
	}
	healthbar.css("background", "linear-gradient(to right, " + fillColor + " " + fillPercent + "%, white 0%");
}
// TODO: these HP inputs should really be input type=number with min=0, step=1, constrained by max=maxHP or 100
$(".current-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, max);
	var current = $(this).val();
	calcPercentHP($(this).parent(), max, current);
});
$(".percent-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, 100);
	var percent = $(this).val();
	calcCurrentHP($(this).parent(), max, percent);
});

$(".ability").bind("keyup change", function () {
	var ability = $(this).closest(".poke-info").find(".ability").val();

	for (var i = 1; i <= 4; i++) {
		var moveSelector = ".move" + i;
		var moveHits = 3;

		var moveName = $(this).closest(".poke-info").find(moveSelector).find(".select2-chosen").text();
		var move = moves[moveName] || moves['(No Move)'];
		if (move.multiaccuracy) {
			moveHits = move.multihit;
		} else if (ability === 'Skill Link') {
			moveHits = 5;
		} else if ($(this).closest(".poke-info").find(".item").val() === 'Loaded Dice') {
			moveHits = 4;
		}
		$(this).closest(".poke-info").find(moveSelector).find(".move-hits").val(moveHits);
	}

	var TOGGLE_ABILITIES = ['Flash Fire', 'Intimidate', 'Minus', 'Plus', 'Slow Start', 'Unburden', 'Stakeout', 'Teraform Zero'];

	if (TOGGLE_ABILITIES.indexOf(ability) >= 0) {
		$(this).closest(".poke-info").find(".abilityToggle").show();
	} else {
		$(this).closest(".poke-info").find(".abilityToggle").hide();
	}
	var boostedStat = $(this).closest(".poke-info").find(".boostedStat");

	if (ability === "Protosynthesis" || ability === "Quark Drive") {
		boostedStat.show();
		autosetQP($(this).closest(".poke-info"));
	} else {
		boostedStat.val("");
		boostedStat.hide();
	}

	if (ability === "Supreme Overlord") {
		$(this).closest(".poke-info").find(".alliesFainted").show();
	} else {
		$(this).closest(".poke-info").find(".alliesFainted").val('0');
		$(this).closest(".poke-info").find(".alliesFainted").hide();

	}
});

function autosetQP(pokemon) {
	var currentWeather = $("input:radio[name='weather']:checked").val();
	var currentTerrain = $("input:checkbox[name='terrain']:checked").val() || "No terrain";

	var item = pokemon.find(".item").val();
	var ability = pokemon.find(".ability").val();
	var boostedStat = pokemon.find(".boostedStat").val();

	if (!boostedStat || boostedStat === "auto") {
		if (
			(item === "Booster Energy") ||
			(ability === "Protosynthesis" && currentWeather === "Sun") ||
			(ability === "Quark Drive" && currentTerrain === "Electric")
		) {
			pokemon.find(".boostedStat").val("auto");
		} else {
			pokemon.find(".boostedStat").val("");
		}
	}
}

$("#p1 .ability").bind("keyup change", function () {
	autosetWeather($(this).val(), 0);
	autosetTerrain($(this).val(), 0);
	autosetQP($(this).closest(".poke-info"));
});

$("input[name='weather']").change(function () {
	var allPokemon = $('.poke-info');
	allPokemon.each(function () {
		autosetQP($(this));
	});
});

function autosetWeather(ability, i) {
	switch (ability) {
		case "Drought":
			$("#sun").prop("checked", true);
			break;
		case "Drizzle":
			$("#rain").prop("checked", true);
			break;
		case "Sand Stream":
			$("#sand").prop("checked", true);
			break;
		case "Snow Warning":
			$("#hail").prop("checked", true);
			break;
		default:
			// $("input:radio[name='weather'][value='']").prop("checked", true);
			break;
	}
}

$("input[name='terrain']").change(function () {
	var allPokemon = $('.poke-info');
	allPokemon.each(function () {
		autosetQP($(this));
	});
});

var lastManualTerrain = "";
var lastAutoTerrain = ["", ""];
function autosetTerrain(ability, i) {
	var currentTerrain = $("input:checkbox[name='terrain']:checked").val() || "No terrain";
	if (lastAutoTerrain.indexOf(currentTerrain) === -1) {
		lastManualTerrain = currentTerrain;
		lastAutoTerrain[1 - i] = "";
	}
	// terrain input uses checkbox instead of radio, need to uncheck all first
	$("input:checkbox[name='terrain']:checked").prop("checked", false);
	switch (ability) {
	case "Electric Surge":
	case "Hadron Engine":
		lastAutoTerrain[i] = "Electric";
		$("#electric").prop("checked", true);
		break;
	case "Grassy Surge":
		lastAutoTerrain[i] = "Grassy";
		$("#grassy").prop("checked", true);
		break;
	case "Misty Surge":
		lastAutoTerrain[i] = "Misty";
		$("#misty").prop("checked", true);
		break;
	case "Psychic Surge":
		lastAutoTerrain[i] = "Psychic";
		$("#psychic").prop("checked", true);
		break;
	default:
		lastAutoTerrain[i] = "";
		var newTerrain = lastAutoTerrain[1 - i] !== "" ? lastAutoTerrain[1 - i] : lastManualTerrain;
		if ("No terrain" !== newTerrain) {
			$("input:checkbox[name='terrain'][value='" + newTerrain + "']").prop("checked", true);
		}
		break;
	}
}

$("#p1 .item").bind("keyup change", function () {
	autosetStatus("#p1", $(this).val());
});

function autosetStatus(p, item) {
	if (item === "Flame Orb") {
		$(p + " .status").val("Burned");
		$(p + " .status").change();
	} else if (item === "Toxic Orb") {
		$(p + " .status").val("Badly Poisoned");
		$(p + " .status").change();
	}
}

$(".status").bind("keyup change", function () {
	if ($(this).val() === 'Badly Poisoned') {
		$(this).parent().children(".toxic-counter").show();
	} else {
		$(this).parent().children(".toxic-counter").hide();
	}
});

var lockerMove = "";
// auto-update move details on select
$(".move-selector").change(function () {
	var moveName = $(this).val();
	var move = moves[moveName] || moves['(No Move)'];
	var moveGroupObj = $(this).parent();
	moveGroupObj.children(".move-bp").val(move.bp);
	/*var m = moveName.match(HIDDEN_POWER_REGEX);
	if (m) {
		var pokeObj = $(this).closest(".poke-info");
		var pokemon = createPokemon(pokeObj);
		var actual = calc.Stats.getHiddenPower(GENERATION, pokemon.ivs);
		if (actual.type !== m[1]) {
			var hpIVs = calc.Stats.getHiddenPowerIVs(GENERATION, m[1]);
			if (hpIVs && gen < 7) {
				for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
					var legacyStat = LEGACY_STATS[gen][i];
					var stat = legacyStatToStat(legacyStat);
					pokeObj.find("." + legacyStat + " .ivs").val(hpIVs[stat] !== undefined ? hpIVs[stat] : 31);
					pokeObj.find("." + legacyStat + " .dvs").val(hpIVs[stat] !== undefined ? calc.Stats.IVToDV(hpIVs[stat]) : 15);
				}
				if (gen < 3) {
					var hpDV = calc.Stats.getHPDV({
						atk: pokeObj.find(".at .ivs").val(),
						def: pokeObj.find(".df .ivs").val(),
						spe: pokeObj.find(".sp .ivs").val(),
						spc: pokeObj.find(".sa .ivs").val()
					});
					pokeObj.find(".hp .ivs").val(calc.Stats.DVToIV(hpDV));
					pokeObj.find(".hp .dvs").val(hpDV);
				}
				pokeObj.change();
				moveGroupObj.children(".move-bp").val(gen >= 6 ? 60 : 70);
			}
		} else {
			moveGroupObj.children(".move-bp").val(actual.power);
		}
	}*/
	$(this).attr('data-prev', moveName);
	moveGroupObj.children(".move-type").val(move.type);
	moveGroupObj.children(".move-cat").val(move.category);
	moveGroupObj.children(".move-crit").prop("checked", move.willCrit === true);

	var stat = move.category === 'Special' ? 'spa' : 'atk';
	var dropsStats =
		move.self && move.self.boosts && move.self.boosts[stat] && move.self.boosts[stat] < 0;
	if (Array.isArray(move.multihit) || (!isNaN(move.multihit) && move.multiaccuracy)) {
		moveGroupObj.children(".stat-drops").hide();
		moveGroupObj.children(".move-hits").empty();
		if (!isNaN(move.multihit)) {
			for (var i = 1; i <= move.multihit; i++) {
				moveGroupObj.children(".move-hits").append("<option value=" + i + ">" + i + " hits</option>");
			}
		} else {
			for (var i = 1; i <= move.multihit[1]; i++) {
				moveGroupObj.children(".move-hits").append("<option value=" + i + ">" + i + " hits</option>");
			}
		}
		moveGroupObj.children(".move-hits").show();
		var pokemon = $(this).closest(".poke-info");

		var moveHits = 3;
		if (move.multiaccuracy) {
			moveHits = move.multihit;
		} else if (pokemon.find('.ability').val() === 'Skill Link') {
			moveHits = 5;
		} else if (pokemon.find(".item").val() === 'Loaded Dice') {
			moveHits = 4;
		}

		moveGroupObj.children(".move-hits").val(moveHits);
	} else if (dropsStats) {
		moveGroupObj.children(".move-hits").hide();
		moveGroupObj.children(".stat-drops").show();
	} else {
		moveGroupObj.children(".move-hits").hide();
		moveGroupObj.children(".stat-drops").hide();
	}
	if (moveName == "Magnitude") {
		moveGroupObj.children(".present-bp, .transform").hide();
		moveGroupObj.children(".magnitude-bp").show().val(70).change();
		moveGroupObj.children(".move-bp").prop("disabled", true);
	} else if (moveName == "Present") {
		moveGroupObj.children(".magnitude-bp, .transform").hide();
		moveGroupObj.children(".present-bp").show().val(40).change();
		moveGroupObj.children(".move-bp").prop("disabled", true);
	} else if (moveName == "Transform") {
		moveGroupObj.children(".magnitude-bp, .present-bp").hide();
		moveGroupObj.children(".transform").show();
		moveGroupObj.children(".move-bp").prop("disabled", false);
	} else {
		moveGroupObj.children(".magnitude-bp, .present-bp, .transform").hide();
		moveGroupObj.children(".move-bp").prop("disabled", false);
	}
});

$(".magnitude-bp, .present-bp").on("change", function() {
	$(this).siblings(".move-bp").val($(this).val());
});

$(".transform").on("click", function() {
	var transformer = $(this).closest(".poke-info");
	var target = $(transformer.attr("id") === "p1" ? "#p2" : "#p1");
	transformer.siblings().find(".forme").parent().replaceWith(target.siblings().find(".forme").parent());
	transformer.find(".type1").val(target.find(".type1").val());
	transformer.find(".type2").val(target.find(".type2").val());
	for (i = 0; i < LEGACY_STATS[gen].length; i++) {
		var stat = LEGACY_STATS[gen][i];
		if (stat === "hp") continue;
		transformer.find("." + stat + " .evs").val(target.find("." + stat + " .evs").val());
	}
	calcStats(transformer);
	for (i = 0; i < 4; i++) {
		var move = target.find(".move" + (i + 1) + " select.move-selector").val();
		if (move.startsWith("Hidden Power")) {
			var pokemon = createPokemon(transformer);
			var ivs = {};
			for (var j = 0; j <= LEGACY_STATS[9].length; j++) {
				var s = LEGACY_STATS[9][j];
				ivs[legacyStatToStat(s)] = (pokemon.ivs && pokemon.ivs[s]) || 31;
			}
			
			var expectedType = calc.Stats.getHiddenPower(GENERATION, ivs).type;
			move = "Hidden Power " + expectedType;
		}
		setSelectValueIfValid(transformer.find(".move" + (i + 1) + " select.move-selector"), move, "(No Move)");
		transformer.find(".move" + (i + 1) + " select.move-selector").change();
	}
	transformer.find(".ability").val(target.find(".ability").val());
	transformer.find(".ability").change();
	transformer.find(".gender").parent().replaceWith(target.find(".gender").parent().clone());
	transformer.find(".gender").val(target.find(".gender").val());
});

$(".item").change(function () {
	var itemName = $(this).val();
	var $metronomeControl = $(this).closest('.poke-info').find('.metronome');
	if (itemName === "Metronome") {
		$metronomeControl.show();
	} else {
		$metronomeControl.hide();
	}

	for (var i = 1; i <= 4; i++) {
		var moveSelector = ".move" + i;
		var moveHits = 3;

		var moveName = $(this).closest(".poke-info").find(moveSelector).find(".select2-chosen").text();
		var move = moves[moveName] || moves['(No Move)'];
		if (move.multiaccuracy) {
			moveHits = move.multihit;
		} else if ($(this).closest(".poke-info").find(".ability").val() === 'Skill Link') {
			moveHits = 5;
		} else if ($(this).closest(".poke-info").find(".item").val() === 'Loaded Dice') {
			moveHits = 4;
		}
		$(this).closest(".poke-info").find(moveSelector).find(".move-hits").val(moveHits);
	}

	autosetQP($(this).closest(".poke-info"));
});

// auto-update set details on select
$(".set-selector").change(function () {
	NO_CALC = true;
	var fullSetName = $(this).val();
	var pokemonName = fullSetName.substring(0, fullSetName.indexOf(" ("));
	var setName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")"));
	if ($(this).closest("#p2").length) {
		var previousTrainer = CURRENT_TRAINER;
		CURRENT_TRAINER = setName.split(" (")[0];
		if (CURRENT_TRAINER !== previousTrainer) {
			if (CURRENT_TRAINER in partyOrder) localStorage.lastTrainer = CURRENT_TRAINER;
			var weather = "clear";
			for (var newWeather in flags.weather) {
				if (flags.weather[newWeather].includes(CURRENT_TRAINER)) {
					weather = newWeather;
					break;
				}
			}
			if (weather) $(`#${weather}`).prop("checked", true).change();
			$("#gravity").prop("checked", CURRENT_TRAINER == "Champion Cynthia");
			var enemyContainer = $("#enemy");
			var enemyHtml = ""
			var enemyTagContainer = $("#enemy-tag");
			var enemyTagHtml = ""
			var tagContainer = $("#tag-partner");
			var tagHtml = "";
			var switchAIContainer = $(".switch-ai-container");
			var switchAIHtml = "";
			$(".enemy-tag, .tag-partner").hide();
			if (getTagBattle(CURRENT_TRAINER)) {
				$("#doubles-format").prop("checked", true);
				$(".enemy-tag, .tag-partner").show();
				var tagBattle = getTagBattle(CURRENT_TRAINER);
				var enemyParty = getTrainerPokemon(tagBattle.enemy1);
				for (var i in enemyParty) {
					var mon = enemyParty[i].substring(0, enemyParty[i].indexOf(" ("));
					var species = SPECIES[toID(mon)];
					enemyHtml += `<img class="pokemon-icon" src="/img/dex/icon/species/${species.id}.png" data-set="${enemyParty[i]}" data-side="p2" title="${enemyParty[i]}">`;
				}
				var enemyTagParty = getTrainerPokemon(tagBattle.enemy2);
				for (var i in enemyTagParty) {
					var mon = enemyTagParty[i].substring(0, enemyTagParty[i].indexOf(" ("));
					var species = SPECIES[toID(mon)];
					enemyTagHtml += `<img class="pokemon-icon" src="/img/dex/icon/species/${species.id}.png" data-set="${enemyTagParty[i]}" data-side="p2" title="${enemyTagParty[i]}">`;
				}
				var tagParty = getTrainerPokemon(tagBattle.partner);
				for (var i in tagParty) {
					var mon = tagParty[i].substring(0, tagParty[i].indexOf(" ("));
					var species = SPECIES[toID(mon)];
					tagHtml += `<img class="pokemon-icon" src="/img/dex/icon/species/${species.id}.png" data-set="${tagParty[i]}" data-side="p1" title="${tagParty[i]}">`;
				}
			} else if (getDoubleBattle(CURRENT_TRAINER)) {
				$("#doubles-format").prop("checked", true);
				$(".enemy-tag").show();
				var doubleBattle = getDoubleBattle(CURRENT_TRAINER);
				var enemyParty = getTrainerPokemon(doubleBattle.enemy1);
				for (var i in enemyParty) {
					var mon = enemyParty[i].substring(0, enemyParty[i].indexOf(" ("));
					var species = SPECIES[toID(mon)];
					enemyHtml += `<img class="pokemon-icon" src="/img/dex/icon/species/${species.id}.png" data-set="${enemyParty[i]}" data-side="p2" title="${enemyParty[i]}">`;
				}
				var enemyTagParty = getTrainerPokemon(doubleBattle.enemy2);
				for (var i in enemyTagParty) {
					var mon = enemyTagParty[i].substring(0, enemyTagParty[i].indexOf(" ("));
					var species = SPECIES[toID(mon)];
					enemyTagHtml += `<img class="pokemon-icon" src="/img/dex/icon/species/${species.id}.png" data-set="${enemyTagParty[i]}" data-side="p2" title="${enemyTagParty[i]}">`;
				}
			} else if (CURRENT_TRAINER in flags.battleType.trueDouble) {
				$("#doubles-format").prop("checked", true);
				var enemyParty = getTrainerPokemon(CURRENT_TRAINER);
				for (var i in enemyParty) {
					var mon = enemyParty[i].substring(0, enemyParty[i].indexOf(" ("));
					var species = SPECIES[toID(mon)];
					enemyHtml += `<img class="pokemon-icon" src="/img/dex/icon/species/${species.id}.png" data-set="${enemyParty[i]}" data-side="p2" title="${enemyParty[i]}">`;
				}
			} else {
				$("#singles-format").prop("checked", true);
				var enemyParty = getTrainerPokemon(CURRENT_TRAINER);
				for (var i in enemyParty) {
					var mon = enemyParty[i].substring(0, enemyParty[i].indexOf(" ("));
					var species = SPECIES[toID(mon)];
					enemyHtml += `<img class="pokemon-icon" src="/img/dex/icon/species/${species.id}.png" data-set="${enemyParty[i]}" data-side="p2" title="${enemyParty[i]}">`;
				}
			}
			enemyContainer.html(enemyHtml);
			enemyTagContainer.html(enemyTagHtml);
			tagContainer.html(tagHtml);
			updateAIFlags(CURRENT_TRAINER, tagBattle, doubleBattle);
			var currentTrainerParty = getTrainerPokemon(CURRENT_TRAINER);
			for (var i in currentTrainerParty) {
				var mon = currentTrainerParty[i].substring(0, currentTrainerParty[i].indexOf(" ("));
				var species = SPECIES[toID(mon)];
				switchAIHtml += `<span class="switching-from" data-set="${currentTrainerParty[i]}"><img class="pokemon-icon" src="/img/dex/icon/species/${species.id}.png" title="${currentTrainerParty[i]}"><span class="baiting"></span><span class="xp"></span></span>`;
			}
			switchAIContainer.html(switchAIHtml);
			$("#enemy .pokemon-icon, #enemy-tag .pokemon-icon, #tag-partner .pokemon-icon").on({
				click: function() {
					loadSet($(this).attr("data-set"), $(this).attr("data-side"));
				},
				drag: pickup,
				drop: setDrop
			});
			$(".switch-ai .pokemon-icon").on({
				click: function() {
					// if ($(this).closest(".switching-from").hasClass("dead")) $(this).closest(".switching-from").removeClass("dead");
					// else $(this).closest(".switching-from").addClass("dead");
					// Temp, until switch AI is in
					if ($(this).closest(".switching-from").hasClass("dead")) $(this).closest(".switching-from").removeClass("dead");
					else $(this).closest(".switching-from").addClass("dead");
				},
				dragstart: function(e) {
					e.preventDefault();
				}
			});
			$("#previous-trainer, #next-trainer").prop("disabled", true);
			if (getTrainerNavList().includes(CURRENT_TRAINER)) {
				if (getTrainerNavList().indexOf(CURRENT_TRAINER) > 0) $("#previous-trainer").prop("disabled", false);
				if (getTrainerNavList().indexOf(CURRENT_TRAINER) < getTrainerNavList().length - 1) $("#next-trainer").prop("disabled", false);
			}
		}
	}
	var pokemon = pokedex[pokemonName];
	if (pokemon) {
		var pokeObj = $(this).closest(".poke-info");
		if (stickyMoves.getSelectedSide() === pokeObj.prop("id")) {
			stickyMoves.clearStickyMove();
		}
		pokeObj.find(".boostedStat").val("");
		pokeObj.find(".type1").val(pokemon.types[0]);
		pokeObj.find(".type2").val(pokemon.types[1]);
		pokeObj.find(".hp .base").val(pokemon.bs.hp);
		var i;
		for (i = 0; i < LEGACY_STATS[gen].length; i++) {
			pokeObj.find("." + LEGACY_STATS[gen][i] + " .base").val(pokemon.bs[LEGACY_STATS[gen][i]]);
		}
		pokeObj.find(".boost").val(0);
		pokeObj.find(".percent-hp").val(100);
		pokeObj.find(".status").val("Healthy");
		$(".status").change();
		var moveObj;
		var abilityObj = pokeObj.find(".ability");
		var itemObj = pokeObj.find(".item");
		var regSets = pokemonName in setdex && setName in setdex[pokemonName];

		if (regSets) {
			// We don't want to correct Hidden Power, as PK adds its own custom Hidden Power moves that can be used with any IV combination
			// var set = correctHiddenPower(setdex[pokemonName][setName]);
			var set = setdex[pokemonName][setName];
			pokeObj.find(".gender").val(set.gender === undefined ? "" : set.gender);
			pokeObj.find(".level").val(set.level === undefined ? 100 : set.level);
			for (i = 0; i < LEGACY_STATS[gen].length; i++) {
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .ivs").val(
					(set.ivs && set.ivs[LEGACY_STATS[gen][i]] !== undefined) ? set.ivs[LEGACY_STATS[gen][i]] : 31);
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .evs").val(
					(set.evs && set.evs[LEGACY_STATS[gen][i]] !== undefined) ? set.evs[LEGACY_STATS[gen][i]] : 0);
			}
			setSelectValueIfValid(pokeObj.find(".nature"), set.nature, "Hardy");
			var abilityFallback = (typeof pokemon.abilities !== "undefined") ? pokemon.abilities[0] : "";
			setSelectValueIfValid(abilityObj, set.ability, abilityFallback);
			setSelectValueIfValid(itemObj, set.item, "");
			for (i = 0; i < 4; i++) {
				moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
				moveObj.attr('data-prev', moveObj.val());
				setSelectValueIfValid(moveObj, set.moves[i], "(No Move)");
				moveObj.change();
			}
		} else {
			pokeObj.find(".level").val(defaultLevel);
			pokeObj.find(".hp .ivs").val(31);
			for (i = 0; i < LEGACY_STATS[gen].length; i++) {
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .ivs").val(31);
			}
			pokeObj.find(".nature").val("Hardy");
			setSelectValueIfValid(abilityObj, pokemon.abilities[0], "");
			itemObj.val("");
			for (i = 0; i < 4; i++) {
				moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
				moveObj.attr('data-prev', moveObj.val());
				moveObj.val("(No Move)");
				moveObj.change();
			}
		}
		var formeObj = $(this).siblings().find(".forme").parent();
		itemObj.prop("disabled", false);
		var baseForme;
		if (pokemon.baseSpecies && pokemon.baseSpecies !== pokemon.name) {
			baseForme = pokedex[pokemon.baseSpecies];
		}
		if (pokemon.otherFormes) {
			showFormes(formeObj, pokemonName, pokemon, pokemonName);
		} else if (baseForme && baseForme.otherFormes) {
			showFormes(formeObj, pokemonName, baseForme, pokemon.baseSpecies);
		} else {
			formeObj.hide();
		}
		calcHP(pokeObj);
		calcStats(pokeObj);
		abilityObj.change();
		itemObj.change();
		if (pokemon.gender === "N") {
			pokeObj.find(".gender").parent().hide();
			pokeObj.find(".gender").val("");
		} else pokeObj.find(".gender").parent().show();
	}
	NO_CALC = false;
});

function formatMovePool(moves) {
	var formatted = [];
	for (var i = 0; i < moves.length; i++) {
		formatted.push(isKnownDamagingMove(moves[i]) ? moves[i] : '<i>' + moves[i] + '</i>');
	}
	return formatted.join(', ');
}

function isKnownDamagingMove(move) {
	var m = GENERATION.moves.get(calc.toID(move));
	return m && m.basePower;
}

function selectMovesFromRandomOptions(moves) {
	var selected = [];

	var nonDamaging = [];
	for (var i = 0; i < moves.length; i++) {
		if (isKnownDamagingMove(moves[i])) {
			selected.push(moves[i]);
			if (selected.length >= 4) break;
		} else {
			nonDamaging.push(moves[i]);
		}
	}

	while (selected.length < 4 && nonDamaging.length) {
		selected.push(nonDamaging.pop());
	}

	return selected;
}

function showFormes(formeObj, pokemonName, pokemon, baseFormeName) {
	var formes = pokemon.otherFormes.slice();
	formes.unshift(baseFormeName);

	var defaultForme = formes.indexOf(pokemonName);
	if (defaultForme < 0) defaultForme = 0;

	var formeOptions = getSelectOptions(formes, false, defaultForme);
	formeObj.children("select").find("option").remove().end().append(formeOptions).change();
	formeObj.show();
}

function setSelectValueIfValid(select, value, fallback) {
	select.val(!value ? fallback : select.children("option[value='" + value + "']").length ? value : fallback);
}

$(".forme").change(function () {
	var altForme = pokedex[$(this).val()],
		container = $(this).closest(".info-group").siblings(),
		fullSetName = container.find(".select2-chosen").first().text(),
		pokemonName = fullSetName.substring(0, fullSetName.indexOf(" (")),
		setName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")"));

	$(this).parent().siblings().find(".type1").val(altForme.types[0]);
	$(this).parent().siblings().find(".type2").val(altForme.types[1] ? altForme.types[1] : "");
	for (var i = 0; i < LEGACY_STATS[9].length; i++) {
		var baseStat = container.find("." + LEGACY_STATS[9][i]).find(".base");
		baseStat.val(altForme.bs[LEGACY_STATS[9][i]]);
		baseStat.keyup();
	}
	if (
		(startsWith($(this).val(), "Ogerpon") && endsWith($(this).val(), "Tera")) || $(this).val() === "Terapagos-Stellar"
	) {
		$(this).parent().siblings().find(".teraToggle").prop("checked", true);
	}
	var pokemonSets = setdex[pokemonName];
	var chosenSet = pokemonSets && pokemonSets[setName];
	var greninjaSet = $(this).val().indexOf("Greninja") !== -1;
	var isAltForme = $(this).val() !== pokemonName;
	if (isAltForme && abilities.indexOf(altForme.abilities[0]) !== -1 && !greninjaSet) {
		container.find(".ability").val(altForme.abilities[0]);
	} else if (greninjaSet) {
		$(this).parent().find(".ability");
	} else if (chosenSet) {
		container.find(".abilities").val(chosenSet.ability);
	}
	var forcedTeraType = getForcedTeraType($(this).val());
	if (forcedTeraType) {
		$(this).parent().siblings().find(".teraType").val(forcedTeraType);
	}
	container.find(".ability").keyup();
	if (startsWith($(this).val(), "Ogerpon-") && !startsWith($(this).val(), "Ogerpon-Teal")) {
		container.find(".item").val($(this).val().split("-")[1] + " Mask").keyup();
	} else {
		container.find(".item").prop("disabled", false);
	}
});

function correctHiddenPower(pokemon) {
	// After Gen 7 bottlecaps means you can have a HP without perfect IVs
	// Level 100 is elided from sets so if its undefined its level 100
	if (gen >= 7 && (!pokemon.level || pokemon.level >= 100)) return pokemon;

	// Convert the legacy stats table to a useful one, and also figure out if all are maxed
	var ivs = {};
	var maxed = true;
	for (var i = 0; i <= LEGACY_STATS[9].length; i++) {
		var s = LEGACY_STATS[9][i];
		var iv = ivs[legacyStatToStat(s)] = (pokemon.ivs && pokemon.ivs[s]) || 31;
		if (iv !== 31) maxed = false;
	}

	var expected = calc.Stats.getHiddenPower(GENERATION, ivs);
	for (var i = 0; i < pokemon.moves.length; i++) {
		var m = pokemon.moves[i].match(HIDDEN_POWER_REGEX);
		if (!m) continue;
		// The Pokemon has Hidden Power and is not maxed but the types don't match we don't
		// want to attempt to reconcile the user's IVs so instead just correct the HP type
		if (!maxed && expected.type !== m[1]) {
			pokemon.moves[i] = "Hidden Power " + expected.type;
		} else {
			// Otherwise, use the default preset hidden power IVs that PS would use
			var hpIVs = calc.Stats.getHiddenPowerIVs(GENERATION, m[1]);
			if (!hpIVs) continue; // some impossible type was specified, ignore
			pokemon.ivs = pokemon.ivs || {hp: 31, at: 31, df: 31, sa: 31, sd: 31, sp: 31};
			pokemon.dvs = pokemon.dvs || {hp: 15, at: 15, df: 15, sa: 15, sd: 15, sp: 15};
			for (var stat in hpIVs) {
				pokemon.ivs[calc.Stats.shortForm(stat)] = hpIVs[stat];
				pokemon.dvs[calc.Stats.shortForm(stat)] = calc.Stats.IVToDV(hpIVs[stat]);
			}
			if (gen < 3) {
				pokemon.dvs.hp = calc.Stats.getHPDV({
					atk: pokemon.ivs.at || 31,
					def: pokemon.ivs.df || 31,
					spe: pokemon.ivs.sp || 31,
					spc: pokemon.ivs.sa || 31
				});
				pokemon.ivs.hp = calc.Stats.DVToIV(pokemon.dvs.hp);
			}
		}
	}
	return pokemon;
}

function createPokemon(pokeInfo) {
	if (typeof pokeInfo === "string") { // in this case, pokeInfo is the id of an individual setOptions value whose moveset's tier matches the selected tier(s)
		var name = pokeInfo.substring(0, pokeInfo.indexOf(" ("));
		var setName = pokeInfo.substring(pokeInfo.indexOf("(") + 1, pokeInfo.lastIndexOf(")"));
		var set = setdex[name][setName];

		var ivs = {};
		var evs = {};
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var legacyStat = LEGACY_STATS[gen][i];
			var stat = legacyStatToStat(legacyStat);

			ivs[stat] = (gen >= 3 && set.ivs && typeof set.ivs[legacyStat] !== "undefined") ? set.ivs[legacyStat] : 31;
			evs[stat] = (set.evs && typeof set.evs[legacyStat] !== "undefined") ? set.evs[legacyStat] : 0;
		}
		var moveNames = set.moves;

		var pokemonMoves = [];
		for (var i = 0; i < 4; i++) {
			var moveName = moveNames[i];
			pokemonMoves.push(new calc.Move(gen, moves[moveName] ? moveName : "(No Move)", {ability: ability, item: item}));
		}

		return new calc.Pokemon(gen, name, {
			level: set.level,
			gender: set.gender ? getGender(set.gender) : "N",
			ability: set.ability,
			abilityOn: true,
			item: set.item && typeof set.item !== "undefined" && (set.item === "Eviolite" || set.item.indexOf("ite") < 0) ? set.item : "",
			nature: set.nature,
			ivs: ivs,
			evs: evs,
			moves: pokemonMoves
		});
	} else {
		var setName = pokeInfo.find("input.set-selector").val();
		var name;
		if (setName.indexOf("(") === -1) {
			name = setName;
		} else {
			var pokemonName = setName.substring(0, setName.indexOf(" ("));
			var species = pokedex[pokemonName];
			name = (species.otherFormes || (species.baseSpecies && species.baseSpecies !== pokemonName)) ? pokeInfo.find(".forme").val() : pokemonName;
		}

		var baseStats = {};
		var ivs = {};
		var evs = {};
		var boosts = {};
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var stat = legacyStatToStat(LEGACY_STATS[gen][i]);
			baseStats[stat === 'spc' ? 'spa' : stat] = ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .base").val();
			ivs[stat] = gen > 2 ? ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .ivs").val() : ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .dvs").val() * 2 + 1;
			evs[stat] = ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .evs").val();
			boosts[stat] = ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .boost").val();
		}
		if (gen === 1) baseStats.spd = baseStats.spa;

		var ability = pokeInfo.find(".ability").val();
		var item = pokeInfo.find(".item").val();
		var isDynamaxed = pokeInfo.find(".max").prop("checked");
		var teraType = pokeInfo.find(".teraToggle").is(":checked") ? pokeInfo.find(".teraType").val() : undefined;
		var opts = {
			ability: ability,
			item: item,
			isDynamaxed: isDynamaxed,
			teraType: teraType,
			species: name,
		};
		pokeInfo.isDynamaxed = isDynamaxed;
		calcHP(pokeInfo);
		var curHP = ~~pokeInfo.find(".current-hp").val();
		// FIXME the Pokemon constructor expects non-dynamaxed HP
		if (isDynamaxed) curHP = Math.floor(curHP / 2);
		var types = [pokeInfo.find(".type1").val(), pokeInfo.find(".type2").val()];
		return new calc.Pokemon(gen, name, {
			level: ~~pokeInfo.find(".level").val(),
			ability: ability,
			abilityOn: pokeInfo.find(".abilityToggle").is(":checked"),
			item: item,
			gender: pokeInfo.find(".gender").is(":visible") ? getGender(pokeInfo.find(".gender").val()) : "N",
			nature: pokeInfo.find(".nature").val(),
			ivs: ivs,
			evs: evs,
			isDynamaxed: isDynamaxed,
			isSaltCure: pokeInfo.find(".saltcure").is(":checked"),
			alliesFainted: parseInt(pokeInfo.find(".alliesFainted").val()),
			boostedStat: pokeInfo.find(".boostedStat").val() || undefined,
			teraType: teraType,
			boosts: boosts,
			curHP: curHP,
			status: CALC_STATUS[pokeInfo.find(".status").val()],
			toxicCounter: pokeInfo.find(".status").val() === 'Badly Poisoned' ? ~~pokeInfo.find(".toxic-counter").val() : 0,
			moves: [
				getMoveDetails(pokeInfo.find(".move1"), opts),
				getMoveDetails(pokeInfo.find(".move2"), opts),
				getMoveDetails(pokeInfo.find(".move3"), opts),
				getMoveDetails(pokeInfo.find(".move4"), opts),
			],
			overrides: {
				baseStats: baseStats,
				types: types
			}
		});
	}
}

function getGender(gender) {
	if (!gender || gender === 'genderless' || gender === 'N') return 'N';
	if (gender.toLowerCase() === 'male' || gender === 'M') return 'M';
	return 'F';
}

function getMoveDetails(moveInfo, opts) {
	var moveName = moveInfo.find("select.move-selector").val();
	var isZMove = gen > 6 && moveInfo.find("input.move-z").prop("checked");
	var isCrit = moveInfo.find(".move-crit").prop("checked");
	var isStellarFirstUse = moveInfo.find(".move-stellar").prop("checked");
	var hits = +moveInfo.find(".move-hits").val();
	var timesUsed = +moveInfo.find(".stat-drops").val();
	var timesUsedWithMetronome = moveInfo.find(".metronome").is(':visible') ? +moveInfo.find(".metronome").val() : 1;
	var overrides = {
		basePower: +moveInfo.find(".move-bp").val(),
		type: moveInfo.find(".move-type").val()
	};
	if (moveName === 'Tera Blast') {
		// custom logic for stellar type tera blast
		var isStellar = opts.teraType === 'Stellar';
		var statDrops = moveInfo.find('.stat-drops');
		var dropsStats = statDrops.is(':visible');
		if (isStellar !== dropsStats) {
			// update stat drop dropdown here
			if (isStellar) statDrops.show(); else statDrops.hide();
		}
		if (isStellar) overrides.self = {boosts: {atk: -1, spa: -1}};
	}
	if (gen >= 4) overrides.category = moveInfo.find(".move-cat").val();
	return new calc.Move(gen, moveName, {
		ability: opts.ability, item: opts.item, useZ: isZMove, species: opts.species, isCrit: isCrit, hits: hits,
		isStellarFirstUse: isStellarFirstUse, timesUsed: timesUsed, timesUsedWithMetronome: timesUsedWithMetronome,
		overrides: overrides, useMax: opts.isDynamaxed
	});
}

function createField() {
	var gameType = $("input:radio[name='format']:checked").val();
	var isBeadsOfRuin = $("#beads").prop("checked");
	var isTabletsOfRuin = $("#tablets").prop("checked");
	var isSwordOfRuin = $("#sword").prop("checked");
	var isVesselOfRuin = $("#vessel").prop("checked");
	var isMagicRoom = $("#magicroom").prop("checked");
	var isWonderRoom = $("#wonderroom").prop("checked");
	var isGravity = $("#gravity").prop("checked");
	var isSR = [$("#srL").prop("checked"), $("#srR").prop("checked")];
	var weather;
	var spikes;
	if (gen === 2) {
		spikes = [$("#gscSpikesL").prop("checked") ? 1 : 0, $("#gscSpikesR").prop("checked") ? 1 : 0];
		weather = $("input:radio[name='gscWeather']:checked").val();
	} else {
		weather = $("input:radio[name='weather']:checked").val();
		spikes = [~~$("input:radio[name='spikesL']:checked").val(), ~~$("input:radio[name='spikesR']:checked").val()];
	}
	var steelsurge = [$("#steelsurgeL").prop("checked"), $("#steelsurgeR").prop("checked")];
	var vinelash = [$("#vinelashL").prop("checked"), $("#vinelashR").prop("checked")];
	var wildfire = [$("#wildfireL").prop("checked"), $("#wildfireR").prop("checked")];
	var cannonade = [$("#cannonadeL").prop("checked"), $("#cannonadeR").prop("checked")];
	var volcalith = [$("#volcalithL").prop("checked"), $("#volcalithR").prop("checked")];
	var terrain = ($("input:checkbox[name='terrain']:checked").val()) ? $("input:checkbox[name='terrain']:checked").val() : "";
	var isReflect = [$("#reflectL").prop("checked"), $("#reflectR").prop("checked")];
	var isLightScreen = [$("#lightScreenL").prop("checked"), $("#lightScreenR").prop("checked")];
	var isProtected = [$("#protectL").prop("checked"), $("#protectR").prop("checked")];
	var isSeeded = [$("#leechSeedL").prop("checked"), $("#leechSeedR").prop("checked")];
	var isForesight = [$("#foresightL").prop("checked"), $("#foresightR").prop("checked")];
	var isHelpingHand = [$("#helpingHandL").prop("checked"), $("#helpingHandR").prop("checked")];
	var isTailwind = [$("#tailwindL").prop("checked"), $("#tailwindR").prop("checked")];
	var isFlowerGift = [$("#flowerGiftL").prop("checked"), $("#flowerGiftR").prop("checked")];
	var isFriendGuard = [$("#friendGuardL").prop("checked"), $("#friendGuardR").prop("checked")];
	var isAuroraVeil = [$("#auroraVeilL").prop("checked"), $("#auroraVeilR").prop("checked")];
	var isBattery = [$("#batteryL").prop("checked"), $("#batteryR").prop("checked")];
	var isPowerSpot = [$("#powerSpotL").prop("checked"), $("#powerSpotR").prop("checked")];
	// TODO: support switching in as well!
	var isSwitchingOut = [$("#switchingL").prop("checked"), $("#switchingR").prop("checked")];

	var createSide = function (i) {
		return new calc.Side({
			spikes: spikes[i],
			isSR: isSR[i],
			steelsurge: steelsurge[i],
			vinelash: vinelash[i],
			wildfire: wildfire[i],
			cannonade: cannonade[i],
			volcalith: volcalith[i],
			isReflect: isReflect[i],
			isLightScreen: isLightScreen[i],
			isProtected: isProtected[i],
			isSeeded: isSeeded[i],
			isForesight: isForesight[i],
			isTailwind: isTailwind[i],
			isHelpingHand: isHelpingHand[i],
			isFlowerGift: isFlowerGift[i],
			isFriendGuard: isFriendGuard[i],
			isAuroraVeil: isAuroraVeil[i],
			isBattery: isBattery[i],
			isPowerSpot: isPowerSpot[i],
			isSwitching: isSwitchingOut[i] ? 'out' : undefined
		});
	};
	return new calc.Field({
		gameType: gameType,
		terrain: terrain,
		isBeadsOfRuin: isBeadsOfRuin,
		isTabletsOfRuin: isTabletsOfRuin,
		isSwordOfRuin: isSwordOfRuin,
		isVesselOfRuin: isVesselOfRuin,
		weather: weather,
		isMagicRoom: isMagicRoom,
		isWonderRoom: isWonderRoom,
		isGravity: isGravity,
		attackerSide: createSide(0),
		defenderSide: createSide(1)
	});
}

function calcHP(poke) {
	var total = calcStat(poke, "hp");
	var $maxHP = poke.find(".max-hp");

	var prevMaxHP = Number($maxHP.attr('data-prev')) || total;
	var $currentHP = poke.find(".current-hp");
	var prevCurrentHP = $currentHP.attr('data-set') ? Math.min(Number($currentHP.val()), prevMaxHP) : prevMaxHP;
	// NOTE: poke.find(".percent-hp").val() is a rounded value!
	var prevPercentHP = 100 * prevCurrentHP / prevMaxHP;

	$maxHP.text(total);
	$maxHP.attr('data-prev', total);

	var newCurrentHP = calcCurrentHP(poke, total, prevPercentHP);
	calcPercentHP(poke, total, newCurrentHP);

	$currentHP.attr('data-set', true);
}

function calcStat(poke, StatID) {
	var stat = poke.find("." + StatID);
	var base = ~~stat.find(".base").val();
	var level = ~~poke.find(".level").val();
	var nature, ivs, evs;
	if (gen < 3) {
		ivs = ~~stat.find(".dvs").val() * 2;
		evs = 252;
	} else {
		ivs = ~~stat.find(".ivs").val();
		evs = ~~stat.find(".evs").val();
		if (StatID !== "hp") nature = poke.find(".nature").val();
	}
	// Shedinja still has 1 max HP during the effect even if its Dynamax Level is maxed (DaWoblefet)
	var total = calc.calcStat(gen, legacyStatToStat(StatID), base, ivs, evs, level, nature);
	if (gen > 7 && StatID === "hp" && poke.isDynamaxed && total !== 1) {
		total *= 2;
	}
	stat.find(".total").text(total);
	return total;
}

var GENERATION = {
	'1': 1, 'rb': 1, 'rby': 1,
	'2': 2, 'gs': 2, 'gsc': 2,
	'3': 3, 'rs': 3, 'rse': 3, 'frlg': 3, 'adv': 3,
	'4': 4, 'dp': 4, 'dpp': 4, 'hgss': 4,
	'5': 5, 'bw': 5, 'bw2': 5, 'b2w2': 5,
	'6': 6, 'xy': 6, 'oras': 6,
	'7': 7, 'sm': 7, 'usm': 7, 'usum': 7,
	'8': 8, 'ss': 8,
	'9': 9, 'sv': 9
};

var SETDEX = [
	{},
	{},
	{},
	{},
	typeof SETDEX_PK === 'undefined' ? {} : SETDEX_PK,
	{},
	{},
	{},
	{},
	{},
];
var gen, genWasChanged, notation, pokedex, setdex, partyOrder, flags, typeChart, moves, abilities, items, calcHP, calcStat, GENERATION;

$(".gen").change(function () {
	/*eslint-disable */
	gen = ~~$(this).val() || 4;
	GENERATION = calc.Generations.get(gen);
	genWasChanged = true;
	/* eslint-enable */
	// declaring these variables with var here makes z moves not work; TODO
	pokedex = calc.SPECIES[gen];
	setdex = SETDEX[gen];
	partyOrder = PARTY_ORDER_PK;
	flags = FLAGS_PK;
	aiFlags = TRAINER_AI_FLAGS_PK;
	typeChart = calc.TYPE_CHART[gen];
	moves = calc.MOVES[gen];
	items = calc.ITEMS[gen];
	abilities = calc.ABILITIES[gen];
	clearField();
	$("#importedSets").prop("checked", false);
	loadDefaultLists();
	$(".gen-specific.g" + gen).show();
	$(".gen-specific").not(".g" + gen).hide();
	var typeOptions = getSelectOptions(Object.keys(typeChart));
	$("select.type1, select.move-type").find("option").remove().end().append(typeOptions);
	$("select.teraType").find("option").remove().end().append(getSelectOptions(Object.keys(typeChart).slice(1)));
	$("select.type2").find("option").remove().end().append("<option value=\"\">(none)</option>" + typeOptions);
	var moveOptions = getSelectOptions(Object.keys(moves), true);
	$("select.move-selector").find("option").remove().end().append(moveOptions);
	var abilityOptions = getSelectOptions(abilities, true);
	$("select.ability").find("option").remove().end().append("<option value=\"\">(other)</option>" + abilityOptions);
	var itemOptions = getSelectOptions(items, true);
	$("select.item").find("option").remove().end().append("<option value=\"\">(none)</option>" + itemOptions);

	// $(".set-selector").val(getFirstValidSetOption().id);
	// $(".set-selector").change();
});

function getFirstValidSetOption() {
	var sets = getSetOptions();
	// NB: The first set is never valid, so we start searching after it.
	for (var i = 1; i < sets.length; i++) {
		if (sets[i].id && sets[i].id.indexOf('(Blank Set)') === -1) return sets[i];
	}
	return undefined;
}

$(".notation").change(function () {
	notation = $(this).val();
});

function clearField() {
	$("#singles-format").prop("checked", true);
	$("#clear").prop("checked", true);
	$("#gravity").prop("checked", false);
	$("#srL").prop("checked", false);
	$("#srR").prop("checked", false);
	$("#spikesL0").prop("checked", true);
	$("#spikesR0").prop("checked", true);
	$("#reflectL").prop("checked", false);
	$("#reflectR").prop("checked", false);
	$("#lightScreenL").prop("checked", false);
	$("#lightScreenR").prop("checked", false);
	$("#protectL").prop("checked", false);
	$("#protectR").prop("checked", false);
	$("#leechSeedL").prop("checked", false);
	$("#leechSeedR").prop("checked", false);
	$("#foresightL").prop("checked", false);
	$("#foresightR").prop("checked", false);
	$("#helpingHandL").prop("checked", false);
	$("#helpingHandR").prop("checked", false);
	$("#tailwindL").prop("checked", false);
	$("#tailwindR").prop("checked", false);
	$("#flowerGiftL").prop("checked", false);
	$("#flowerGiftR").prop("checked", false);
	$("#switchingL").prop("checked", false);
	$("#switchingR").prop("checked", false);
	$("input:checkbox[name='terrain']").prop("checked", false);
}

function getSetOptions(sets) {
	var setsHolder = sets;
	if (setsHolder === undefined) {
		setsHolder = pokedex;
	}
	var pokeNames = Object.keys(setsHolder);
	pokeNames.sort();
	var setOptions = [];
	for (var i = 0; i < pokeNames.length; i++) {
		var pokeName = pokeNames[i];
		setOptions.push({
			pokemon: pokeName,
			text: pokeName
		});
		if (pokeName in setdex) {
			var setNames = Object.keys(setdex[pokeName]).sort((a, b) => Object.keys(partyOrder).indexOf(a.split(" (")[0]) - Object.keys(partyOrder).indexOf(b.split(" (")[0]));
			for (var j = 0; j < setNames.length; j++) {
				var setName = setNames[j];
				setOptions.push({
					pokemon: pokeName,
					set: setName,
					text: pokeName + " (" + setName + ")",
					id: pokeName + " (" + setName + ")",
					isCustom: setdex[pokeName][setName].isCustomSet,
					nickname: setdex[pokeName][setName].nickname || ""
				});
			}
		}
		setOptions.push({
			pokemon: pokeName,
			set: "Blank Set",
			text: pokeName + " (Blank Set)",
			id: pokeName + " (Blank Set)"
		});
	}
	return setOptions;
}

function getSelectOptions(arr, sort, defaultOption) {
	if (sort) {
		arr.sort();
	}
	var r = '';
	for (var i = 0; i < arr.length; i++) {
		r += '<option value="' + arr[i] + '" ' + (defaultOption === i ? 'selected' : '') + '>' + arr[i] + '</option>';
	}
	return r;
}
var stickyMoves = (function () {
	var lastClicked = 'resultMoveL1';
	$(".result-move").click(function () {
		if (this.id === lastClicked) {
			$(this).toggleClass("locked-move");
		} else {
			$('.locked-move').removeClass('locked-move');
		}
		lastClicked = this.id;
	});

	return {
		clearStickyMove: function () {
			lastClicked = null;
			$('.locked-move').removeClass('locked-move');
		},
		setSelectedMove: function (slot) {
			lastClicked = slot;
		},
		getSelectedSide: function () {
			if (lastClicked) {
				if (lastClicked.indexOf('resultMoveL') !== -1) {
					return 'p1';
				} else if (lastClicked.indexOf('resultMoveR') !== -1) {
					return 'p2';
				}
			}
			return null;
		}
	};
})();

function isPokeInfoGrounded(pokeInfo) {
	var teraType = pokeInfo.find(".teraToggle").is(":checked") ? pokeInfo.find(".teraType").val() : undefined;
	return $("#gravity").prop("checked") || (
		  teraType ? teraType !== "Flying" : pokeInfo.find(".type1").val() !== "Flying" &&
        teraType ? teraType !== "Flying" : pokeInfo.find(".type2").val() !== "Flying" &&
        pokeInfo.find(".ability").val() !== "Levitate" &&
        pokeInfo.find(".item").val() !== "Air Balloon"
	);
}

function getTerrainEffects() {
	var className = $(this).prop("className");
	className = className.substring(0, className.indexOf(" "));
	switch (className) {
	case "type1":
	case "type2":
	case "teraType":
	case "teraToggle":
	case "item":
		var id = $(this).closest(".poke-info").prop("id");
		var terrainValue = $("input:checkbox[name='terrain']:checked").val();
		if (terrainValue === "Electric") {
			$("#" + id).find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#" + id)));
		} else if (terrainValue === "Misty") {
			$("#" + id).find(".status").prop("disabled", isPokeInfoGrounded($("#" + id)));
		}
		break;
	case "ability":
		// with autoset, ability change may cause terrain change, need to consider both sides
		var terrainValue = $("input:checkbox[name='terrain']:checked").val();
		if (terrainValue === "Electric") {
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
			$("#p1").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else if (terrainValue === "Misty") {
			$("#p1").find(".status").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find(".status").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else {
			$("#p1").find("[value='Asleep']").prop("disabled", false);
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find("[value='Asleep']").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
		}
		break;
	default:
		$("input:checkbox[name='terrain']").not(this).prop("checked", false);
		if ($(this).prop("checked") && $(this).val() === "Electric") {
			// need to enable status because it may be disabled by Misty Terrain before.
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
			$("#p1").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else if ($(this).prop("checked") && $(this).val() === "Misty") {
			$("#p1").find(".status").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find(".status").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else {
			$("#p1").find("[value='Asleep']").prop("disabled", false);
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find("[value='Asleep']").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
		}
		break;
	}
}

function loadDefaultLists() {
	$(".set-selector").select2({
		formatResult: function (object) {
			return object.set ? ("&nbsp;&nbsp;&nbsp;" + object.set) : ("<b>" + object.text + "</b>");
		},
		query: function (query) {
			var pageSize = 30;
			var results = [];
			var options = getSetOptions();
			var group;
			for (var i = 0; i < options.length; i++) {
				var option = options[i];
				var pokeName = option.pokemon.toUpperCase();
				if (!option.set) group = option;
				var setName = option.set ? option.set.toUpperCase().split(" [")[0] : "";
				if (!query.term || query.term.toUpperCase().split(" ").every(function (term) {
					return pokeName.indexOf(term) === 0 || pokeName.indexOf("-" + term) >= 0 || pokeName.indexOf(" " + term) >= 0 || setName.includes(term);
				})) {
					if (!results.includes(group) && option !== group) results.push(group);
					results.push(option);
				}
			}
			query.callback({
				results: results.slice((query.page - 1) * pageSize, query.page * pageSize),
				more: results.length >= query.page * pageSize
			});
		},
		initSelection: function (element, callback) {
			if (element.is("#p2 .set-selector")) {
				if (localStorage.lastTrainer in partyOrder) {
					var firstMon = partyOrder[localStorage.lastTrainer][0];
					callback(getSetOptions().find(x => x.set == localStorage.lastTrainer && x.pokemon == firstMon));
					return;
				}
			}
			callback(getFirstValidSetOption());
		}
	});
}

function allPokemon(selector) {
	var allSelector = "";
	for (var i = 0; i < $(".poke-info").length; i++) {
		if (i > 0) {
			allSelector += ", ";
		}
		allSelector += "#p" + (i + 1) + " " + selector;
	}
	return allSelector;
}

function loadCustomList(id) {
	$("#" + id + " .set-selector").select2({
		formatResult: function (set) {
			return (set.nickname ? set.pokemon + " (" + set.nickname + ")" : set.id);
		},
		query: function (query) {
			var pageSize = 30;
			var results = [];
			var options = getSetOptions();
			for (var i = 0; i < options.length; i++) {
				var option = options[i];
				var pokeName = option.pokemon.toUpperCase();
				var setName = option.set ? option.set.toUpperCase() : option.set;
				if (option.isCustom && option.set && (!query.term || query.term.toUpperCase().split(" ").every(function (term) {
					return pokeName.indexOf(term) === 0 || pokeName.indexOf("-" + term) >= 0 || pokeName.indexOf(" " + term) >= 0 || setName.indexOf(term) === 0 || setName.indexOf("-" + term) >= 0 || setName.indexOf(" " + term) >= 0;
				}))) {
					results.push(option);
				}
			}
			query.callback({
				results: results.slice((query.page - 1) * pageSize, query.page * pageSize),
				more: results.length >= query.page * pageSize
			});
		},
		initSelection: function (element, callback) {
			var data = "";
			callback(data);
		}
	});
}

function getTrainerPokemon(trainerName, ignoreTrainerName) {
	trainerName = sanitizeTrainerName(trainerName);
	if (trainerName in partyOrder) {
		var party = partyOrder[trainerName].slice();
		var dupes = [...new Set(party.filter((x, i) => party.indexOf(x) != i))]
		for (var i in dupes) {
			var dupe = dupes[i];
			var count = party.filter(x => x == dupe).length;
			for (var j = 0; j < count; j++) {
				party[party.indexOf(dupe)] = `${dupe} (${j + 1})`;
			}
		}
		if (ignoreTrainerName) return party;
		party = party.map(x => x.includes("(") ? `${x.substring(0, x.indexOf(" ("))} (${trainerName} ${x.substring(x.indexOf(" (") + 1, x.lastIndexOf(")"))}))` : `${x} (${trainerName})`);
		return party;
	}
}

function sanitizeTrainerName(trainerName) {
	const pattern = /\{(.*?)\}/g;
	var results = [...trainerName.matchAll(pattern)];
	for (var i in results) {
		var result = results[i];
		trainerName = trainerName.replace(result[0], window[result[1]]);
	}
	return trainerName;
}

function getTrainerNavList() {
	return Object.keys(partyOrder).filter(x => !flags["hidden"].includes(x) && !x.startsWith("[")).map(x => sanitizeTrainerName(x));
}

var dragging = undefined;
var iconDropzones = "#team, #box1, #box2, #trash";
var setDropzones = ".poke-info, .import-team-text";
var searchActive = false;
function pickup(e) {
	dragging = $(e.target);
}
function iconDrop(e) {
	e.preventDefault();
	var target = $(e.target);
	var container = $(e.target).closest(".mon-container");
	container.removeClass("over");
	if (searchActive) return;
	if (target.is("img")) {
		if (target.siblings().is(dragging)) {
			var draggingPrev = dragging.prev();
			var targetPrev = target.prev();
			if (draggingPrev.length) draggingPrev.after(target);
			else container.prepend(target);
			if (targetPrev.length) targetPrev.after(dragging);
			else container.prepend(dragging);
		} else {
			target.before(dragging);
		}
	}
	else container.append(dragging);
	dragging = undefined;
	if (container.is("#trash")) $("#clearTrash").prop("disabled", false);
	else if (!$("#trash .pokemon-icon").length) $("#clearTrash").prop("disabled", true);
}
function setDrop(e) {
	e.preventDefault();
	var target = $(e.target);
	if (target.hasClass("import-team-text")) {
		console.log(dragging.attr("data-set"))
		$(".import-team-text").val(ExportPokemon(dragging.attr("data-set")));
	} else {
		var side = target.closest(".poke-info").attr("id");
		loadSet(dragging.attr("data-set"), side);
	}
	dragging = undefined;
}
function over(e) {
	if ($(e.target).closest(iconDropzones).length && (!dragging.parent().is(iconDropzones) || searchActive)) return;
	e.preventDefault();
	$(this).addClass("over");
}
function leave(e) {
	e.preventDefault();
	$(this).removeClass("over");
}

function loadSet(set, side, overrides) {
	$(`#${side} .set-selector`).val(set).change();
	$(`#${side} .set-selector .select2-chosen`).text(set);
	if (overrides) {
		if (overrides.level) $(`#${side} .level`).val(overrides.level).change();
		if (overrides.moves) for (var i in overrides.moves) {
			var move = MOVES[overrides.moves[i]];
			$(`#${side} .move${parseInt(i) + 1} .move-selector`).val(move.calcName).change();
		}
	}
}

function setStarters() {
	switch (SETTINGS.starter) {
		case "Turtwig":
			RIVAL_STARTER_1 = "Chimchar";
			RIVAL_STARTER_2 = "Monferno";
			RIVAL_STARTER_3 = "Infernape";
			RIVAL2_STARTER_1 = "Piplup";
			RIVAL2_STARTER_2 = "Prinplup";
			RIVAL2_STARTER_3 = "Empoleon";
			break;
		case "Chimchar":
			RIVAL_STARTER_1 = "Piplup";
			RIVAL_STARTER_2 = "Prinplup";
			RIVAL_STARTER_3 = "Empoleon";
			RIVAL2_STARTER_1 = "Turtwig";
			RIVAL2_STARTER_2 = "Grotle";
			RIVAL2_STARTER_3 = "Torterra";
			break;
		case "Piplup":
			RIVAL_STARTER_1 = "Turtwig";
			RIVAL_STARTER_2 = "Grotle";
			RIVAL_STARTER_3 = "Torterra";
			RIVAL2_STARTER_1 = "Chimchar";
			RIVAL2_STARTER_2 = "Monferno";
			RIVAL2_STARTER_3 = "Infernape";
			break;
	}
}

function setRival2Gender() {
	switch (SETTINGS.gender) {
		case "Male":
			RIVAL2_NAME = "Dawn";
			break;
		case "Female":
			RIVAL2_NAME = "Lucas";
			break;
	}
}

function setSwitchInGuide() {
	$(".switch-ai").hide();
}

$(".stat-changer").on("click", function() {
	var boostElement = $(this).parent().prev().children();
	var boostModifier = parseInt($(this).text() + "1");
	var futureBoost = parseInt(boostElement.val()) + boostModifier;
	if (futureBoost > -7) boostElement.val(futureBoost).change();
});

const TYPE_MATCHUPS = {
    "Normal-Rock": 0.5,
    "Normal-Steel": 0.5,
    "Fire-Fire": 0.5,
    "Fire-Water": 0.5,
    "Fire-Grass": 2.0,
    "Fire-Ice": 2.0,
    "Fire-Bug": 2.0,
    "Fire-Rock": 0.5,
    "Fire-Dragon": 0.5,
    "Fire-Steel": 2.0,
    "Water-Fire": 2.0,
    "Water-Water": 0.5,
    "Water-Grass": 0.5,
    "Water-Ground": 2.0,
    "Water-Rock": 2.0,
    "Water-Dragon": 0.5,
    "Electric-Water": 2.0,
    "Electric-Electric": 0.5,
    "Electric-Grass": 0.5,
    "Electric-Ground": 0.0,
    "Electric-Flying": 2.0,
    "Electric-Dragon": 0.5,
    "Grass-Fire": 0.5,
    "Grass-Water": 2.0,
    "Grass-Grass": 0.5,
    "Grass-Poison": 0.5,
    "Grass-Ground": 2.0,
    "Grass-Flying": 0.5,
    "Grass-Bug": 0.5,
    "Grass-Rock": 2.0,
    "Grass-Dragon": 0.5,
    "Grass-Steel": 0.5,
    "Ice-Water": 0.5,
    "Ice-Grass": 2.0,
    "Ice-Ice": 0.5,
    "Ice-Ground": 2.0,
    "Ice-Flying": 2.0,
    "Ice-Dragon": 2.0,
    "Ice-Steel": 0.5,
    "Ice-Fire": 0.5,
    "Fighting-Normal": 2.0,
    "Fighting-Ice": 2.0,
    "Fighting-Poison": 0.5,
    "Fighting-Flying": 0.5,
    "Fighting-Psychic": 0.5,
    "Fighting-Bug": 0.5,
    "Fighting-Rock": 2.0,
    "Fighting-Dark": 2.0,
    "Fighting-Steel": 2.0,
    "Poison-Grass": 2.0,
    "Poison-Poison": 0.5,
    "Poison-Ground": 0.5,
    "Poison-Rock": 0.5,
    "Poison-Ghost": 0.5,
    "Poison-Steel": 0.0,
    "Ground-Fire": 2.0,
    "Ground-Electric": 2.0,
    "Ground-Grass": 0.5,
    "Ground-Poison": 2.0,
    "Ground-Flying": 0.0,
    "Ground-Bug": 0.5,
    "Ground-Rock": 2.0,
    "Ground-Steel": 2.0,
    "Flying-Electric": 0.5,
    "Flying-Grass": 2.0,
    "Flying-Fighting": 2.0,
    "Flying-Bug": 2.0,
    "Flying-Rock": 0.5,
    "Flying-Steel": 0.5,
    "Psychic-Fighting": 2.0,
    "Psychic-Poison": 2.0,
    "Psychic-Psychic": 0.5,
    "Psychic-Dark": 0.0,
    "Psychic-Steel": 0.5,
    "Bug-Fire": 0.5,
    "Bug-Grass": 2.0,
    "Bug-Fighting": 0.5,
    "Bug-Poison": 0.5,
    "Bug-Flying": 0.5,
    "Bug-Psychic": 2.0,
    "Bug-Ghost": 0.5,
    "Bug-Dark": 2.0,
    "Bug-Steel": 0.5,
    "Rock-Fire": 2.0,
    "Rock-Ice": 2.0,
    "Rock-Fighting": 0.5,
    "Rock-Ground": 0.5,
    "Rock-Flying": 2.0,
    "Rock-Bug": 2.0,
    "Rock-Steel": 0.5,
    "Ghost-Normal": 0.0,
    "Ghost-Psychic": 2.0,
    "Ghost-Dark": 0.5,
    "Ghost-Steel": 0.5,
    "Ghost-Ghost": 2.0,
    "Dragon-Dragon": 2.0,
    "Dragon-Steel": 0.5,
    "Dark-Fighting": 0.5,
    "Dark-Psychic": 2.0,
    "Dark-Ghost": 2.0,
    "Dark-Dark": 0.5,
    "Dark-Steel": 0.5,
    "Steel-Fire": 0.5,
    "Steel-Water": 0.5,
    "Steel-Electric": 0.5,
    "Steel-Ice": 2.0,
    "Steel-Rock": 2.0,
    "Steel-Steel": 0.5,
    "Normal-Ghost": 0.0,
    "Fighting-Ghost": 0.0
};
function calcExpDropped() {
		$(".switch-ai").hide();
		var party = getTrainerPokemon(CURRENT_TRAINER, true);
		if (!party) {
			return;
		}
		var setNames = getTrainerPokemon(CURRENT_TRAINER);
	
		var partyMons = [];
		for (var i in party) {
			partyMons.push(setdex[party[i].split(" (")[0]][setNames[i].substring(setNames[i].indexOf("(") + 1, setNames[i].lastIndexOf(")"))]);
			try {
				partyMons[i].species = party[i].split(" (")[0];
				partyMons[i].setName = setNames[i];
				partyMons[i].name = party[i];
			} catch (ex) {
				$(".trainer-poke-switch-list").html("An error has occured.");
				return;
			}
		}
	
		if (partyMons.length) $(".switch-ai").show();
	
		for (var i in partyMons) {
			var mon = partyMons[i];
			var xp = Math.floor(Math.floor(pokedex[mon.species].expYield * mon.level / 7) * 1.5);
			$(`.switching-from[data-set='${mon.setName}'] .xp`).html(`+${xp}`).attr("title", "The amount of experience this Pokémon will drop.");
		}
	}

function applyIconColors() {
	$(".team-box .pokemon-icon").removeClass("speed-faster speed-slower speed-tie damage-ol damage-ol-pr damage-ol-or damage-pl damage-pl-pr damage-pl-or damage-or damage-pr");
	var speedBorders = $("#speedBorders").prop("checked");
	var damageColors = $("#damageColors").prop("checked");
	if (!(speedBorders || damageColors)) return;
	var enemy = createPokemon($("#p2"));
	var field = createField();
	var enemyField = field.clone().swap();
	$(".team-box .pokemon-icon").each(function() {
		var set = $(this).attr("data-set");
		var mon = createPokemon(set);
		var calculation = calculateAllMoves(gen, mon, field, enemy, enemyField);
		mon = calculation[0][0].attacker;
		enemy = calculation[1][0].attacker;
		if (speedBorders) {
			if (mon.stats.spe > enemy.stats.spe) $(this).addClass("speed-faster");
			else if (mon.stats.spe < enemy.stats.spe) $(this).addClass("speed-slower");
			else $(this).addClass("speed-tie");
		}
		if (damageColors) {
			var p1HighestCalc = calculation[0].filter(x => !x.move.named("Explosion", "Self-Destruct", "Memento")).map(x => x.damage).sort((a, b) => ((typeof b == "number" ? b : b[b.length - 1]) - (typeof a == "number" ? a : a[a.length - 1])))[0];
			var p2HighestCalc = calculation[1].map(x => x.damage).sort((a, b) => ((typeof b == "number" ? b : b[b.length - 1]) - (typeof a == "number" ? a : a[a.length - 1])))[0];
			var p1MinRoll = typeof p1HighestCalc == "number" ? p1HighestCalc : p1HighestCalc[0];
			var p1MaxRoll = typeof p1HighestCalc == "number" ? p1HighestCalc : p1HighestCalc[p1HighestCalc.length - 1];
			var p2MinRoll = typeof p2HighestCalc == "number" ? p2HighestCalc : p2HighestCalc[0];
			var p2MaxRoll = typeof p2HighestCalc == "number" ? p2HighestCalc : p2HighestCalc[p2HighestCalc.length - 1];
			var result = "damage";
			if (p1MinRoll >= enemy.stats.hp) result += "-ol";
			else if ((p1MaxRoll >= enemy.stats.hp)) result += "-pl";
			if (p2MinRoll >= mon.stats.hp) result += "-or";
			else if ((p2MaxRoll >= mon.stats.hp)) result += "-pr";
			if (result !== "damage") $(this).addClass(result);
		}
	});
}
$("#speedBorders, #damageColors").on("change", function() {
	applyIconColors();
});

function removeSet(set) {
	var mon = set.substring(0, set.indexOf(" ("));
	var setName = set.substring(set.indexOf("(") + 1, set.lastIndexOf(")"));
	var customSets = JSON.parse(localStorage.customsets);
	delete customSets[mon][setName];
	delete setdex[mon][setName];
	updateDex(customSets);
	$(`.pokemon-icon[data-set="${set}"]`).remove();
}

function deadSet(set, dead) {
	var mon = set.substring(0, set.indexOf(" ("));
	var setName = set.substring(set.indexOf("(") + 1, set.lastIndexOf(")"));
	var customSets = JSON.parse(localStorage.customsets);
	if (dead) {
		customSets[mon][setName].dead = true;
	} else {
		delete customSets[mon][setName].dead;
	}
	updateDex(customSets);
}

$("#clearTrash").on("click", function() {
	if (!confirm("This will delete all sets in the trash. Are you sure?")) return;
	$("#trash .pokemon-icon").each(function() {
		removeSet($(this).attr("data-set"));
	});
	$("#clearTrash").prop("disabled", true);
	if (!$(".team-box .mon-container .pokemon-icon").length) {
		$("#clearAllBoxes, #exportBox").prop("disabled", true);
	}
});

function removeAllSets() {
	localStorage.removeItem("customsets");
	for (var species in setdex) {
		for (var set in setdex[species]) {
			if (setdex[species][set].isCustomSet) delete setdex[species][set];
		}
	}
	$(iconDropzones).find(".pokemon-icon").remove();
	$(allPokemon("#importedSetsOptions")).hide();
	$("#clearTrash, #clearAllBoxes, #exportBox").prop("disabled", true);
	reloadEncounters();
}

$("#clearAllBoxes").on("click", function() {
	if (!confirm("This will delete all imported sets. Are you sure?")) return;
	removeAllSets();
});

var updateChecker;
function checkForUpdate() {
	fetch("/status.json", {cache: "reload"}).then(x => x.json()).then(function (x) {
		if (x.version !== VERSION) {
			$(".update-text").show();
			clearInterval(updateChecker);
		}
	}).catch(() => {
		clearInterval(updateChecker);
	});
}

function updateAIFlags(trainer, tagBattle, doubleBattle) {
	var teamBox    = $("#ai-flags-team");
	var tagBox     = $("#ai-flags-tag");
	var partnerBox = $("#ai-flags-partner");

	// Determine which trainer names map to Team, enemy Tag Partner, and player Partner
	var teamName    = trainer;
	var tagName     = null;
	var partnerName = null;

	if (tagBattle) {
		teamName    = tagBattle.enemy1;
		tagName     = tagBattle.enemy2;
		partnerName = tagBattle.partner;
	} else if (doubleBattle) {
		teamName = doubleBattle.enemy1;
		tagName  = doubleBattle.enemy2;
	}

	teamName = sanitizeTrainerName(teamName);
	if (tagName)     tagName     = sanitizeTrainerName(tagName);
	if (partnerName) partnerName = sanitizeTrainerName(partnerName);

	renderFlagsBox(teamBox, teamName, "Team AI Flags");

	// Render enemy Tag Partner flags only when there is one
	if (tagName) {
		renderFlagsBox(tagBox, tagName, "Tag Partner AI Flags");
		tagBox.removeClass("hide");
	} else {
		tagBox.addClass("hide").empty();
	}

	// Render player's Tag Partner flags only for tag battles
	if (partnerName) {
		renderFlagsBox(partnerBox, partnerName, "Partner AI Flags");
	} else {
		partnerBox.addClass("hide").empty();
	}
}

function renderFlagsBox(box, trainerName, label) {
	var flags = (typeof aiFlags !== "undefined") && aiFlags && aiFlags[trainerName];

	if (!flags) {
		// No data — hide the box rather than show an empty/broken state
		box.addClass("hide").removeAttr("data-has-flags").empty();
		return;
	}

	var flagOrder = ["Basic", "EvaluateAttack", "Expert", "Setup", "Risky", "DamagePriority", "BatonPass", "TagStrategy", "CheckHP", "Weather", "Harassment"];

	var items = "";
	for (var i = 0; i < flagOrder.length; i++) {
		var key = flagOrder[i];
		var on  = flags[key] === 1;
		items += '<span class="ai-flag-item ' + (on ? "flag-on" : "flag-off") + '" title="' + key + '">' + key + '</span>';
	}

	box.html(
		'<div class="ai-flags-label">' + label + '</div>' +
		'<div class="ai-flag-list">' + items + '</div>'
	);
	// Mark as populated so the settings toggle knows this box has real content
	box.attr("data-has-flags", "true");
	// Only show if the setting is enabled (default true if SETTINGS not yet loaded)
	var showFlags = (typeof SETTINGS === "undefined") || SETTINGS.showAIFlags !== false;
	if (showFlags) {
		box.removeClass("hide");
	} else {
		box.addClass("hide");
	}
}

$(document).ready(function () {
	var g = 4;
	CURRENT_TRAINER = "";
	$("#gen" + g).change();
	// $("#gen" + g).prop("checked", true);
	// $("#gen" + g).change();
	$("#percentage").prop("checked", true);
	$("#percentage").change();
	$("#singles-format").prop("checked", true);
	$("#singles-format").change();
	// loadDefaultLists();
	$(".move-selector").select2({
		dropdownAutoWidth: true,
		matcher: function (term, text) {
			// 2nd condition is for Hidden Power
			return text.toUpperCase().indexOf(term.toUpperCase()) === 0 || text.toUpperCase().indexOf(" " + term.toUpperCase()) >= 0;
		}
	});
	$(".set-selector").val(getFirstValidSetOption().id);
	if (localStorage.lastTrainer in partyOrder) {
		var firstMon = partyOrder[localStorage.lastTrainer][0];
		$("#p2 .set-selector").val(`${firstMon} (${localStorage.lastTrainer})`);
	}
	$(".set-selector").change();
	$(".terrain-trigger").bind("change keyup", getTerrainEffects);
	$("#previous-trainer").on("click", function() {
		var index = getTrainerNavList().indexOf(CURRENT_TRAINER) - 1;
		loadSet(getTrainerPokemon(getTrainerNavList()[index])[0], "p2");
	});
	$("#next-trainer").on("click", function() {
		var index = getTrainerNavList().indexOf(CURRENT_TRAINER) + 1;
		loadSet(getTrainerPokemon(getTrainerNavList()[index])[0], "p2");
	});
	$("#reset-trainer").on("click", function() {
		loadSet(getTrainerPokemon(getTrainerNavList()[0])[0], "p2");
	});
	$(".openDexEntry").on("click", function() {
		var id = toID($(this).closest(".poke-info").find(".set-selector:last").val().split(" (")[0]);
		window.location = `#/dex/species/${id}`;
	});
	$(iconDropzones).on({
		dragover: over,
		dragleave: leave,
		drop: iconDrop
	});
	$(setDropzones).on({
		dragover: over,
		dragleave: leave,
		drop: setDrop
	});
	$(".teambox-searchbar").on("input", function() {
		var term = $(this).val().toLowerCase();
		if (term) {
			$("#box1 .pokemon-icon, #box2 .pokemon-icon").each(function() {
				if ($(this).attr("data-set").toLowerCase().includes(term)) $(this).show();
				else $(this).hide();
			});
			searchActive = true;
		} else {
			$("#box1 .pokemon-icon, #box2 .pokemon-icon").show();
			searchActive = false;
		}
	}).val("");

	var version = localStorage.version;
	if (version != VERSION) {
		alert(`Changelog (${VERSION}):\n` + CHANGELOG);
		localStorage.version = VERSION;
	}

	setInterval(checkForUpdate, 60000);
});

/* Click-to-copy function */
$("#mainResult").click(function () {
	navigator.clipboard.writeText($("#mainResult").text()).then(function () {
		document.getElementById('tooltipText').style.visibility = 'visible';
		setTimeout(function () {
			document.getElementById('tooltipText').style.visibility = 'hidden';
		}, 1500);
	});
});
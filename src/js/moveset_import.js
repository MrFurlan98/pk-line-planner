function placeBsBtn() {
	var importBtn = "<button id='import' class='bs-btn bs-btn-default'>Import</button>";
	$("#import-1_wrapper").append(importBtn);
	var syncBtn = "<button id='sync' class='bs-btn bs-btn-default'>Sync</button>";
	// $("#import-1_wrapper").append(syncBtn);
	var uploadBtn = "<input type='file' name='saveFile' id='saveFile' accept='.sav, .dsv' hidden /><button id='upload' class='bs-btn bs-btn-default'>Upload Save</button>";
	$("#import-1_wrapper").append(uploadBtn);

	$("#import.bs-btn").click(function () {
		var pokes = document.getElementsByClassName("import-team-text")[0].value;
		var name = "Custom Set";
		addSets(pokes, name);
	});
	$("#sync.bs-btn").click(function () {
		fetch("http://localhost:31125/update").then(x => x.text()).then(function (x) {
			addSets(x, "Custom Set");
		}).catch(() => alert("Please make sure both parts of the Lua script are running. A link to the script can be found at the bottom of the page."));
	});
	$("#upload.bs-btn").click(function () {
		$("#saveFile").click();
	});
	$("#saveFile").on("change", function () {
		var file = $(this)[0].files[0];
		var data = [];
		const reader = new FileReader();
		reader.onload = (e) => {
			if (e.target.readyState == FileReader.DONE) {
				var arrayBuffer = e.target.result,
				array = new Uint8Array(arrayBuffer);
				for (var i = 0; i < array.length; i++) {
					data.push(array[i]);
				}
			}
			parseSaveFile(data);
		};
		reader.readAsArrayBuffer(file);
	});

	function parseSaveFile(data) {
		var curveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
		var curves = [[0, 0, 0, 0, 0, 0, 0], [8, 15, 4, 9, 6, 10, 8], [27, 52, 13, 57, 21, 33, 27], [64, 122, 32, 96, 51, 80, 64], [125, 237, 65, 135, 100, 156, 125], [216, 406, 112, 179, 172, 270, 216], [343, 637, 178, 236, 274, 428, 343], [512, 942, 276, 314, 409, 640, 512], [729, 1326, 393, 419, 583, 911, 729], [1000, 1800, 540, 560, 800, 1250, 1000], [1331, 2369, 745, 742, 1064, 1663, 1331], [1728, 3041, 967, 973, 1382, 2160, 1728], [2197, 3822, 1230, 1261, 1757, 2746, 2197], [2744, 4719, 1591, 1612, 2195, 3430, 2744], [3375, 5737, 1957, 2035, 2700, 4218, 3375], [4096, 6881, 2457, 2535, 3276, 5120, 4096], [4913, 8155, 3046, 3120, 3930, 6141, 4913], [5832, 9564, 3732, 3798, 4665, 7290, 5832], [6859, 11111, 4526, 4575, 5487, 8573, 6859], [8000, 12800, 5440, 5460, 6400, 10000, 8000], [9261, 14632, 6482, 6458, 7408, 11576, 9261], [10648, 16610, 7666, 7577, 8518, 13310, 10648], [12167, 18737, 9003, 8825, 9733, 15208, 12167], [13824, 21012, 10506, 10208, 11059, 17280, 13824], [15625, 23437, 12187, 11735, 12500, 19531, 15625], [17576, 26012, 14060, 13411, 14060, 21970, 17576], [19683, 28737, 16140, 15244, 15746, 24603, 19683], [21952, 31610, 18439, 17242, 17561, 27440, 21952], [24389, 34632, 20974, 19411, 19511, 30486, 24389], [27000, 37800, 23760, 21760, 21600, 33750, 27000], [29791, 41111, 26811, 24294, 23832, 37238, 29791], [32768, 44564, 30146, 27021, 26214, 40960, 32768], [35937, 48155, 33780, 29949, 28749, 44921, 35937], [39304, 51881, 37731, 33084, 31443, 49130, 39304], [42875, 55737, 42017, 36435, 34300, 53593, 42875], [46656, 59719, 46656, 40007, 37324, 58320, 46656], [50653, 63822, 50653, 43808, 40522, 63316, 50653], [54872, 68041, 55969, 47846, 43897, 68590, 54872], [59319, 72369, 60505, 52127, 47455, 74148, 59319], [64000, 76800, 66560, 56660, 51200, 80000, 64000], [68921, 81326, 71677, 61450, 55136, 86151, 68921], [74088, 85942, 78533, 66505, 59270, 92610, 74088], [79507, 90637, 84277, 71833, 63605, 99383, 79507], [85184, 95406, 91998, 77440, 68147, 106480, 85184], [91125, 100237, 98415, 83335, 72900, 113906, 91125], [97336, 105122, 107069, 89523, 77868, 121670, 97336], [103823, 110052, 114205, 96012, 83058, 129778, 103823], [110592, 115015, 123863, 102810, 88473, 138240, 110592], [117649, 120001, 131766, 109923, 94119, 147061, 117649], [125000, 125000, 142500, 117360, 100000, 156250, 125000], [132651, 131324, 151222, 125126, 106120, 165813, 132651], [140608, 137795, 163105, 133229, 112486, 175760, 140608], [148877, 144410, 172697, 141677, 119101, 186096, 148877], [157464, 151165, 185807, 150476, 125971, 196830, 157464], [166375, 158056, 196322, 159635, 133100, 207968, 166375], [175616, 165079, 210739, 169159, 140492, 219520, 175616], [185193, 172229, 222231, 179056, 148154, 231491, 185193], [195112, 179503, 238036, 189334, 156089, 243890, 195112], [205379, 186894, 250562, 199999, 164303, 256723, 205379], [216000, 194400, 267840, 211060, 172800, 270000, 216000], [226981, 202013, 281456, 222522, 181584, 283726, 226981], [238328, 209728, 300293, 234393, 190662, 297910, 238328], [250047, 217540, 315059, 246681, 200037, 312558, 250047], [262144, 225443, 335544, 259392, 209715, 327680, 262144], [274625, 233431, 351520, 272535, 219700, 343281, 274625], [287496, 241496, 373744, 286115, 229996, 359370, 287496], [300763, 249633, 390991, 300140, 240610, 375953, 300763], [314432, 257834, 415050, 314618, 251545, 393040, 314432], [328509, 267406, 433631, 329555, 262807, 410636, 328509], [343000, 276458, 459620, 344960, 274400, 428750, 343000], [357911, 286328, 479600, 360838, 286328, 447388, 357911], [373248, 296358, 507617, 377197, 298598, 466560, 373248], [389017, 305767, 529063, 394045, 311213, 486271, 389017], [405224, 316074, 559209, 411388, 324179, 506530, 405224], [421875, 326531, 582187, 429235, 337500, 527343, 421875], [438976, 336255, 614566, 447591, 351180, 548720, 438976], [456533, 346965, 639146, 466464, 365226, 570666, 456533], [474552, 357812, 673863, 485862, 379641, 593190, 474552], [493039, 367807, 700115, 505791, 394431, 616298, 493039], [512000, 378880, 737280, 526260, 409600, 640000, 512000], [531441, 390077, 765275, 547274, 425152, 664301, 531441], [551368, 400293, 804997, 568841, 441094, 689210, 551368], [571787, 411686, 834809, 590969, 457429, 714733, 571787], [592704, 423190, 877201, 613664, 474163, 740880, 592704], [614125, 433572, 908905, 636935, 491300, 767656, 614125], [636056, 445239, 954084, 660787, 508844, 795070, 636056], [658503, 457001, 987754, 685228, 526802, 823128, 658503], [681472, 467489, 1035837, 710266, 545177, 851840, 681472], [704969, 479378, 1071552, 735907, 563975, 881211, 704969], [729000, 491346, 1122660, 762160, 583200, 911250, 729000], [753571, 501878, 1160499, 789030, 602856, 941963, 753571], [778688, 513934, 1214753, 816525, 622950, 973360, 778688], [804357, 526049, 1254796, 844653, 643485, 1005446, 804357], [830584, 536557, 1312322, 873420, 664467, 1038230, 830584], [857375, 548720, 1354652, 902835, 685900, 1071718, 857375], [884736, 560922, 1415577, 932903, 707788, 1105920, 884736], [912673, 571333, 1460276, 963632, 730138, 1140841, 912673], [941192, 583539, 1524731, 995030, 752953, 1176490, 941192], [970299, 591882, 1571884, 1027103, 776239, 1212873, 970299], [1000000, 600000, 1640000, 1059860, 800000, 1250000, 1000000]];
		var decodeChar = {0x0121:"0", 0x0122:"1", 0x0123:"2", 0x0124:"3", 0x0125:"4", 0x0126:"5", 0x0127:"6", 0x0128:"7", 0x0129:"8", 0x012A:"9", 0x012B:"A", 0x012C:"B", 0x012D:"C", 0x012E:"D", 0x012F:"E", 0x0130:"F", 0x0131:"G", 0x0132:"H", 0x0133:"I", 0x0134:"J", 0x0135:"K", 0x0136:"L", 0x0137:"M", 0x0138:"N", 0x0139:"O", 0x013A:"P", 0x013B:"Q", 0x013C:"R", 0x013D:"S", 0x013E:"T", 0x013F:"U", 0x0140:"V", 0x0141:"W", 0x0142:"X", 0x0143:"Y", 0x0144:"Z", 0x0145:"a", 0x0146:"b", 0x0147:"c", 0x0148:"d", 0x0149:"e", 0x014A:"f", 0x014B:"g", 0x014C:"h", 0x014D:"i", 0x014E:"j", 0x014F:"k", 0x0150:"l", 0x0151:"m", 0x0152:"n", 0x0153:"o", 0x0154:"p", 0x0155:"q", 0x0156:"r", 0x0157:"s", 0x0158:"t", 0x0159:"u", 0x015A:"v", 0x015B:"w", 0x015C:"x", 0x015D:"y", 0x015E:"z", 0x015F:"À", 0x0160:"Á", 0x0161:"Â", 0x0162:"Ã", 0x0163:"Ä", 0x0164:"Å", 0x0165:"Æ", 0x0166:"Ç", 0x0167:"È", 0x0168:"É", 0x0169:"Ê", 0x016A:"Ë", 0x016B:"Ì", 0x016C:"Í", 0x016D:"Î", 0x016E:"Ï", 0x016F:"Ð", 0x0170:"Ñ", 0x0171:"Ò", 0x0172:"Ó", 0x0173:"Ô", 0x0174:"Õ", 0x0175:"Ö", 0x0176:"×", 0x0177:"Ø", 0x0178:"Ù", 0x0179:"Ú", 0x017A:"Û", 0x017B:"Ü", 0x017C:"Ý", 0x017D:"Þ", 0x017E:"ß", 0x017F:"à", 0x0180:"á", 0x0181:"â", 0x0182:"ã", 0x0183:"ä", 0x0184:"å", 0x0185:"æ", 0x0186:"ç", 0x0187:"è", 0x0188:"é", 0x0189:"ê", 0x018A:"ë", 0x018B:"ì", 0x018C:"í", 0x018D:"î", 0x018E:"ï", 0x018F:"ð", 0x0190:"ñ", 0x0191:"ò", 0x0192:"ó", 0x0193:"ô", 0x0194:"õ", 0x0195:"ö", 0x0196:"÷", 0x0197:"ø", 0x0198:"ù", 0x0199:"ú", 0x019A:"û", 0x019B:"ü", 0x019C:"ý", 0x019D:"þ", 0x019E:"ÿ", 0x019F:"Œ", 0x01A0:"œ", 0x01A1:"Ş", 0x01A2:"ş", 0x01A3:"ª", 0x01A4:"º", 0x01A5:"er", 0x01A6:"re", 0x01A7:"r", 0x01A8:"Pokémon Dollar", 0x01A9:"¡", 0x01AA:"¿", 0x01AB:"!", 0x01AC:"?", 0x01AD:",", 0x01AE:".", 0x01AF:"…", 0x01B0:"･", 0x01B1:"/", 0x01B2:"‘", 0x01B3:"'", 0x01B4:"“", 0x01B5:"”", 0x01B6:"„", 0x01B7:"«", 0x01B8:"»", 0x01B9:"(", 0x01BA:")", 0x01BB:"♂", 0x01BC:"♀", 0x01BD:"+", 0x01BE:"-", 0x01BF:"*", 0x01C0:"#", 0x01C1:":", 0x01C2:"&", 0x01C3:"~", 0x01C4:":", 0x01C5:";", 0x01C6:"♠", 0x01C7:"♣", 0x01C8:"♥", 0x01C9:"♦", 0x01CA:"★", 0x01CB:"◎", 0x01CC:"○", 0x01CD:"□", 0x01CE:"△", 0x01CF:"◇", 0x01D0:"@", 0x01D1:"♪", 0x01D2:"%", 0x01D3:"☀", 0x01D4:"☁", 0x01D5:"☂", 0x01D6:"☃", 0x01D7:"😑︎", 0x01D8:"☺", 0x01D9:"☹", 0x01DA:"😠︎", 0x01DB:"⤴︎", 0x01DC:"⤵︎", 0x01DD:"💤︎", 0x01DE:" "};
		var shuffle = [[0x08, 0x28, 0x48, 0x68], [0x08, 0x28, 0x68, 0x48], [0x08, 0x48, 0x28, 0x68], [0x08, 0x68, 0x28, 0x48], [0x08, 0x48, 0x68, 0x28], [0x08, 0x68, 0x48, 0x28], [0x28, 0x08, 0x48, 0x68], [0x28, 0x08, 0x68, 0x48], [0x48, 0x08, 0x28, 0x68], [0x68, 0x08, 0x28, 0x48], [0x48, 0x08, 0x68, 0x28], [0x68, 0x08, 0x48, 0x28], [0x28, 0x48, 0x08, 0x68], [0x28, 0x68, 0x08, 0x48], [0x48, 0x28, 0x08, 0x68], [0x68, 0x28, 0x08, 0x48], [0x48, 0x68, 0x08, 0x28], [0x68, 0x48, 0x08, 0x28], [0x28, 0x48, 0x68, 0x08], [0x28, 0x68, 0x48, 0x08], [0x48, 0x28, 0x68, 0x08], [0x68, 0x28, 0x48, 0x08], [0x48, 0x68, 0x28, 0x08], [0x68, 0x48, 0x28, 0x08]];

		function readUInt16(array, offset = 0) { return new Uint16Array(new Uint8Array(array.slice(offset, offset + 2)).buffer)[0]; }
		function readUInt32(array, offset = 0) { return new Uint32Array(new Uint8Array(array.slice(offset, offset + 4)).buffer)[0]; }

		function parsePokemon(array) {
			var checksum = readUInt16(array, 0x6);
			var seed = checksum;
			for (var i = 8; i < 136; i += 2) {
				seed = BigInt(seed) * BigInt(0x41C64E6D) + BigInt(0x6073);
				var encrypted = readUInt16(array, i);
				var key = parseInt(seed >> BigInt(16) & BigInt(0xFFFF));
				var decrypted = encrypted ^ key
				array[i] = decrypted & 0xFF;
				array[i + 1] = decrypted >> 8;
			}

			var pokemon = "";
			var pid = readUInt32(array);
			var shuffleKey = ((pid & 0x3E000) >> 0xD) % 24;
			var blockA = array.slice(shuffle[shuffleKey][0]);
			var blockB = array.slice(shuffle[shuffleKey][1]);
			var blockC = array.slice(shuffle[shuffleKey][2]);
			var blockD = array.slice(shuffle[shuffleKey][3]);
			var speciesId = readUInt16(blockA);
			if (!speciesId) return "";
			var genderForme = blockB[0x18];
			var species = Object.values(SPECIES).find(x => x.num == speciesId);
			var forme = genderForme >> 3;
			if (forme && species.formes.length) species = SPECIES[species.formes[forme]];
			var heldItem = Object.values(ITEMS).find(x => x.num == readUInt16(blockA, 0x2));
			var ability = Object.values(ABILITIES).find(x => x.num == readUInt16(blockA, 0xC) >> 8);
			var ivData = BigInt(readUInt32(blockB, 0x10));
			var isEgg = (BigInt(ivData) >> BigInt(30)) & BigInt(1);
			var location;
			if (!isEgg) {
				if (readUInt16(blockB, 0x1E) == 0x7D1) location = {name: "Link Trade"};
				else location = Object.values(LOCATIONS).find(x => x.metLocationId == readUInt16(blockB, 0x1E));
			}
			var exp = BigInt(readUInt32(blockA, 0x8));
			var level = curves.filter(x => x[curveNames.indexOf(species.growthRate)] <= exp).length;
			var nature = Object.values(NATURES).find(x => x.num == pid % 25);
			var hp = parseInt(BigInt(ivData) & BigInt(0x1F));
			var atk = parseInt((BigInt(ivData) & BigInt(0x3E0)) / BigInt(0x20));
			var def = parseInt((BigInt(ivData) & BigInt(0x7C00)) / BigInt(0x400));
			var spa = parseInt((BigInt(ivData) & BigInt(0x1F00000)) / BigInt(0x100000));
			var spd = parseInt((BigInt(ivData) & BigInt(0x3E000000)) / BigInt(0x2000000));
			var spe = parseInt((BigInt(ivData) & BigInt(0xF8000)) / BigInt(32768));
			var move1 = Object.values(MOVES).find(x => x.num == readUInt16(blockB));
			var move2 = Object.values(MOVES).find(x => x.num == readUInt16(blockB, 0x2));
			var move3 = Object.values(MOVES).find(x => x.num == readUInt16(blockB, 0x4));
			var move4 = Object.values(MOVES).find(x => x.num == readUInt16(blockB, 0x6));
			var hasNickname = parseInt(BigInt(ivData) >> BigInt(31));
			if (hasNickname) {
				nickname = "";
				for (var i = 0x0; i < 0x16; i += 2) {
					var word = readUInt16(blockC, i);
					if (word == 0xFFFF) break;
					nickname += decodeChar[word];
				}
				pokemon = `${nickname} (${species.name})`;
			} else pokemon = species.name;

			var gender = "M";
			if ((genderForme >> 1) & 1) gender = "F";
			else if ((genderForme >> 2) & 1) gender = "N";
			if (gender !== "N") pokemon += ` (${gender})`;

			if (heldItem) pokemon += ` @ ${heldItem.name}`;
			pokemon += "\n";
			pokemon += `Ability: ${ability.name}\n`;
			if (location) pokemon += `Location: ${location.name}\n`;
			pokemon += `Level: ${level}\n`;
			pokemon += `${nature.name} Nature\n`;
			pokemon += `IVs: ${hp} HP / ${atk} Atk / ${def} Def / ${spa} SpA / ${spd} SpD / ${spe} Spe\n`;
			pokemon += `- ${move1.calcName}\n`;
			if (move2) pokemon += `- ${move2.calcName}\n`;
			if (move3) pokemon += `- ${move3.calcName}\n`;
			if (move4) pokemon += `- ${move4.calcName}\n`;
			pokemon += "\n";
			return pokemon;
		}

		var smallBlock1 = data.slice(0x00000, 0x0CF2C);
		var smallBlock2 = data.slice(0x40000, 0x4CF2C);
		var largeBlock1 = data.slice(0x0CF2C, 0x1F110);
		var largeBlock2 = data.slice(0x4CF2C, 0x5F110);

		var smallBlock;

		if (readUInt32(smallBlock1, -8) !== 0x20060623 && readUInt32(smallBlock2, -8) !== 0x20060623) {
			alert("The selected save file was not initialized. Make sure to save in-game, export your save file again, and upload the new save file instead.");
			return;
		}
		if (readUInt32(smallBlock1, -8) !== 0x20060623) smallBlock = smallBlock2;
		else smallBlock = readUInt32(smallBlock2, -16) > readUInt32(smallBlock1, -16) ? smallBlock2 : smallBlock1;

		var largeBlock = readUInt32(smallBlock, -20) == readUInt32(largeBlock1, -20) ? largeBlock1 : largeBlock2;

		var paste = "";

		var partyCount = smallBlock[0x9C];
		var party = smallBlock.slice(0xA0, 0x628);
		for (var i = 0; i < partyCount; i++) {
			var pokemon = parsePokemon(party.slice(i * 236, (i + 1) * 236));
			paste += pokemon;
		}

		var pc = largeBlock.slice(0x4, 0x11EE4);
		for (var i = 0; i < 420; i++) {
			var pokemon = parsePokemon(pc.slice(i * 136, (i + 1) * 236));
			paste += pokemon;
		}

		addSets(paste, "Custom Set");
	}
}

function ExportPokemon(pokeInfo, nickname = "") {
	var pokemon = createPokemon(pokeInfo);
	var EV_counter = 0;
	var finalText = "";
	if (!nickname || nickname == "Custom Set") finalText = pokemon.name;
	else finalText = nickname + " (" + pokemon.name + ")";
	if (pokemon.gender !== "N") finalText += " (" + pokemon.gender + ")";
	finalText += (pokemon.item ? " @ " + pokemon.item : "") + "\n"
	finalText += "Level: " + pokemon.level + "\n";
	finalText += pokemon.nature && gen > 2 ? pokemon.nature + " Nature" + "\n" : "";
	if (gen === 9) {
		var teraType = pokeInfo.find(".teraType").val();
		if (teraType !== undefined && teraType !== pokemon.types[0]) {
			finalText += "Tera Type: " + teraType + "\n";
		}
	}
	finalText += pokemon.ability ? "Ability: " + pokemon.ability + "\n" : "";
	if (gen > 2) {
		var EVs_Array = [];
		for (var stat in pokemon.evs) {
			var ev = pokemon.evs[stat] ? pokemon.evs[stat] : 0;
			if (ev > 0) {
				EVs_Array.push(ev + " " + calc.Stats.displayStat(stat));
			}
			EV_counter += ev;
			if (EV_counter > 510) break;
		}
		if (EVs_Array.length > 0) {
			finalText += "EVs: ";
			finalText += serialize(EVs_Array, " / ");
			finalText += "\n";
		}
	}

	var IVs_Array = [];
	for (var stat in pokemon.ivs) {
		var iv = pokemon.ivs[stat] ? pokemon.ivs[stat] : 0;
		if (iv < 31) {
			IVs_Array.push(iv + " " + calc.Stats.displayStat(stat));
		}
	}
	if (IVs_Array.length > 0) {
		finalText += "IVs: ";
		finalText += serialize(IVs_Array, " / ");
		finalText += "\n";
	}

	for (var i = 0; i < 4; i++) {
		var moveName = pokemon.moves[i].name;
		if (moveName !== "(No Move)") {
			finalText += "- " + moveName + "\n";
		}
	}
	finalText = finalText.trim();
	return(finalText);
}

$("#exportL").click(function () {
	var setName = $("#p1").find(".select2-chosen")[0].textContent.split(
		/^([^(@]+)(\((.+)\))? ?(@ (.+))?/
	)[3];
	$("textarea.import-team-text").val(ExportPokemon($("#p1"), setName ?? "Custom Set"));
});

$("#exportR").click(function () {
	var setName = $("#p2").find(".select2-chosen")[0].textContent.split(
		/^([^(@]+)(\((.+)\))? ?(@ (.+))?/
	)[3];
	$("textarea.import-team-text").val(ExportPokemon($("#p2"), setName ?? "Custom Set"));
});

$("#saveL").click(function () {
	var setName = $("#p1").find(".select2-chosen")[0].textContent.split(
		/^([^(@]+)(\((.+)\))? ?(@ (.+))?/
	)[3];
	addSets(ExportPokemon($("#p1")), setName ?? "Custom Set");
});

function serialize(array, separator) {
	var text = "";
	for (var i = 0; i < array.length; i++) {
		if (i < array.length - 1) {
			text += array[i] + separator;
		} else {
			text += array[i];
		}
	}
	return text;
}

function getAbility(row) {
	var ability = row[1] ? row[1].trim() : '';
	if (calc.ABILITIES[9].indexOf(ability) !== -1) return ability;
}

function getTeraType(row) {
	var teraType = row[1] ? row[1].trim() : '';
	if (Object.keys(calc.TYPE_CHART[9]).slice(1).indexOf(teraType) !== -1) return teraType;
}

function statToLegacyStat(stat) {
	switch (stat) {
	case 'hp':
		return "hp";
	case 'atk':
		return "at";
	case 'def':
		return "df";
	case 'spa':
		return "sa";
	case 'spd':
		return "sd";
	case 'spe':
		return "sp";
	}
}

function getStats(currentPoke, rows, offset) {
	currentPoke.nature = "Serious";
	var currentEV;
	var currentIV;
	var currentAbility;
	var currentTeraType;
	var currentNature;
	currentPoke.level = 100;
	for (var x = offset; x < offset + 9; x++) {
		var currentRow = rows[x] ? rows[x].split(/[/:]/) : '';
		var evs = {};
		var ivs = {};
		var ev;
		var j;

		switch (currentRow[0]) {
		case 'Level':
			currentPoke.level = parseInt(currentRow[1].trim());
			break;
		case 'EVs':
			for (j = 1; j < currentRow.length; j++) {
				currentEV = currentRow[j].trim().split(" ");
				currentEV[1] = statToLegacyStat(currentEV[1].toLowerCase());
				evs[currentEV[1]] = parseInt(currentEV[0]);
			}
			currentPoke.evs = evs;
			break;
		case 'IVs':
			for (j = 1; j < currentRow.length; j++) {
				currentIV = currentRow[j].trim().split(" ");
				currentIV[1] = statToLegacyStat(currentIV[1].toLowerCase());
				ivs[currentIV[1]] = parseInt(currentIV[0]);
			}
			currentPoke.ivs = ivs;
			break;

		}
		currentAbility = rows[x] ? rows[x].trim().split(":") : '';
		if (!currentPoke.ability && currentAbility[0] == "Ability") {
			currentPoke.ability = currentAbility[1].trim();
		}
		
		currentLocation = rows[x] ? rows[x].trim().split(":") : '';
		if (!currentPoke.location && currentLocation[0] == "Location") {
			currentPoke.location = currentLocation[1].trim().replace(" (NPC)", "");
		}

		currentTeraType = rows[x] ? rows[x].trim().split(":") : '';
		if (currentTeraType[0] == "Tera Type") {
			currentPoke.teraType = currentTeraType[1].trim();
		}

		currentNature = rows[x] ? rows[x].trim().split(" ") : '';
		if (currentNature[1] == "Nature" && currentNature[0] !== "-") {
			currentPoke.nature = currentNature[0];
		}
	}
	return currentPoke;
}

function getGenderFromRow(currentRow, j) {
	for (;j < currentRow.length; j++) {
		var gender = currentRow[j].trim();
		if (gender == "F") return "Female";
		else if (gender == "M") return "Male";
	}
	return "";
}

function getItem(currentRow, j) {
	for (;j < currentRow.length; j++) {
		var item = currentRow[j].trim();
		if (calc.ITEMS[9].indexOf(item) != -1) {
			return item;
		}
	}
}

function getMoves(currentPoke, rows, offset) {
	var movesFound = false;
	var moves = [];
	for (var x = offset; x < offset + 12; x++) {
		if (rows[x]) {
			if (rows[x][0] == "-") {
				movesFound = true;
				var move = rows[x].substr(2, rows[x].length - 2).replace("[", "").replace("]", "").replace("  ", "").trim();
				moves.push(move);
			} else {
				if (movesFound == true) {
					break;
				}
			}
		}
	}
	currentPoke.moves = moves;
	return currentPoke;
}

function addToDex(poke) {
	var dexObject = {};
	if (SETDEX_PK[poke.name] == undefined) SETDEX_PK[poke.name] = {};
	if (poke.ability !== undefined) {
		dexObject.ability = poke.ability;
	}
	if (poke.location !== undefined) {
		dexObject.location = poke.location;
	}
	if (poke.teraType !== undefined) {
		dexObject.teraType = poke.teraType;
	}
	dexObject.level = poke.level;
	dexObject.gender = poke.gender;
	if (poke.name == "Nidoran-F") dexObject.gender = "Female";
	else if (poke.name == "Nidoran-M") dexObject.gender = "Male";
	dexObject.evs = poke.evs;
	dexObject.ivs = poke.ivs;
	dexObject.moves = poke.moves;
	dexObject.nature = poke.nature;
	dexObject.item = poke.item;
	dexObject.isCustomSet = poke.isCustomSet;
	var customsets;
	if (localStorage.customsets) {
		customsets = JSON.parse(localStorage.customsets);
	} else {
		customsets = {};
	}
	if (!customsets[poke.name]) {
		customsets[poke.name] = {};
	}
	customsets[poke.name][poke.nameProp] = dexObject;
	if (poke.name === "Aegislash-Blade") {
		if (!customsets["Aegislash-Shield"]) {
			customsets["Aegislash-Shield"] = {};
		}
		customsets["Aegislash-Shield"][poke.nameProp] = dexObject;
	}
	updateDex(customsets);
}

function addToBox(poke) {
	var set = `${poke.name} (${poke.nameProp})`;
	var species = SPECIES[toID(poke.name)];
	if (!$(`[data-set="${set}"]`).length) {
		$("#box1").append(`<img class="pokemon-icon" src="/img/dex/icon/species/${species.id}.png" data-set="${set}" data-side="p1" title="${set}">`);
		$(`[data-set="${set}"]`).on({
			click: function() {
				loadSet($(this).attr("data-set"), $(this).attr("data-side"));
			},
			drag: pickup,
			drop: iconDrop
		});
	}
	if (setdex[poke.name][poke.nameProp].dead) $(`[data-set="${set}"]`).hide();
	else $(`[data-set="${set}"]`).show();
	$("#clearAllBoxes, #exportBox").prop("disabled", false);
}

function updateDex(customsets) {
	for (var pokemon in customsets) {
		for (var moveset in customsets[pokemon]) {
			if (!SETDEX_PK[pokemon]) SETDEX_PK[pokemon] = {};
			SETDEX_PK[pokemon][moveset] = customsets[pokemon][moveset];
			addToBox({name: pokemon, nameProp: moveset});
		}
	}
	localStorage.customsets = JSON.stringify(customsets);
	reloadEncounters();
}

function addSets(pokes, name) {
	var rows = pokes.split("\n");
	var currentRow;
	var currentPoke;
	var addedpokes = 0;
	for (var i = 0; i < rows.length; i++) {
		currentRow = rows[i].split(/[()@]/);
		for (var j = 0; j < currentRow.length; j++) {
			currentRow[j] = checkExeptions(currentRow[j].trim());
			if (calc.SPECIES[4][currentRow[j].trim()] !== undefined) {
				currentPoke = JSON.parse(JSON.stringify(calc.SPECIES[4][currentRow[j].trim()]));
				currentPoke.name = currentRow[j].trim();
				currentPoke.gender = getGenderFromRow(currentRow, j + 1);
				currentPoke.item = getItem(currentRow, j + 1);
				if (j === 1 && currentRow[0].trim()) {
					currentPoke.nameProp = currentRow[0].trim();
				} else {
					currentPoke.nameProp = name;
				}
				currentPoke.isCustomSet = true;
				currentPoke.ability = getAbility(rows[i + 1].split(":"));
				currentPoke.teraType = getTeraType(rows[i + 1].split(":"));
				currentPoke = getStats(currentPoke, rows, i + 1);
				currentPoke = getMoves(currentPoke, rows, i);
				addToDex(currentPoke);
				addedpokes++;
			}
		}
	}
	if (addedpokes == 1) {
		$(allPokemon("#importedSetsOptions")).css("display", "inline");
		$(".import-team-text").val("");
		applyIconColors();
	} else if (addedpokes > 1) {
		$(allPokemon("#importedSetsOptions")).css("display", "inline");
		$(".import-team-text").val("");
		applyIconColors();
	} else {
		alert("No sets imported, please check your syntax and try again");
	}
}

function checkExeptions(poke) {
	switch (poke) {
	case 'Aegislash':
		poke = "Aegislash-Blade";
		break;
	case 'Basculin-Blue-Striped':
		poke = "Basculin";
		break;
	case 'Burmy-Sandy':
	case 'Burmy-Trash':
		poke = "Burmy";
		break;
	case 'Gastrodon-East':
		poke = "Gastrodon";
		break;
	case 'Mimikyu-Busted-Totem':
		poke = "Mimikyu-Totem";
		break;
	case 'Mimikyu-Busted':
		poke = "Mimikyu";
		break;
	case 'Pikachu-Belle':
	case 'Pikachu-Cosplay':
	case 'Pikachu-Libre':
	case 'Pikachu-Original':
	case 'Pikachu-Partner':
	case 'Pikachu-PhD':
	case 'Pikachu-Pop-Star':
	case 'Pikachu-Rock-Star':
		poke = "Pikachu";
		break;
	case 'Vivillon-Fancy':
	case 'Vivillon-Pokeball':
		poke = "Vivillon";
		break;
	case 'Florges-White':
	case 'Florges-Blue':
	case 'Florges-Orange':
	case 'Florges-Yellow':
		poke = "Florges";
		break;
	case 'Shellos-East':
		poke = "Shellos";
		break;
	case 'Deerling-Summer':
	case 'Deerling-Autumn':
	case 'Deerling-Winter':
		poke = "Deerling";
		break;
	}
	return poke;

}

$(allPokemon("#importedSets")).click(function () {
	var pokeID = $(this).parent().parent().prop("id");
	var showCustomSets = $(this).prop("checked");
	if (showCustomSets) {
		loadCustomList(pokeID);
	} else {
		loadDefaultLists();
	}
});

$("#exportBox").on("click", function() {
	var paste = "";
	for (var species in setdex) {
		for (var set in setdex[species]) {
			if (setdex[species][set].isCustomSet) paste += ExportPokemon(`${species} (${set})`, set) + "\n\n";
		}
	}
	$("textarea.import-team-text").val(paste);
});

$(document).ready(function () {
	var customSets;
	placeBsBtn();
	$("#clearTrash, #clearAllBoxes, #exportBox").prop("disabled", true);
	if (localStorage.customsets) {
		customSets = JSON.parse(localStorage.customsets);
		updateDex(customSets);
		applyIconColors();
		$(allPokemon("#importedSetsOptions")).css("display", "inline");
	} else {
		loadDefaultLists();
	}
});

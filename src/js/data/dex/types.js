var TYPES = {
    normal: {
        id: "normal",
        name: "Normal",
        weak: ["fighting"],
        resist: [],
        immune: ["ghost"]
    },
    fighting: {
        id: "fighting",
        name: "Fighting",
        weak: ["flying", "psychic"],
        resist: ["rock", "bug", "dark"],
        immune: []
    },
    flying: {
        id: "flying",
        name: "Flying",
        weak: ["rock", "electric", "ice"],
        resist: ["fighting", "bug", "grass"],
        immune: ["ground"]
    },
    poison: {
        id: "poison",
        name: "Poison",
        weak: ["ground", "psychic"],
        resist: ["fighting", "poison", "bug", "grass"],
        immune: []
    },
    ground: {
        id: "ground",
        name: "Ground",
        weak: ["water", "grass", "ice"],
        resist: ["poison", "rock"],
        immune: ["electric"]
    },
    rock: {
        id: "rock",
        name: "Rock",
        weak: ["fighting", "ground", "steel", "water", "grass"],
        resist: ["normal", "flying", "poison", "fire"],
        immune: []
    },
    bug: {
        id: "bug",
        name: "Bug",
        weak: ["flying", "rock", "fire"],
        resist: ["fighting", "ground", "grass"],
        immune: []
    },
    ghost: {
        id: "ghost",
        name: "Ghost",
        weak: ["ghost", "dark"],
        resist: ["poison", "bug"],
        immune: ["normal", "fighting"]
    },
    steel: {
        id: "steel",
        name: "Steel",
        weak: ["fighting", "ground", "fire"],
        resist: ["normal", "flying", "rock", "bug", "ghost", "steel", "grass", "psychic", "ice", "dragon", "dark"],
        immune: ["poison"]
    },
    mystery: {
        id: "mystery",
        name: "???",
        weak: [],
        resist: [],
        immune: []
    },
    fire: {
        id: "fire",
        name: "Fire",
        weak: ["ground", "rock", "water"],
        resist: ["bug", "steel", "fire", "grass", "ice"],
        immune: []
    },
    water: {
        id: "water",
        name: "Water",
        weak: ["grass", "electric"],
        resist: ["steel", "fire", "water", "ice"],
        immune: []
    },
    grass: {
        id: "grass",
        name: "Grass",
        weak: ["flying", "poison", "bug", "fire", "ice"],
        resist: ["ground", "water", "grass", "electric"],
        immune: []
    },
    electric: {
        id: "electric",
        name: "Electric",
        weak: ["ground"],
        resist: ["flying", "steel", "electric"],
        immune: []
    },
    psychic: {
        id: "psychic",
        name: "Psychic",
        weak: ["bug", "ghost", "dark"],
        resist: ["fighting", "psychic"],
        immune: []
    },
    ice: {
        id: "ice",
        name: "Ice",
        weak: ["fighting", "rock", "steel", "fire"],
        resist: ["ice"],
        immune: []
    },
    dragon: {
        id: "dragon",
        name: "Dragon",
        weak: ["ice", "dragon"],
        resist: ["fire", "water", "grass", "electric"],
        immune: []
    },
    dark: {
        id: "dark",
        name: "Dark",
        weak: ["fighting", "bug"],
        resist: ["ghost", "dark"],
        immune: ["psychic"]
    },
};
TYPES["???"] = TYPES["mystery"];

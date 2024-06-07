export const usr = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */

usr.difficulty = [
    {"label": "6 - Routine", "dice": 6, "active": false},
    {"label": "5 - Easy", "dice": 5, "active": false},
    {"label": "4 - Normal", "dice": 4, "active": true},
    {"label": "3 - Tricky", "dice": 3, "active": false},
    {"label": "2 - Hard", "dice": 2, "active": false},
    {"label": "1 - Very Hard", "dice": 1, "active": false},
    {"label": "*2 - Extremely Hard", "dice": -2, "active": false},
    {"label": "*3 - Special", "dice": -3, "active": false},
    {"label": "*4 - Special", "dice": -4, "active": false},
];

usr.damageModifier = [
    0,  // 0
    0,  // 1
    0,  // 2
    -1, // 3
    -1, // 4
    -2, // 5
    -2, // 6
    -3, // 7
    -3, // 8
    -4, // 9
    -4, // 10
    -10,// 11
    -10,// 12
];

usr.wounds = {
    "x": {"label": "Stun", "hp": 0},
    "l": {"label": "Light", "hp": 3},
    "m": {"label": "Moderate", "hp": 7},
    "s": {"label": "Serious", "hp": 12},
    "d": {"label": "Deadly", "hp": 16},
};

usr.health = [
    "Healthy",
    "Stable",
    "Unstable",
    "Critical",
    "Dead",
];

usr.speak = [
    "None",
    "Basic",
    "Good",
    "Advanced"
];

usr.write = [
    "None",
    "Basic",
    "Good",
    "Advanced"
];

usr.knowledge = [
    "None",
    "Basic",
    "Good",
    "Advanced"
];

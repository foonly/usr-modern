import {usr} from "./config.mjs";

export function usrRoll(data) {
    const traits = data.actor.system.traits;

    // Get values for trait and specialization if given.
    if (data.trait) {
        const trait = traits[data.trait];
        data.skill = trait.value;
        if (data.spec) {
            trait.spec.forEach(spec => {
                if (data.spec === spec.title) {
                    data.specialization = spec.value;
                }
            });
        }
    }

    if (data.skill <= data.specialization) {
        data.specialization = data.skill - 1;
    }
    if (data.difficulty < 1 && data.difficulty > -2) {
        data.difficulty = -2;
    }
    const nr = Math.abs(data.difficulty);

    const roll = new Roll(`${nr}d10`);
    roll.evaluate({async: false});

    const result = {
        difficulty: data.difficulty,
        skill: data.skill,
        specialization: data.specialization,
        type: 'd10',
        dice: [],
        successes: 0,
        critical: false,
        formula: '',
        total: '',
    }

    let ones = -1;
    let tens = -1;
    let failed = false;

    for (const die of roll.dice[0].results) {
        result.dice.push({value: die.result, success: die.result <= result.skill});
        if (result.difficulty < 0) {
            if (die.result > result.skill) {
                failed = true;
            }
        } else {
            if (die.result <= result.skill) {
                result.successes++;
            }
        }
        if (die.result <= result.specialization) {
            result.successes++;
        }
        if (die.result === 1) {
            ones++;
        }
        if (die.result === 10) {
            tens++;
        }
    }
    if (result.difficulty < 0) {
        if (failed) {
            result.successes = 0;
        } else {
            result.successes++;
        }
    }

    if (ones > 0) {
        result.successes += ones;
        result.critical = true;
    }

    if (tens > 0) {
        result.successes -= tens;
        if (result.successes < 1) {
            result.successes = 0;
            result.critical = true;
        }
    }

    result.formula = `Difficulty: ${result.difficulty} / Skill: ${result.skill}`;
    if (result.specialization > 0) {
        result.formula += ` (${result.specialization})`;
    }
    result.total = (result.critical ? 'Critical ' : '') + (result.successes ? result.successes + ' Successes' : 'Fail');

    const speaker = ChatMessage.getSpeaker({actor: data.actor});

    showRoll(result, speaker, data.flavor);

    if (!result.critical && data.trait && data.actor) {
        let awarded = false;
        if (data.trait) {
            const trait = traits[data.trait];
            if (data.spec) {
                trait.spec.forEach(spec => {
                    if (data.spec === spec.title) {
                        if (spec.value < 3 && (spec.roll < 1 || (spec.roll < 2 && data.difficulty < 4))) {
                            awarded = true;
                            spec.roll++;
                        }
                    }
                });
            }
            if (!awarded) {
                if (trait.value < 7 && (trait.roll < 1 || (trait.roll < 2 && data.difficulty < 4))) {
                    trait.roll++;
                }
            }
        }
        data.actor.update({"system.traits": traits});
    }

    return result;
}

function showRoll(result, speaker, flavor = "") {
    renderTemplate('systems/usr/templates/helpers/roll.hbs', result).then(content => {
        // Prepare chat data
        const messageData = {
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            content,
            sound: CONFIG.sounds.dice,
            speaker,
            flavor,
        };

        const msg = new ChatMessage(messageData);

        ChatMessage.create(msg.toObject(), {rollMode: game.settings.get("core", "rollMode")});
    })

}

export function makeRoll(data) {
    if (data.actor.system.traits) {
        data.traits = [];
        Object.keys(data.actor.system.traits).forEach(key => {
            const trait = data.actor.system.traits[key];
            data.traits.push({
                key: key,
                index: key,
                label: trait.label,
                value: trait.value,
                active: (trait.label === data.label),
            });
            if (trait.hasSpec) {
                trait.spec.forEach((spec, index) => {
                    data.traits.push({
                        key: key,
                        index: `${key}/${spec.title}`,
                        label: ` - ${spec.title}`,
                        value: `${trait.value}/${spec.value}`,
                        active: (spec.title === data.label),
                    });
                })
            }
        })
    }
    data.difficulty = usr.difficulty;
    renderTemplate('systems/usr/templates/helpers/roll-dialog.hbs', data).then(content => {
        let d = new Dialog({
            title: "Custom Roll",
            content,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-dice-d10"></i>',
                    label: "Roll",
                    callback: (html) => {
                        const flavor = html.find("#label")[0].innerHTML ?? 'Custom';
                        const difficulty = parseInt(html.find("#difficulty")[0].value ?? 1);
                        const parts = (html.find("#trait")[0].value ?? '1').split('/');
                        const trait = parts[0];
                        const spec = parts[1] ?? '';

                        usrRoll({
                            flavor,
                            difficulty,
                            trait,
                            spec,
                            actor: data.actor
                        });
                    }
                }
            },
            default: "roll",
        });
        d.options.classes = ["usr", "dialog", "roll"];
        d.render(true);
    });
}

export function rollXp(data) {
    const traits = data.actor.system.traits;
    const trait = traits[data.trait];
    if (data.spec) {
        trait.spec.forEach(spec => {
            if (data.spec === spec.title) {
                // Roll on specialization.
                if (spec.value > 2) {
                    return false;
                }
                let paid = false;
                if (spec.roll > 0) {
                    spec.roll--;
                    paid = true;
                } else if (data.actor.system.xp > 0) {
                    data.actor.update({"system.xp": data.actor.system.xp - 1});
                    paid = true;
                }
                if (paid) {
                    const target = spec.value * 3 + 11;
                    const roll = new Roll("2d10");
                    roll.evaluate({async: false});
                    if (roll.total > target) {
                        spec.xp++;
                        if (spec.xp > 2) {
                            spec.value++;
                            spec.xp -= 3;
                        }
                    }
                    const label = `Roll for XP on ${spec.title} with value of ${spec.value}. Needs a result over ${target}.`
                    roll.toMessage({
                        speaker: ChatMessage.getSpeaker({actor: data.actor}),
                        flavor: label,
                        rollMode: game.settings.get("core", "rollMode"),
                    });
                }
                data.actor.update({"system.traits": traits});
            }
        });
    } else {
        // Roll on trait.
        if (trait.value > 6) {
            return false;
        }
        let paid = false;
        if (trait.roll > 0) {
            trait.roll--;
            paid = true;
        } else if (data.actor.system.xp > 0) {
            data.actor.update({"system.xp": data.actor.system.xp - 1});
            paid = true;
        }
        if (paid) {
            const target = trait.value * 2 + 6;
            const roll = new Roll("2d10");
            roll.evaluate({async: false});
            if (roll.total > target) {
                trait.xp++;
                if (trait.xp > 4) {
                    trait.value++;
                    trait.xp -= 5;
                }
            }
            const label = `Roll for XP on ${trait.label} with value of ${trait.value}. Needs a result over ${target}.`
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: data.actor}),
                flavor: label,
                rollMode: game.settings.get("core", "rollMode"),
            });
        }
        data.actor.update({"system.traits": traits});
    }
}

export function rollChip(actor, dice = 1) {
    const chips = actor.system.chips;
    const total = chips.white + chips.green + chips.blue + chips.red + chips.black;
    const roll = new Roll(`${dice}d6cs>${total}`);
    roll.evaluate({async: false});
    const result = {
        type: 'd6',
        dice: [],
        successes: roll.total,
        formula: `${dice}D6 against ${total} chips.`,
        total: 'No Chip',
    }
    for (const die of roll.dice[0].results) {
        result.dice.push({value: die.result, success: die.result > total});
    }
    if (roll.total > 0) {
        const newChips = {
            white: chips.white,
            green: chips.green,
            blue: chips.blue,
            red: chips.red,
            black: chips.black
        };
        const chip = new Roll("1d5");
        chip.evaluate({async: false});
        switch (chip.total) {
            case 1:
                newChips.white++;
                result.total = "White Chip"
                break;
            case 2:
                newChips.green++;
                result.total = "Green Chip"
                break;
            case 3:
                newChips.blue++;
                result.total = "Blue Chip"
                break;
            case 4:
                newChips.red++;
                result.total = "Red Chip"
                break;
            case 5:
                newChips.black++;
                result.total = "Black Chip"
                break;
        }
        actor.update({"system.chips": newChips});
    }
    const speaker = ChatMessage.getSpeaker({actor});
    showRoll(result, speaker, 'Fate Chip');
}

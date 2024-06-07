import { usr } from "./config.mjs";

export async function useChip(data) {
  const confirmation = await Dialog.confirm({
    content: `Are you sure you want to use your ${data.type} chip?`
  });

  if (!confirmation) {
    return Promise.reject("Not confirmed");
  }

  const newChips = {
    white: data.actor.system.chips.white,
    green: data.actor.system.chips.green,
    blue: data.actor.system.chips.blue,
    red: data.actor.system.chips.red,
    black: data.actor.system.chips.black
  };

  if (newChips[data.type] > 0) {
    newChips[data.type]--;
    data.actor.update({"system.chips": newChips});
    return data.type;
  }
}

export function editAsset(actor, index = -1) {
  const assets = actor.system.assets ?? [];
  let name = "";
  let amount = 0;
  if (index > -1) {
    const asset = assets[index];
    name = asset.name;
    amount = parseInt(asset.amount);
  }
  const data = {
    name,
    amount,
  };

  renderTemplate(
    "systems/usr/templates/helpers/asset-dialog.hbs",
    data
  ).then((content) => {
    let d = new Dialog({
      title: "Asset",
      content,
      buttons: {
        save: {
          icon: '<i class="fas fa-earth-europe"></i>',
          label: "Save",
          callback: (html) => {
            const name = html.find("#asset")[0].value;
            const amount = parseInt(html.find("#amount")[0].value);

            if (name.length) {
              if (index === -1) {
                assets.push({
                  name,
                  amount,
                });
              } else {
                const asset = assets[index];
                asset.name = name;
                asset.amount = amount;
              }
              actor.update({ "system.assets": assets });
            }
          },
        },
      },
      default: "save",
    });
    d.options.classes = ["usr", "dialog", "language"];
    d.render(true);
  });
}

export function editLanguage(actor, index = -1) {
  const languages = actor.system.languages ?? [];
  let name = "";
  let speak = 0;
  let write = 0;
  if (index > -1) {
    const language = languages[index];
    name = language.name;
    speak = parseInt(language.speak);
    write = parseInt(language.write);
  }
  const data = {
    name,
    speakList: usr.speak.map((label, i) => {
      return { label, active: i === speak };
    }),
    writeList: usr.write.map((label, i) => {
      return { label, active: i === write };
    }),
  };

  renderTemplate(
    "systems/usr/templates/helpers/language-dialog.hbs",
    data
  ).then((content) => {
    let d = new Dialog({
      title: "Language",
      content,
      buttons: {
        save: {
          icon: '<i class="fas fa-earth-europe"></i>',
          label: "Save",
          callback: (html) => {
            const name = html.find("#language")[0].value;
            const speak = parseInt(html.find("#speak")[0].value);
            const write = parseInt(html.find("#write")[0].value);

            if (name.length) {
              if (index === -1) {
                languages.push({
                  name,
                  speak,
                  write,
                });
              } else {
                const language = languages[index];
                language.name = name;
                language.speak = speak;
                language.write = write;
              }
              languages.sort(languageSort);
              actor.update({ "system.languages": languages });
            }
          },
        },
      },
      default: "save",
    });
    d.options.classes = ["usr", "dialog", "language"];
    d.render(true);
  });
}

function languageSort(a, b) {
  if (a.speak !== b.speak) {
    return b.speak - a.speak;
  }
  if (a.write !== b.write) {
    return b.write - a.write;
  }
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

export function editKnowledge(actor, index = -1) {
  const knowledge = actor.system.knowledge ?? [];
  let name = "";
  let level = 0;

  if (index > -1) {
    const know = knowledge[index];
    name = know.name;
    level = parseInt(know.level);
  }

  const data = {
    name,
    levelList: usr.knowledge.map((label, i) => {
      return { label, active: i === level };
    }),
  };

  renderTemplate(
    "systems/usr/templates/helpers/knowledge-dialog.hbs",
    data
  ).then((content) => {
    let d = new Dialog({
      title: "Knowledge",
      content,
      buttons: {
        save: {
          icon: '<i class="fas fa-book"></i>',
          label: "Save",
          callback: (html) => {
            const name = html.find("#knowledge")[0].value;
            const level = html.find("#level")[0].value;
            if (name.length) {
              if (index === -1) {
                knowledge.push({
                  name,
                  level,
                });
              } else {

                knowledge[index].name = name;
                knowledge[index].level = level;
              }
              knowledge.sort(knowledgeSort);
              actor.update({ "system.knowledge": knowledge });
            }
          },
        },
      },
      default: "save",
    });
    d.options.classes = ["usr", "dialog", "knowledge"];
    d.render(true);
  });
}

function knowledgeSort(a, b) {
  if (a.level !== b.level) {
    return b.level - a.level;
  }
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

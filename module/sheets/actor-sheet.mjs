import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from "../helpers/effects.mjs";
import { makeRoll, rollChip, rollXp, usrRoll } from "../helpers/roll.mjs";
import { addDamage, addHealingPoints, removeStun } from "../helpers/damage.mjs";
import { TraitSheet } from "./trait-sheet.mjs";
import {
  editLanguage,
  editKnowledge,
  editAsset,
  useChip,
} from "../helpers/dialog.mjs";
import { usr } from "../helpers/config.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class usrActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["usr", "sheet", "actor"],
      template: "systems/usr/templates/actor/actor-sheet.hbs",
      width: 600,
      height: 600,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "traits",
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/usr/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type === "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type === "npc") {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    context.chipsList = [];
    for (const color of Object.keys(context.system.chips)) {
      for (let i = 0; i < context.system.chips[color]; i++) {
        context.chipsList.push(color);
      }
    }
    context.languageList = context.system.languages.map((lang) => {
      return {
        name: lang.name,
        speak: usr.speak[lang.speak],
        write: usr.write[lang.write],
      };
    });
    context.knowledgeList = context.system.knowledge.map((know) => {
      return {
        name: know.name,
        level: usr.knowledge[know.level],
      };
    });
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const melee = [];
    const ranged = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === "item") {
        gear.push(i);
      }
      // Append to melee weapons.
      else if (i.type === "melee") {
        melee.push(i);
      }
      // Append to ranged weapons.
      else if (i.type === "ranged") {
        ranged.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.melee = melee;
    context.ranged = ranged;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find(".item-edit").click((event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const item = this.actor.items.get(element.dataset.itemId);
      item.sheet.render(true);
    });

    // Roll dialog.
    html.find(".roll-dialog").click((ev) => {
      const element = ev.currentTarget;
      const data = {
        label: element.dataset.label,
        skill: element.dataset.rollUsr,
        actor: this.actor,
      };
      makeRoll(data);
    });

    html.find(".edit-asset").click((event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element.dataset;
      editAsset(this.actor, dataset.index ?? -1);
    });

    html.find(".edit-language").click((event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element.dataset;
      editLanguage(this.actor, dataset.index ?? -1);
    });

    html.find(".edit-knowledge").click((event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element.dataset;
      editKnowledge(this.actor, dataset.index ?? -1);
    });

    html.find(".add-heal").click((ev) => {
      addHealingPoints(this.actor);
    });

    html.find(".add-damage").click((ev) => {
      addDamage(this.actor);
    });

    html.find(".remove-stun").click((ev) => {
      removeStun(this.actor);
    });

    html.find(".roll-xp").click((event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element.dataset;
      rollXp({
        actor: this.actor,
        trait: dataset.trait,
        spec: dataset.spec ?? "",
      });
    });

    html.find(".roll-chip").click((event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element.dataset;
      rollChip(this.actor, dataset.rollChip);
    });

    html.find(".clickable-chip").click((event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element.dataset;
      const actor = this.actor;
      useChip({ actor, type: dataset.chip }).then((r) => {
        const speaker = ChatMessage.getSpeaker({ actor });

        const content = `Uses ${r} fate chip.`;

        // Prepare chat data
        const messageData = {
          user: game.user.id,
          content,
          speaker,
          flavor: "Fate Chip.",
        };

        const msg = new ChatMessage(messageData);

        ChatMessage.create(msg.toObject(), {
          rollMode: game.settings.get("core", "rollMode"),
        });

        console.log(r);
      });
    });

    // Rollable abilities.
    html.find(".rollable").click(this._onRoll.bind(this));

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Edit trait
    html.find(".trait-edit").click((ev) => {
      const key = ev.currentTarget.dataset.trait;
      const trait = this.actor.system.traits[key];
      new TraitSheet(trait, key, this.actor).render(true);
    });

    // Add Inventory Item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find(".item-delete").click((event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const item = this.actor.items.get(element.dataset.itemId);
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html
      .find(".effect-control")
      .click((ev) => onManageActiveEffect(ev, this.actor));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType && dataset.rollType == "item") {
      const itemId = element.closest(".item").dataset.itemId;
      const item = this.actor.items.get(itemId);
      if (item) return item.roll();

      // USR Roll.
    } else if (dataset.rollUsr) {
      const data = {
        actor: this.actor,
        difficulty: parseInt(dataset.rollUsr),
        trait: dataset.trait ?? "",
        spec: dataset.spec ?? "",
        flavor: dataset.label ?? "",
      };

      // Make roll and calculate.
      usrRoll(data);

      return true;
    } else if (dataset.roll) {
      // Handle rolls that supply the formula directly.
      let label = dataset.label ? `[ability] ${dataset.label}` : "";
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode"),
      });
      return roll;
    }
  }
}

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([

        // Actor partials.
        "systems/usr/templates/actor/parts/actor-biography.hbs",
        "systems/usr/templates/actor/parts/actor-combat.hbs",
        "systems/usr/templates/actor/parts/actor-traits.hbs",
        "systems/usr/templates/actor/parts/actor-trait.hbs",
        "systems/usr/templates/actor/parts/actor-knowledge.hbs",
        "systems/usr/templates/actor/parts/actor-items.hbs",
    ]);
};

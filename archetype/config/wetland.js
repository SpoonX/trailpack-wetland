/**
 * Wetland Configuration
 * (app.config.wetland)
 *
 * Configure the ORM layer, connections, etc.
 *
 * @see {@link https://wetland.spoonx.org/configuration.html}
 */
module.exports = {
  debug  : false,
  mapping: {
    // Automatically convert camel-cased property names to underscored column-names.
    // defaultNamesToUnderscore: false,

    // Default values for mappings.
    // Useful to set auto-persist (defaults to empty array).
    defaults: {cascades: ['persist']}
  },
  stores: {
    // Use the key "defaultStore" to configure the, you got it, default store.
    // defaultStore: {
    //   client          : 'mysql',
    //   connection      : {
    //     user: 'root',
    //     database: 'tmp'
    //   }
    // }
  }
};

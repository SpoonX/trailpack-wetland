'use strict';

const DatastoreTrailpack = require('trailpack/datastore');
const path               = require('path');
const Wetland            = require('wetland').Wetland;

module.exports = class WetlandTrailpack extends DatastoreTrailpack {

  /**
   * Validate configured stores
   */
  validate() {
    if (!this.app.config.database || !this.app.config.database.stores) {
      return this.app.log.logger.warn('No store configured.');
    }
  }

  /**
   * Instantiate wetland with config
   */
  configure() {
    this.app.config.database.orm = 'wetland';

    let stores       = this.app.config.database.stores;
    let defaultStore = this.app.config.database.models.defaultStore;
    let entities     = Object.keys(this.app.api.entities)
      .map(entity => this.app.api.entities[entity]);

    this.wetland = new Wetland({
      stores      : stores,
      entities    : entities,
      defaultStore: defaultStore
    });
  }

  /**
   * Run migrations
   */
  initialize() {
    super.initialize();

    this.orm     = this.wetland;
    this.app.orm = this.wetland;

    let migration = this.app.config.database.models.migrate;

    if (!migration || migration === 'safe') {
      return;
    }

    if (this.app.config.env !== 'development') {
      return this.app.log
        .warn(`Refusing to run dev migrations because environment '${this.app.config.env}' isn't development.`);
    }

    if (migration !== 'alter') {
      return this.app.log.warn('Not running dev migrations. The only support method is "alter".');
    }

    this.app.log.verbose('Starting dev migrations...');

    return this.wetland.getMigrator().devMigrations()
      .then(() => this.app.log.verbose('Dev migrations complete.'))
      .catch(error => this.app.log.error(`Dev migrations failed: ${error}`));
  }

  constructor(app) {
    super(app, {
      config: require('./config'),
      api   : require('./api'),
      pkg   : require('./package')
    });
  }
};

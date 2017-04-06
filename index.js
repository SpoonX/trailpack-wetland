'use strict';

const DatastoreTrailpack = require('trailpack/datastore');
const Wetland            = require('wetland').Wetland;
const Homefront          = require('homefront').Homefront;

module.exports = class WetlandTrailpack extends DatastoreTrailpack {

  /**
   * Validate configured stores
   */
  validate() {
    if (!this.app.config.database || !this.app.config.database.stores) {
      return Promise.reject(new Error('No store configured.'));
    }

    if (!this.app.config.wetland && !this.app.config.database) {
      return Promise.reject(new Error(`Wetland config not found.
        Make sure you have a config file for wetland and try again.`));
    }
  }

  /**
   * Instantiate wetland with config
   */
  configure() {
    let config          = this.app.config;
    config.database.orm = 'wetland';
    let databaseConfig  = new Homefront(config.database);

    if (config.wetland) {
      databaseConfig.merge(config.wetland);
    }

    this.wetland = new Wetland(databaseConfig);
  }

  /**
   * Run migrations
   */
  initialize() {
    super.initialize();

    this.orm     = this.wetland;
    this.app.orm = this.wetland;

    let config    = this.wetland.getConfig();
    let migration = config.fetch('migrate') || config.fetch('models.migrate');

    if (!migration || migration === 'safe') {
      return Promise.resolve();
    }

    if (this.app.config.env !== 'development') {
      let message = `Refusing to run dev migrations because environment '${this.app.config.env}' isn't development.`;
      return Promise.reject(new Error(message));
    }

    if (migration !== 'alter') {
      return Promise.reject(new Error('Not running dev migrations. The only support method is "alter".'));
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

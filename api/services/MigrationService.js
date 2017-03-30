'use strict';

const Service = require('trails-service');

/**
 * @module FootprintService
 * @description TODO document Service
 */
module.exports = class MigrationService extends Service {

  getMigrations () {
    return this.app.orm.getMigrator().allMigrations();
  }

  createSnapshot (name, devSnapshot) {
    return this.app.orm.getSnapshotManager().create(name, devSnapshot);
  }

  createMigration (name, code) {
    return this.app.orm.getMigrator().create(name, code);
  }

  devMigrations () {
    return this.app.orm.getMigrator().devMigrations()
      .then(() => this.app.log.verbose('Dev migration complete.'))
      .catch(error => this.app.log.error(`Dev migration failed: ${error}`));
  }

  run (direction, action, migrations) {
    return this.app.orm.getMigrator().run(direction, action, migrations);
  }

  revert (action) {
    return this.app.orm.getMigrator().run(action);
  }
};

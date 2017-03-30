'use strict';

const Service = require('trails-service');
const util    = require('util');

/**
 * @module FootprintService
 * @description TODO document Service
 */
module.exports = class FootprintService extends Service {

  create(modelName, values, options) {
    let manager = this.app.orm.getManager();
    let entity  = manager.getEntity(modelName);

    if (!entity) {
      return this.app.log.error(`No registered entity found for ${modelName}`);
    }

    let newRecord = this.app.orm.getPopulator(manager).assign(entity, values, null, true);

    manager.persist(newRecord).flush()
      .then(result => this.app.log.info(`New record created: ${util.inspect(newRecord, false, 8)}`))
      .catch(this.app.log.error);
  }

  find(modelName, criteria, options) {
    let manager = this.app.orm.getManager();

    manager.getRepository(modelName).find(criteria, options)
      .then(records => {
        if (!records) {
          return this.app.log.info('No records found.');
        }

        this.app.log.info(records);
      })
      .catch(this.app.log.error);
  }

  findOne(modelName, criteria, options) {
    let manager = this.app.orm.getManager();

    manager.getRepository(modelName).findOne(criteria, options)
      .then(records => {
        if (!records) {
          return this.app.log.info('No record found.');
        }

        this.app.log.info(records);
      })
      .catch(this.app.log.error);
  }

  update(modelName, criteria, values, options, recursive) {
    let manager   = this.app.orm.getManager();
    let populator = this.app.orm.getPopulator(manager);
    let entity    = manager.getEntity(modelName);

    populator.findDataForUpdate(criteria, entity, options)
      .then(base => {
        if (!base) {
          return this.app.log.info(`No record found with the specified criteria.`);
        }

        if (typeof recursive === 'undefined') {
          recursive = true;
        }

        populator.assign(entity, values, base, recursive);

        return manager.flush().then(this.app.log.info(util.inspect(base, false, 8)));
      })
      .catch(this.app.log.error);
  }

  destroy(modelName, criteria, options) {
    let manager = this.app.orm.getManager();

    manager.getRepository(modelName).findOne(criteria, options)
      .then(record => {
        if (!record) {
          return this.app.log.error('No record found with the specified criteria.');
        }

        return manager.remove(record).flush()
          .then(this.app.log.info('Record removed.'));
      })
      .catch(this.app.log.error);
  }

  createAssociation(parentModelName, parentId, childAttributeName, values, options) {
    let manager = this.app.orm.getManager();
    let parent  = manager.getEntities()[parentModelName];

    if (!parent) {
      return this.app.log.info('Parent entity not found or not yet registered');
    }

    let mapping  = parent.mapping;
    let relation = mapping.getRelation(childAttributeName);

    if (!relation) {
      return this.app.log.error(`Missing required relationship: ${childAttributeName}`);
    }

    let ChildEntity = manager.getEntity(relation.targetEntity);

    if (!ChildEntity) {
      return this.app.log.error(`Entity '${relation.targetEntity}' not found or not yet registered.`);
    }

    let child = new ChildEntity();

    Object.assign(child, values);
    manager.persist(child);

    child = Promise.resolve(child);


    child.then(resolvedChild => {
      let entity = manager.getEntity(parentModelName);

      return manager.getRepository(entity).findOne(parentId, {populate: childAttributeName}).then(result => {
        if (!result) {
          return this.app.log.error('Parent record not found');
        }

        result[childAttributeName].add(resolvedChild);

        return manager.flush().then(() => this.app.log.info(result));
      });
    }).catch(this.app.log.error);
  }

  findAssociation(parentModelName, parentId, childAttributeName, criteria = {}, options) {
    let manager = this.app.orm.getManager();
    let parent  = manager.getEntities()[parentModelName];

    if (!parent) {
      return this.app.log.info('Parent entity not found or not yet registered');
    }

    let relation = parent.mapping.getRelation(childAttributeName);

    if (!relation) {
      return this.app.log.error(`Missing required relationship: ${childAttributeName}`);
    }

    return manager.getRepository(parentModelName)
      .find(parentId, {populate: childAttributeName})
      .then(result => {
        if (!result) {
          return this.app.log.error('No association found');
        }

        this.app.log.info(result);
        return result;
      })
      .catch(this.app.log.error);
  }

  updateAssociation(parentModelName, parentId, childAttributeName, criteria, values, options) {
    let manager = this.app.orm.getManager();
    let parent  = manager.getEntities()[parentModelName];

    if (!parent) {
      return this.app.log.info('Parent entity not found or not yet registered');
    }

    let relation = parent.mapping.getRelation(childAttributeName);

    if (!relation) {
      return this.app.log.error(`Missing required relationship: ${childAttributeName}`);
    }

    if (!values) {
      return this.app.log.error('Missing values to update.');
    }

    let parentPK        = parent.mapping.getPrimaryKey();
    let aliasedCriteria = {};

    Object.keys(criteria).forEach(key => {
      aliasedCriteria[`c.${key}`] = criteria[key];
    });

    Object.assign(aliasedCriteria, {[`p.${parentPK}`]: parentId});

    return manager.getRepository(parentModelName)
      .getQueryBuilder('p')
      .select('p', 'c')
      .innerJoin(childAttributeName, 'c')
      .where(aliasedCriteria)
      .getQuery()
      .getResult()
      .then(result => {
        if (!result) {
          this.app.log.error('No matching association found.');
        }

        let parentEntity = manager.getEntity(parentModelName);
        let data         = Object.assign(new parentEntity(), result[0]);

        Object.assign(data[childAttributeName][0], values);

        manager.flush().then(this.app.log.info('Association updated.'));
      })
      .catch(this.app.log.error);
  }

  destroyAssociation(parentModelName, parentId, childAttributeName, criteria, options) {
    let manager = this.app.orm.getManager();
    let parent  = manager.getEntities()[parentModelName];

    if (!parent) {
      return this.app.log.info('Parent entity not found or not yet registered');
    }

    let relation = parent.mapping.getRelation(childAttributeName);

    if (!relation) {
      return this.app.log.error(`Missing required relationship: ${childAttributeName}`);
    }

    return manager.getRepository(parentModelName).findOne(parentId, {populate: childAttributeName})
      .then(result => {
        if (!result) {
          return this.app.log.error('Record not found.');
        }

        let properties = Object.keys(criteria);
        let child      = manager.getEntities()[relation.targetEntity];
        let childPk    = child.mapping.getPrimaryKey();

        let toRemove = result[childAttributeName].filter(child => {
          return properties.every(property => child[property] === criteria[property]);
        })[0];

        return manager.getRepository(relation.targetEntity)
          .getQueryBuilder()
          .remove()
          .where({[childPk]: toRemove[childPk]})
          .getQuery()
          .getResult()
          .then(this.app.log.info('Association destroyed.'));
      })
      .catch(this.app.log.error);
  };
};

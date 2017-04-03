'use strict';

const Service     = require('trails-service');
const EntityError = require('../../lib').EntityError;
const util        = require('util');

/**
 * @module FootprintService
 * @description Footprint service using Wetland ORM
 */
module.exports = class FootprintService extends Service {

  /**
   * Creates a new record
   *
   * @param {string} modelName
   * @param {{}}     values
   * @param {{}}     [options]
   *
   * @returns {Promise.<T>}
   */
  create(modelName, values, options) {
    let manager = this.app.orm.getManager();
    let entity  = manager.getEntity(modelName);

    if (!entity) {
      return Promise.reject(new EntityError('E_NOT_FOUND', `No registered entity found for ${modelName}`));
    }

    let newRecord = this.app.orm.getPopulator(manager).assign(entity, values, null, options);

    return manager.persist(newRecord).flush().then(() => newRecord);
  }

  /**
   * Find all records that satisfy the given criteria.
   * If a primary key is given, the return value will be a single Object instead of an Array.
   *
   * @param {string}           modelName
   * @param {{}|string|number} criteria
   * @param {{}}               [options]
   *
   * @returns {Promise.<T>}
   */
  find(modelName, criteria, options) {
    let manager = this.app.orm.getManager();

    if (typeof criteria === 'string' || typeof criteria === 'number') {
      return manager.getRepository(modelName).findOne(criteria, options);
    }

    return manager.getRepository(modelName).find(criteria, options);
  }

  /**
   * Update one or multiple records depending on the type of given criteria.
   *
   * @param {string}           modelName
   * @param {{}|string|number} criteria
   * @param {{}}               values
   * @param {{}}               [options]
   *
   * @returns {Promise.<T>}
   */
  update(modelName, criteria, values, options = {}) {
    let manager    = this.app.orm.getManager();
    let populator  = this.app.orm.getPopulator(manager);
    let entity     = manager.getEntity(modelName);
    let repository = manager.getRepository(modelName);
    let find       = typeof criteria === 'string' || typeof criteria === 'number'
      ? repository.findOne(criteria, options)
      : repository.find(criteria, options);

    return find.then(result => {
      if (!result) {
        return Promise.reject(new EntityError('E_NOT_FOUND', 'No record found with the specified criteria.'));
      }

      options.recursive = options.recursive || 1;

      Array.isArray(result)
        ? result.map(result => populator.assign(entity, values, result, options.recursive))
        : populator.assign(entity, values, result, options.recursive);

      return manager.flush();
    });
  }

  /**
   * Delete one or multiple records depending on the type of given criteria.
   *
   * @param {string}           modelName
   * @param {{}|string|number} criteria
   * @param {{}}               options
   *
   * @returns {Promise<T>|Promise.<Object>}
   */
  destroy(modelName, criteria, options) {
    let manager    = this.app.orm.getManager();
    let repository = manager.getRepository(modelName);
    let find       = typeof criteria === 'string' || typeof criteria === 'number'
      ? repository.findOne(criteria, options)
      : repository.find(criteria, options);

    return find.then(result => {
      if (!result) {
        return this.app.log.error('No record found with the specified criteria.');
      }

      Array.isArray(result)
        ? result.map(result => manager.remove(result))
        : manager.remove(result);

      return manager.flush();
    });
  }

  /**
   * Create a record and associate it with an existent parent
   *
   * @param {string}        parentModelName
   * @param {string|number} parentId
   * @param {string}        childAttributeName
   * @param {{}}            values
   * @param {{}}            [options]
   *
   * @returns {Promise<T>|Promise.<Object>}
   */
  createAssociation(parentModelName, parentId, childAttributeName, values, options) {
    let manager = this.app.orm.getManager();
    let parent  = manager.getEntities()[parentModelName];

    if (!parent) {
      return Promise.reject(new EntityError('E_NOT_FOUND', `Entity '${parentModelName}' not found.`));
    }

    let relation = parent.mapping.getRelation(childAttributeName);

    if (!relation) {
      return Promise.reject(new EntityError('E_NOT_FOUND', `Association ${childAttributeName} not found.`));
    }

    let childEntity = manager.getEntity(relation.targetEntity);

    if (!childEntity) {
      return Promise.reject(new EntityError('E_NOT_FOUND', `Entity '${relation.targetEntity}' not found.`));
    }

    return manager.getRepository(parent.entity).findOne(parentId, {populate: childAttributeName})
      .then(result => {
        if (!result) {
          return Promise.reject(new EntityError('E_NOT_FOUND', 'No record found with the specified criteria.'));
        }

        let recursive = options && options.recursive ? options.recursive : 1;
        let child     = this.app.orm.getPopulator(manager).assign(childEntity, values, null, recursive);

        result[childAttributeName].add(child);

        return manager.flush().then(() => result);
      });
  }

  /**
   *
   * Find entity's associations based on given id or criteria
   *
   * /parent/:id/child/:id
   * /parent/:id/child?field=value
   *
   * @param {string}        parentModelName
   * @param {string|number} parentId
   * @param {string}        childAttributeName
   * @param {{}}            criteria
   * @param {{}}            [options]
   *
   * @returns {Promise<any>|Promise.<{}[]>}
   */
  findAssociation(parentModelName, parentId, childAttributeName, criteria, options = {}) {
    let manager  = this.app.orm.getManager();
    let parent   = manager.getEntities()[parentModelName];
    let parentPk = parent.mapping.getPrimaryKey();

    if (!parent) {
      return Promise.reject(new EntityError('E_NOT_FOUND', `Entity '${parentModelName}' not found.`));
    }

    let relation = parent.mapping.getRelation(childAttributeName);

    if (!relation) {
      return Promise.reject(new EntityError('E_NOT_FOUND', `Association ${childAttributeName} not found.`));
    }

    let child             = manager.getEntities()[relation.targetEntity];
    let childPk           = child.mapping.getPrimaryKey();
    let repository        = manager.getRepository(parentModelName);
    let queryBuilder      = repository.getQueryBuilder('p');
    let childQueryBuilder = queryBuilder.where({'p': parentId}).populate(childAttributeName);
    let childAlias        = childQueryBuilder.getAlias();
    criteria              = typeof criteria === 'string' || typeof criteria === 'number'
      ? {[childPk]: criteria} : criteria;

    repository.applyOptions(childQueryBuilder, options);

    childQueryBuilder.select(childAlias).where(criteria);

    return queryBuilder.getQuery().getResult();
  }

  /**
   *
   * Update association(s) based on given primary key or criteria
   *
   * @param {string}        parentModelName
   * @param {string|number} parentId
   * @param {string}        childAttributeName
   * @param {{}}            criteria
   * @param {{}}            values
   * @param {{}}            [options]
   *
   * @returns {Promise.<T>}
   */
  updateAssociation(parentModelName, parentId, childAttributeName, criteria, values, options = {}) {
    return this.findAssociation(parentModelName, parentId, childAttributeName, criteria, options)
      .then(result => {
        if (!result) {
          return Promise.reject(new EntityError('E_NOT_FOUND', 'No record found with the specified criteria.'));
        }

    return this.findAssociation(parentModelName, parentId, childAttributeName, criteria, options).then(result => {
      result            = result[0];
      let manager       = this.app.orm.getManager();
      let populator     = this.app.orm.getPopulator(manager);
      let parent        = manager.getEntities()[parentModelName];
      let relation      = parent.mapping.getRelation(childAttributeName);
      let childEntity   = manager.getEntity(relation.targetEntity);
      options.recursive = options.recursive || 1;

      let updatedChild = Array.isArray(result[childAttributeName])
        ? result[childAttributeName].map(child => populator.assign(childEntity, values, child, options.recursive - 1))
        : populator.assign(childEntity, values, result[childAttributeName], options.recursive - 1);

      populator.assign(parent.entity, {[childAttributeName]: updatedChild}, result, options.recursive);

      return manager.flush().then(() => result);
    });
  }

  /**
   * Destroy association(s) based on given primary key or criteria
   *
   * @param {string}        parentModelName
   * @param {string|number} parentId
   * @param {string}        childAttributeName
   * @param {{}}            criteria
   * @param {{}}            [options]
   *
   * @returns {Promise.<T>}
   */
  destroyAssociation(parentModelName, parentId, childAttributeName, criteria, options) {
    return this.findAssociation(parentModelName, parentId, childAttributeName, criteria, options)
      .then(result => {
        if (!result) {
          return Promise.reject(new EntityError('E_NOT_FOUND', 'No record found with the specified criteria.'));
        }

      Array.isArray(result[childAttributeName])
        ? result[childAttributeName].map(child => manager.remove(child))
        : manager.remove(result[childAttributeName]);

      return manager.flush().then(() => result);

    });
  }
};

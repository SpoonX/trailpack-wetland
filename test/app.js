'use strict';

const _            = require('lodash');
const smokesignals = require('smokesignals');
const User         = require('./entities/User');
const List         = require('./entities/List');
const Todo         = require('./entities/Todo');

module.exports = _.defaultsDeep({
  pkg: {
    name: 'trailpack-wetland-test'
  },
  api: {
    entities: {
      User: User,
      List: List,
      Todo: Todo
    }
  },
  config: {
    main: {
      packs: [
        require('../')
      ]
    },
    wetland: {
      // debug : true,
      stores: {
        defaultStore: {
          client    : 'mysql',
          connection: {
            user    : 'root',
            host    : 'localhost',
            database: 'trailpack_wetland'
          }
        }
      },
      entities: [User, List, Todo]
    },
    database: {
      migrate: 'alter'
    }

  }
}, smokesignals.FailsafeConfig);

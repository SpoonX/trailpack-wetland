module.exports = class Todo {
  static setMapping(mapping) {
    mapping.forProperty('id').primary().increments();

    mapping.forProperty('list').manyToOne({targetEntity: require('./List'), inversedBy: 'todos'});
    mapping.field('task', {type: 'string'});
    mapping.field('done', {type: 'boolean', nullable: true});
    mapping.oneToOne('creator', {targetEntity: require('./User')});
  }
};

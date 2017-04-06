module.exports = class User {
  static setMapping(mapping) {
    mapping.forProperty('id').primary().increments();
    mapping.field('name', {type: 'string', size: 24});
  }
};

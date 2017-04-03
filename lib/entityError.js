module.exports = class EntityError extends Error {
  constructor(code, message, errors) {
    super(message);
    this.code = code;
    this.name = 'Entity error';
    this.errors = errors;

    Object.defineProperty(EntityError.prototype, 'message', {
      configurable: true,
      enumerable: true
    });
  }
};

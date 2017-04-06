'use strict';

const assert = require('assert');

describe('Trailpack', () => {
  let pack;

  before(() => {
    pack = global.app.packs.wetland;
  });

  it('should be loaded into the app.packs collection', () => {
    assert(pack);

  });
});

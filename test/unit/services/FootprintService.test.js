'use strict';
/* global describe, it */
const assert = require('assert');

describe('FootprintService', () => {
  let FootprintService;

  before(() => {
    FootprintService = global.app.services.FootprintService;
  });

  const list = {
    name : 'Chores',
    done : false,
    todos: [
      {
        task   : 'Write tests',
        done   : false,
        creator: 1
      },
      {
        task   : 'Buy cheese',
        done   : true,
        creator: 1
      }
    ]
  };

  const listNested = {
    name : 'Goals',
    done : false,
    todos: [
      {
        task   : 'Pet all the cats',
        done   : false,
        creator: {
          name: 'Wesley'
        }
      },
      {
        task   : 'Water plants',
        done   : false,
        creator: {
          name: 'Frank'
        }
      }
    ]
  };

  const listDestroy = {
    name : 'Destroy',
    todos: [
      {
        task: 'destroy me',
        done: false
      },
      {
        task: 'destroy me',
        done: false
      },
      {
        task: 'destroy me',
        done: false
      }
    ]
  };

  describe('#create', () => {
    it('should insert a record', () => {
      return FootprintService.create('User', {name: 'Raphaela'})
      .then(user => {
        assert.equal(user.name, 'Raphaela');
      });
    });

    it('should insert a record with child', () => {
      return FootprintService.create('List', list, {recursive: 2})
      .then(list => {
        assert.equal(list.name, 'Chores');
        assert.equal(list.todos.length, 2);
        assert.equal(list.todos[0].task, 'Write tests');
      });
    });

    it('should insert a record with nested children', () => {
      return FootprintService.create('List', listNested, {recursive: 2})
      .then(list => {
        assert.equal(list.name, 'Goals');
        assert.equal(list.todos.length, 2);
        assert.equal(list.todos[0].task, 'Pet all the cats');
        assert.equal(list.todos[0].creator.name, 'Wesley');
      });
    });

    it('should return a not found error', () => {
      let create = () => FootprintService.create('Unknown', {name: 'Cake'});

      assert.throws(create, Error);
    });
  });

  describe('#find', () => {
    it('should find a single record by id', () => {
      let id;
      return FootprintService.create('User', {name: 'Raphaela'})
      .then(result => {
        id = result.id;
        return FootprintService.find('User', id);
      })
      .then(result => {
        assert.equal(result.name, 'Raphaela');
        assert.equal(result.id, id);
      });
    });

    it('should find multiple records by criteria', () => {
      return FootprintService.find('User', {name: 'Raphaela'})
      .then(results => {
        assert(Array.isArray(results));
        assert(results.length >= 1);
        assert.equal(results[0].name, 'Raphaela');
      });
    });

    it('should find one populated record', () => {
      return FootprintService.find('List', 1, {populate: 'todos'})
      .then(result => {
        assert(result.todos);
        assert.equal(result.name, 'Chores');
        assert.equal(result.id, 1);
        assert(Array.isArray(result.todos));
        assert.equal(result.todos.length, 2);
      });
    });

    it('should return a not found error', () => {
      let find = () => FootprintService.find('Unknown', {name: 'Cake'});

      assert.throws(find, Error);
    });
  });

  describe('#update', () => {
    it('should update one record', () => {
      return FootprintService.update('User', 1, {name: 'Rapha'})
      .then(result => {
        assert.equal(result.name, 'Rapha');
        assert.equal(result.id, 1);
      });
    });

    it('should update multiple records', () => {
      return FootprintService.update('Todo', {done: false}, {done: true})
      .then(result => {
        assert(result.every(todo => !!todo.done));
      });
    });

    it('should return a not found error', () => {
      let update = () => FootprintService.update('Unknown', 1, {name: 'Cake'});

      assert.throws(update, Error);
    });
  });

  describe('#destroy', () => {
    it('should delete a set of records', () => {
      return FootprintService.create('List', listDestroy, {recursive: 1})
      .then(() => {
        return FootprintService.destroy('Todo', {task: 'destroy me'});
      })
      .then(() => {
        return FootprintService.find('Todo', {task: 'destroy me'});
      })
      .then(results => {
        assert.equal(results, null);
      });
    });

    it('should return a not found error', () => {
      let destroy = () => FootprintService.destroy('UnknowModel', {name: 'destroy'});

      assert.throws(destroy, Error);
    });
  });

  describe('#createAssociation', () => {
    it('should create a *toMany association', () => {
      return FootprintService.createAssociation('List', 2, 'todos', {
        task   : 'Eat cake',
        done   : true,
        creator: 1
      }, {recursive: 2})
      .then(result => {
        assert(result);
        assert(Array.isArray(result.todos));
        assert.equal(result.todos[2].task, 'Eat cake');
      });
    });

    it('should create a *toOne association', () => {
      return FootprintService.create('Todo', {task: 'Fight robot', done: false})
      .then(result => {
        return FootprintService.createAssociation('Todo', result.id, 'creator', {name: 'Isaac'});
      })
      .then(result => {
        assert.equal(result.task, 'Fight robot');
        assert(result.creator);
        assert.equal(result.creator.name, 'Isaac');
      });
    });
  });

  describe('#findAssociation', () => {
    it('should find a *toMany association', () => {
      return FootprintService.findAssociation('List', 2, 'todos', {task: 'Pet all the cats'})
      .then(result => {
        assert(result);
        assert.equal(result[0].id, 2);
        assert(result[0].todos);
        assert.equal(result[0].todos[0].task, 'Pet all the cats');
      });
    });

    it('should find a *toOne association', () => {
      return FootprintService.findAssociation('Todo', 3, 'creator', {name: 'Wesley'})
      .then(result => {
        assert(result);
        assert.equal(result[0].id, 3);
        assert(result[0].creator);
        assert.equal(result[0].creator.name, 'Wesley');
      });
    });

    it('should use find options', () => {
      return FootprintService.findAssociation('List', 1, 'todos', {done: true}, {limit: 1})
      .then(result => {
        assert(result);
        assert.equal(result[0].id, 1);
        assert(result[0].todos);
        assert.equal(result[0].todos.length, 1);
      });
    });
  });

  describe('#updateAssociation', () => {
    it('should update a *toMany association', () => {
      return FootprintService.createAssociation('List', 2, 'todos', {
        task   : 'Update this',
        done   : true,
        creator: 1
      }, {recursive: 2})
      .then(result => {
        return FootprintService.updateAssociation('List', 2, 'todos', {task: 'Update this'}, {task: 'Updated'})
        .then(result => {
          assert(result.todos);
          assert.equal(result.todos[0].task, 'Updated');
          assert.equal(result.todos[0].done, true);
        });
      });
    });

    it('should update a *toOne association', () => {
      return FootprintService.create('Todo', {task: 'Save the galaxy', done: false})
      .then(result => {
        return FootprintService.createAssociation('Todo', result.id, 'creator', {name: 'To update'});
      })
      .then(result => {
        return FootprintService.updateAssociation('Todo', result.id, 'creator', {name: 'To update'}, {name: 'Updated'});
      })
      .then(result => {
        assert(result);
        assert.equal(result.creator.name, 'Updated');
      });
    });
  });

  describe('#destroyAssociation', () => {
    it('should delete an *toMany associated record', () => {
      return FootprintService.createAssociation('List', 2, 'todos', {
        task: 'I will be destroyed',
        done: false
      })
      .then(() => {
        return FootprintService.destroyAssociation('List', 2, 'todos', {task: 'I will be destroyed'});
      })
      .then(() => {
        return FootprintService.findAssociation('List', 2, 'todos', {task: 'I will be destroyed'});
      })
      .then(result => {
        assert(result);
        assert.equal(result[0].todos.length, 0);
      });
    });
  });
});

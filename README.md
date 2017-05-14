# trailpack-wetland

Wetland ORM Trailpack https://wetland.spoonx.org

## Installation

1. `npm install --save trailpack-wetland`
2. Choose an adapter (list below) `npm i --save sqlite3`
3. `mkdir api/entity`
4. `touch config/wetland.js`
5. `echo "module.exports = require('./config/wetland').wetland;\n" > wetland.js`

## Configuration
Out of the box, wetland works with sqlite3, so there's no need to configure anything.
An extensive list with config options and explanation can be found in [the wetland documentation](https://wetland.spoonx.org/configuration.html).

### Example config
The simplest configuration _(which will be what's used 9/10 times)_ is as follows:

**config/wetland.js**

```js
const path = require('path');

module.exports.wetland = {
  entityPath: path.resolve(process.cwd(), 'api', 'entity'),
  stores    : {
    defaultStore: {
      client    : 'mysql',
      connection: {
	    host    : '127.0.0.1',
	    user    : 'your_database_user',
	    password: 'your_database_password',
	    database: 'myapp_test'
      }
    }
  }
};
```

### Adapters
| Adapter | Command |
| ------------- | ------------- |
| mysql | `npm i mysql --save` |
| mysql2 | `npm i mysql2 --save` |
| pg | `npm i pg --save` |
| sqlite3 | `npm i sqlite3 --save` |
| mariasql | `npm i mariasql --save` |
| strong-oracle | `npm i strong-oracle --save` |
| oracle | `npm i oracle --save` |
| mssql | `npm i mssql --save` |

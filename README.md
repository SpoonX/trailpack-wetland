# trailpack-wetland

[![NPM version][npm-image]][npm-url]
[![Build status][ci-image]][ci-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Code Climate][codeclimate-image]][codeclimate-url]

Wetland ORM Trailpack https://wetland.spoonx.org

## Install

```sh
$ npm install --save trailpack-wetland
```

## Configure
`$ mkdir entities`
`$ touch /entities/index.js`

```js
// config/main.js
module.exports = {
  packs: [
    // ... other trailpacks
    require('trailpack-wetland')
  ] 
}
```

[npm-image]: https://img.shields.io/npm/v/trailpack-wetland.svg?style=flat-square
[npm-url]: https://npmjs.org/package/trailpack-wetland
[ci-image]: https://img.shields.io/travis//trailpack-wetland/master.svg?style=flat-square
[ci-url]: https://travis-ci.org//trailpack-wetland
[daviddm-image]: http://img.shields.io/david//trailpack-wetland.svg?style=flat-square
[daviddm-url]: https://david-dm.org//trailpack-wetland
[codeclimate-image]: https://img.shields.io/codeclimate/github//trailpack-wetland.svg?style=flat-square
[codeclimate-url]: https://codeclimate.com/github//trailpack-wetland

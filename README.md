# react-pathing-builder

> A map builder for pathing applications

![](https://img.shields.io/github/license/skgrush/react-pathing-builder.svg?style=flat-square)
![](https://img.shields.io/npm/v/react-pathing-builder.svg?style=flat-square)
![](https://img.shields.io/bundlephobia/min/react-pathing-builder.svg?style=flat-square)

## Install as a Dependency

In your existing npm-like repository, run one of the following:

```shell
yarn add react-pathing-builder
# or
npm install react-pathing-builder
```

once added, import as needed:

```javascript
import * as React from 'react'
import {render} from 'react-dom'
import {PathingBuilder} from 'react-pathing-builder'

// example
render(<PathingBuilder mapSrc="https://placehold.it/300" />)
```

## Test / Develop

```shell
git clone git@github.com:skgrush/react-pathing-builder.git
cd react-pathing-builder
yarn install
yarn start
```

Starts up a webpack dev server pointing at [`examples/src`](examples/src),
which imports from the full TypeScript [`src`](src), available at
[localhost:3001](http://localhost:3001).

### Build

```shell
yarn build
```

Transpiles and packs [src](src) into `lib/index.js`, builds
TypeScript declaration files at `lib/*.d.ts`,
and copies the css file.

### scripts

- `yarn` - install dependencies and build
- `yarn start` - start webpack dev server
- `yarn build` - build the module, including types

#### npm equivalent scripts

`npm start` works, and other scripts that don't call `yarn` work
just fine with `npm`.

Build:

```shell
npm run clean:build && \
  npm run build:types && \
  npm run build:js && \
  npm run build:css
```

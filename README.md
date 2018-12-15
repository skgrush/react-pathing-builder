# react-pathing-builder

> A [WIP] map builder for pathing applications

## Getting Started

### Get it

```shell
git clone git@github.com:skgrush/react-pathing-builder.git
cd react-pathing-builder
yarn install
```

### Test / Develop

```shell
yarn start
```

Starts up a webpack dev server pointing at [examples/src](examples/src),
which imports from the full TypeScript [src](src), available at
[localhost:3001](http://localhost:3001).

### Build

```shell
yarn build
```

Transpiles and packs [src](src) into [lib/index.js](lib/index.js), builds
a TypeScript declaration file at [lib/index.d.ts](lib/index.d.ts),
and copies the css file.

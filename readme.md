# Flink

This is the monorepo for Flink framework and its official sub packages.

This project uses `lerna` to operate the monorepo.

## Getting started

First link packages. This will create symlink between sibling packages which is required to run and develop packages:

```
npx lerna bootstrap
```

> Important: You need to rerun the command after you invoked `npm install` or any other command the modified `node_modules`.

Run tests in all packages (it's still completely fine to run tests as you normally would do with `npm test` in packages):

```
npx lerna run tests
```

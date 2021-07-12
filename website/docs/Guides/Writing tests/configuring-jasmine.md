# Configuring jasmine

This guide describes how you add and configure jasmine to your project.

**NOTE: Jasmine and related configuration has been added to recent version `create-flink-app` so these steps might not be needed.**

## 1. Install dependencies

Our goto test engine is jasmine. Unless you do not already have it, install it and related deps:

```
npm i -D jasmine jasmine-ts @types/jasmine jasmine-spec-reporter nodemon
```

## 2. Configure jasmine runner

**Skip this step if you created your app with recent version of `create-flink-app`.**

Init jasmine:

```
node_modules/.bin/jasmine-ts init
```

This will create a `/spec` folder with a `/spec/support/jasmine.json` config file.

Open `jasmine.json` and add jasmine-spec-reporter as reporter:

```json
{
  // ...
  "reporters": [
    {
      "name": "jasmine-spec-reporter#SpecReporter",
      "options": {
        "displayStacktrace": "all"
      }
    }
  ]
}
```

## 3. Add `scripts` to `package.json`

Now add `scripts` to run tests in your `package.json`:

```json
{
  //...
  "scripts": {
    // ...
    "test": "jasmine-ts --preserve-symlinks --config=./spec/support/jasmine.json",
    "test:watch": "nodemon --ext ts --exec 'jasmine-ts --config=./spec/support/jasmine.json'"
  }
}
```

You are now good to go!

Run tests with `npm run test` or `npm run test:watch` to run tests in watch mode ⚡️.

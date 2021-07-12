# Configuring jasmine

This guide describes how you add and configure jasmine to your project.

**NOTE: Jasmine and related configuration has been added to recent version `create-flink-app` so these steps might not be needed.**

## 1. Install dependencies

Our goto test engine is jasmine. Unless you do not already have it, install it and related deps:

```
npm i -D jasmine jasmine-ts @types/jasmine jasmine-spec-reporter nodemon
```

## 2. Configure jasmine runner and spec reporter

**Skip this step if you created your app with recent version of `create-flink-app`.**

Init jasmine:

```
node_modules/.bin/jasmine-ts init
```

This will create a `/spec` folder with a `/spec/support/jasmine.json` config file.

Create file `/spec/helpers/reporter.ts`:

```typescript
import {
  DisplayProcessor,
  SpecReporter,
  StacktraceOption,
} from "jasmine-spec-reporter";
import SuiteInfo = jasmine.SuiteInfo;

class CustomProcessor extends DisplayProcessor {
  public displayJasmineStarted(_info: SuiteInfo, log: string): string {
    return `TypeScript ${log}`;
  }
}

jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(
  new SpecReporter({
    spec: {
      displayStacktrace: StacktraceOption.NONE,
    },
    customProcessors: [CustomProcessor],
  })
);
```

## 3. Add `scripts` to `package.json`

Now add `scripts` to run tests in your `package.json`:

```json
{
  //...
  "scripts": {
    // ...
    "test": "jasmine-ts --preserve-symlinks",
    "test:watch": "nodemon --exec jasmine-ts"
  }
}
```

Make sure that `nodemon.json` in root of project includes `spec` folder in `watch`:

```json
{
  // Add "spec" here if not already present
  "watch": ["src", "spec"]
  // ...
}
```

You are now good to go!

Run tests with `npm run test` or `npm run test:watch` to run tests in watch mode ⚡️.

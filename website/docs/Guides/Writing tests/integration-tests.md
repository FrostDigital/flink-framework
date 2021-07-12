# Integration tests

This guide describes how you can write integration tests for your application using Jasmine as test engine.

The definition of _integration test_ varies but in this case it is meant that your Flink apps HTTP server will start
and you will write tests/specs that tests the API it exposes by sending and receiving HTTP JSON messages to it. In other words, acting as a real user, though programmatic.

## Prerequisites

Make sure you have jasmine configured in your app. If not, follow [this](./configuring-jasmine) guide.

Also, make sure you have `@flink-app/test-utils` which has helpers to simplify writing integration tests:

```
npm i -D @flink-app/test-utils
```

## 1. Setup empty test

In this case we are testing stuff related to Car CRUD operations.

Create file `/spec/CarIntegrationTests.spec.ts` with following:

```typescript
describe("CarIntegrationTests", () => {
  beforeAll(() => {
    // Flink app will be started here
  });

  it("should be true", () => {
    expect(true).toBe(false);
  });
});
```

This is obviously not much of a test, but make sure that is runs and succeeds anyways by running `npm run test` or even better, start test in watch mode `npm run test:watch` to get instant feedback from now on.

## 2. Start FlinkApp before tests

Now make sure that FlinkApp starts before tests.

At this point you can choose which plugins you want to include in tests. For example `api-docs-plugin` is most likely not needed
however, the auth plugin could be necessary in order for your integration tests to work. In this case plugins are removed from the `flinkApp`.

```typescript
import { FlinkApp } from "@flink-app/flink";
import * as testUtils from "@flink-app/test-utils";
import { join } from "path";

describe("CarIntegrationTests", () => {
  beforeAll(async () => {
    const flinkApp = new FlinkApp<any>({
      port: 3335, // Any available port
      name: "Test app",
      loader: (file: any) => import(join(process.cwd(), "src", file)), // Note process.cwd()
      // Add any more additional config, such as db config if needed to
    });

    // Start and inject the app into testUtils
    testUtils.init(await flinkApp.start());
  });

  it("should be true", () => {
    expect(true).toBe(false);
  });
});
```

## 3. Write specs to get car

Now rewrite the `should be true` spec into the following:

```typescript
it("should get 404 if car does not exist", () => {
  const { status, error } = await testUtils.get("/car/non-existing-id");
  expect(status).toBe(404);
  expect(error).toBeDefined();
});
```

And add additional one for success scenario:

```typescript
it("should get car", () => {
  const carId = "60eb69e00000000000000000";
  const { status, data } = await testUtils.get(`/car/${id}`);

  expect(status).toBe(200);
  expect(data.model).toBe("Volvo");
});
```

Note that above test assumes that a car with id `60eb69e00000000000000000` already exists in database.
If you need to you can prepare a "test bed" by adding a `beforeAll` or inside the spec.

For example:

```typescript
let car: Car;

beforeAll(async () => {
  car = await flinkApp.ctx.repos.create({
    model: "Volvo",
  });
});
```

## 3. Write specs to post car

```typescript
it("should post car", () => {
  const { status, data } = await testUtils.post(`/car/${id}`, {
    model: "Tesla",
  });

  expect(status).toBe(201);
  expect(data._id).toBeDefined();
  expect(data.model).toBe("Tesla");
});
```

# Testing

This guide describes how you can write tests for your application using Jasmine as test engine.

## Testing handlers

Many times handlers is where the main logic of the app is located. Considering that, this would be the first thing to cover with tests.

We will go thru two ways of testing a handler

1. Integration tests - tests that will start the Flink apps server and test HTTP in and out
2. Unit tests - tests that will mock all/most dependencies and only test code executed within the handler

### Handler integration tests

Integration tests will fire up a Flink app same as if you would start the app locally on your computer, just that is happens programmatically.

This means that database, plugins, etc all will be started and included in your tests.

```typescript
describe("GetCarHandler", () => {



  beforeAll(() => {
    new FlinkApp<AppContext>({
      name: "Test app",
      debug: true,
      loader: (file: any) => import("../" + file),
      plugins: [
        apiDocPlugin(),
        firebaseMessagingPlugin({ serverKey: "foo", exposeEndpoints: true }),
      ],
    }).start();

  })

  it("should get 404 if non existing car", () => {
      const req: TestRequest = {
          method: HttpMethod.get,
          path "/car"
      };

      const {status} = getCarHandler(req);

      expect(status).toBe(404);
  });

  it("should get car", () => {});
});
```

## Unit testing

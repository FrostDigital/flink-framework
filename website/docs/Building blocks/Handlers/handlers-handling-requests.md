---
sidebar_position: 3
---

# Handling requests

The handler function is the actual code that handles the request. Normally the function would execute code that retrieves something from database and then serves the response.

The function must be `default` exported and be of type `Handler<Ctx, ReqSchema, ResSchema>` or `GetHandler<Ctx, ResSchema>`.

> Note: The only difference between `Handler` and `GetHandler` is syntactic sugar as GET handlers should not have a request body, hence the generic argument for that is omitted for cleaner code.

Flink will, during compile time, analyze the Handler and its handler function to derive any schemas from generic arguments. For example here, the second `Car` argument is detected and Flink will use that schema to validate the response.

```typescript
const GetCar: GetHandler<AppContext, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};
```

> Note: At the time of writing the Flink TypeScript compile time analyser is quite limited, so it is important to follow guidelines stated here.

## Examples

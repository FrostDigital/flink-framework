---
sidebar_position: 1
---

# What are handlers?

Handlers are functions that handles incoming HTTP requests and return a response.

Handlers _must_ be created in `/src/handlers` or into a nested folder within that folder, i.e. grouped by topic.

By placing it here Flink will recognize it as a handler and attempt to route HTTP requests to it.

A handler must have _one_ of the following:

- Exported route props
- Exported handler function

Example `/src/handlers/GetCar.ts`:

```typescript
import { GetHandler, RouteProps, HttpMethod } from "@flink-app/flink";
import Car from "../../schemas/Car";

export const Route: RouteProps = {
  path: "/car",
  method: HttpMethod.get,
};

const GetCar: GetHandler<AppContext, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default GetCar;
```

Name the handler file whatever you want, but Flink encourages you to use HTTP method as prefix. In fact, Flink will even use that prefix method as part of routing if `method` is not set in route props. So for example `GetCar.ts` will be assumed to listen for `GET` requests.

### Route props

Main purpose of Route props is to tell Flink how and which traffic to route to the handler, but it also contains other related configuration and metadata:

| Property    | Description                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------- |
| path        | (required) Path to route to, may contain path params. For example `/car/:id`                       |
| method      | Http method. For example `HttpMethod.get`.                                                         |
| permissions | String or array of string that contains permission(s) required by user to access the handler       |
| mockApi     | Boolean if mock data should be generated. Is handy during development, requires schemas to be set. |
| docs        | Documentation about the route. This can be used when generating API docs (see API docs plugin)     |

Routing is set by declaring and exporting route props.

### Handler function

Handler function is the actual code that handles the request, perhaps retrieves something from database and then serves the response.

The function must be default exported and be of type `Handler<Ctx, ReqSchema, ResSchema>` or `GetHandler<Ctx, ResSchema>`. The only difference between those is that GET handlers does not have any request body, so the `ReqSchema` argument is omitted for cleaner code.

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

> Note: At the time of writing the typescript compile analyser is quite limited, so it is important to follow guidelines stated here.

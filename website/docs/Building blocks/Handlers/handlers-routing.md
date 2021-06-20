---
sidebar_position: 2
---

# Routing

Tell Flink how to route traffic to the handler by creating and exposing `RouteProps`. The RouteProps may also contains other related configuration and metadata, such as if user needs to be authenticated and if so which permission it needs.

| Property      | Description                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `path`        | (required) Path to route to, may contain path params. For example `/car/:id`                       |
| `method`      | Http method. For example `HttpMethod.get`.                                                         |
| `permissions` | String or array of string that contains permission(s) required by user to access the handler       |
| `mockApi`     | Boolean if mock data should be generated. Is handy during development, requires schemas to be set. |
| `docs`        | Documentation about the route. This can be used when generating API docs (see API docs plugin)     |

## Examples

Public endpoint that responds to `GET /car`:

```typescript
import { RouteProps, HttpMethod } from "@flink-app/flink";

export const Route: RouteProps = {
  path: "/car",
  method: HttpMethod.get,
};
```

POST endpoint that requires authentication by declaring permissions:

```typescript
import { RouteProps, HttpMethod } from "@flink-app/flink";

export const Route: RouteProps = {
  path: "/car",
  method: HttpMethod.post,
  permissions: ["car:create"],
};
```

# Context

The application context is the glue that makes sure that handlers, repos and plugin can access each other in a type safe way.

You need to define the context type, however Flink will take care of instantiating it when app is started.

## Define the context

Create a file, for example `src/Ctx.ts` is a good place.

Define an interface which extends from `FlinkContext`:

```typescript
import { FlinkContext } from "@flink-app/flink";
import PetRepo from "./repos/PetRepo";

export interface Ctx extends FlinkContext {
  repos: {
    petRepo: PetRepo;
  };
}
```

As seen above the app uses a repo which needs to be defined.

### Context with plugins

Plugins can optionally extend the context and expose properties and methods on the context namespaced within `ctx.plugins.somePlugin`.

As before, Flink will make sure to wire this up but you still need to define the type. `FlinkContext` exposes a generic argument for this
purpose.

Example:

```typescript
import { FlinkContext } from "@flink-app/flink";
import PetRepo from "./repos/PetRepo";

// Note that <ApiDocsPlugin> was added here 👇
export interface Ctx extends FlinkContext<ApiDocsPlugin> {
  repos: {
    petRepo: PetRepo;
  };
}
```

If you are using multiple plugins, you can easily add those by using the short type extend syntax `FlinkContext<ApiDocsPlugin & FirebaseMessagingPlugin>`.

## Use the context

Context is set as generic argument in many (most) places. `FlinkApp`, `Handler` functions and `FlinkRepo` all requires Context as the first generic argument.

> Note: You can of course set it to `any` during development/proof-of-concepting but is highly discouraged as that defeats the purpose of the context quite a bit.

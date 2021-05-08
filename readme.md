# FLIT

A lightweight web framework built on top of Express.

Convention based - will make assumptions depending on where in folder structure files are created and their names.

Typescript first.

## Structure

Flink will make assumption on what your modules are and how they should be
used based on where in folder structure they are located.

```
# All source code goes here, only configuration resides outside
src/

# HTTP handlers, Flit will treat all files as routable handlers and
# makes sure that express routes traffic to them based on path
src/handlers

# Optionally use nested "topic" folders in case if many files
src/handlers/car

# Database repositories
src/repos

# Typescript interfaces that describes API schemas. JSON schemas
# will be generated from these files on runtime.
src/schemas

# Generated caches etc - should not be version controlled!
generate/

```

## Getting started

### Create App Context

Define an app context interface or type.

This is used in handlers and repos and describes
the context that is available in all handlers and repos and is a way to share state in
between those (for example FooRepo needs access to BarRepo).

```
interface AppContext extends FlitContext {
    repos: {
        carRepo: CarRepo;
        userRepo: UserRepo;
    }
}

export default AppContext;

```

### Create startup (`index.ts`)

Create `src/index.ts` where app is configured and started.

> Note: It might be tempting to place app context here as well, but keep it separate to avoid circular deps.

```
/**
 * Main entry point for starting the service.
 *
 * Must exit with an exit code greater than 1 in case app
 * could not be started.
 */
(async function () {
    new Flink<AppContext>({
        name: "Test app",
        db: {
            uri: "mongodb://localhost:27017/test-db"
        },
        debug: false,
        // mockApi: [{ method: HttpMethod.get, path: "/user/:id" }]
    }).start();
})();

export default () => {};
```

## Naming conventions

### Handlers

Handlers which are prefixed with a HTTP method will by default use that method.

Example:

```
src/handlers/PostCar.ts
```

This can easily be overridden in then handlers `RouteProps` but might be a good idea to still
stick with that convention.

Example:

```
export const Props: RouteProps {
    method: HttpMethod.get
}
```

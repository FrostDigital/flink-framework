# FLINK

A lightweight web framework built on top of Express.

Convention based - will make assumptions depending on where in folder structure files are created and their names.

Typescript first.

Plugability - build plugins which can be reused and extend functionality of core Flink.

## Structure

Flink will make assumption on what your modules are and how they should be
used based on where in folder structure they are located.

By doing so you can let Flink wire up dependence injection (ish), route HTTP
traffic to handlers etc.

```
# All source code goes here, only project configuration resides outside
src/

# HTTP handlers, Flink will treat all files as routable handlers and
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

### 1. Clone template project

The template project is an empty project that contains folder structure and dependencies necessary for Flink.

Clone this and init git:

```
git clone FrostDigital/flink-template
mv flink-template my-project
cd my-project
rm -rf .git
git init
```

> Note: You can easily build from scratch and install `npm install @flink/flink`.

### 2. Create App Context

Define an app context interface or type.

This is used in handlers and repos and describes the context that is available in all handlers and
repos and is a way to share state in between those (for example FooRepo needs access to BarRepo).

```
interface AppContext extends FlinkContext {
    repos: {
        carRepo: CarRepo;
        userRepo: UserRepo;
    }
}

export default AppContext;

```

### 3. Create startup (`index.ts`)

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

## Building blocks

The following building blocks exists in Flink:

- Handler - a handler is responsible for handling API requests and return a response. Normally a handler has some type of logic and invokes a _repo_ to CRUD data from database.
- Repo - a repository is used to abstract data access to database. A repo is used to access a mongo db and a repo is used per collection.
- Jobs - a piece of code that will be invoked on a schedule or once after app start. Jobs can be cron jobs, migration jobs etc.
- App Context - the app context is the glue that ties parts of the app together. By defining and creating an app context you make sure that i.e. handlers can get access to repositories.
- Schemas - models that defines API requests and responses. These are typescript interfaces which will during compile time be converted into JSON schemas used to validate requests and responses and also used to generate API documentation.
- Flink app - is the entry
- Plugins - plugability is built into core of Flink. These can be external npm modules, or plugins inside your project. Plugins can for example extend the `request` object and add additional information such as auth user which can be used in handlers. Similar to how middleware works in express although a bit more constrained.

### Handlers

Handlers are placed in `src/handlers/` folder. Put them directly in handlers root or group them by topic.

Example:

```
# In root
src/handlers/GetCar.ts

# Or group by "topic" - generally a good idea for slightly larger projects
src/handlers/cars/GetCar.ts
```

Handlers which are prefixed with a HTTP method will by default use that method for routing. For example a handler named `GetCar.ts` will assume that it will accept `GET` request to the provided route.

This can easily be overridden in the handlers `RouteProps` but might be a good idea to still
stick with that convention.

Example:

```
export const Props: RouteProps {
    method: HttpMethod.get
}
```

#### Route props

Every handler needs to export a const named `Props` of type `RouteProps`. Flink will use this to decide how requests will be routed to the handler.

You can set http method and path with path params.

Example:

```
export const Props: RouteProps {
    method: HttpMethod.get
    path: "/car/:id"
}
```

#### Handler function

The handler function needs to be default exported and is used to actual handle the request.

Then handler method must be of type `Handler` or `GetHandler`.

The handler function has generic type arguments which defines:

- Application context
- Request schema (optional)
- Response schema (optional)
- Params (optional)

> Note: `GetHandler<Ctx, ResSchema>` is just syntactic sugar since get handlers does not have request schemas so that type argument does not exist. Otherwise it is the same as `Handler<Ctx, ReqSchema, ResSchema>`

Flink will, during app start, analyse the handler function and make sure that schema validation happens based on these type arguments.

Example:

```
export const Route: RouteProps = {
  path: "/car",
};

const PostCar: Handler<any, PostCar, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default GetCar;

```

## Naming conventions

In Flink naming conventions is not only for a easy-to-navigate and generally consistent codebase. It is also
used to extract functionality based on conventions.

### Handlers

Handlers which are prefixed with a HTTP method will by default use that method.

Example:

```
src/handlers/PostCar.ts
```

This can easily be overridden in the handlers `RouteProps` but might be a good idea to still
stick with that convention.

Example:

```
export const Props: RouteProps {
    method: HttpMethod.get
}
```

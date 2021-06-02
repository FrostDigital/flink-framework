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

## Building blocks

The following building blocks exists in Flink:

- Handler - a handler is responsible for handling API requests and return a response. Normally a handler has some type of logic and invokes a _repo_ to CRUD data from database.
- Repo - a repository is used to abstract data access to database. A repo is used to access a mongo db and a repo is used per collection.
- App Context - the app context is the glue that ties parts of the app together. By defining and creating an app context you make sure that i.e. handlers can get access to repositories.
- Schemas - models that defines API requests and responses. These are typescript interfaces which will during compile time be converted into JSON schemas used to validate requests and responses and also used to generate API documentation.
- Flink app - is the entry
- Plugins - plugability is built into core of Flink. These can be external npm modules, or plugins inside your project. Plugins can for example extend the `request` object and add additional information such as auth user which can be used in handlers. Similar to how middleware works in express although a bit more constrained.

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

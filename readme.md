# FLIT

A lightweight web framework built on top of Express.

Convention based, but with possibility to opt-out.

Typescript only.

## Structure

Folder structure of an object is of importance since Flit will scan it an
make assumption based on where source files are located and naming.

```
# All source code goes here, only configuration resides outside
src/

# HTTP handlers, Flit will treat all files as routable handlers and
# makes sure that express routes traffic to them based on path
src/handler

# Optionally use nested "topic" folders in case if many files
src/handler/car

```

## Naming convetions

### Handlers

Handlers which are prefixed with a HTTP method will by default use that method.

Example:

```
src/handlers/PostCar.ts
```

However this can be opted out from by setting `method` inside the handler props.

Example (PostCar.ts):

```
export const Props {
    method: HttpMethod.get
}
```

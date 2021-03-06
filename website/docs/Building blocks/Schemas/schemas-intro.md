---
sidebar_position: 1
---

# API schemas

Schemas are TypeScript interfaces or types that declare the shape of requests and responses.

It is optional to declare schemas but highly recommended as it improves the developer experience and also makes the API self documenting 🎉.

Schemas should be placed in `/src/schemas`.

Handlers declares which schema(s) to use by simply setting type arguments in the `Handler<...>` function. By doing so Flink compiler will make the connection and use that to validate the request and response.

This handler will for example tell Flink that the `Car` schema is used.

```typescript
const GetCar: GetHandler<Ctx, Car> = async () => {
  // ...
};
```

## Examples

```typescript
export interface Car {
  _id: string;
  brand: string;
  model?: string;
}
```

👆 This will create a JSON schema where `_id` and `brand` is required properties but model is optional.

Note that any comments on interface or field level will be used as `description` within the JSON schema.

## What about JSON schemas?

Flink will during build compile schemas and convert them from TypeScript types and interfaces into JSON schemas. For that we are using the awesome [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator) library to do the heavy lifting.

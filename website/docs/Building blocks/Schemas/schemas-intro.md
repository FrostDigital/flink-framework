# Schemas

Schemas are TypeScript interfaces that declare the shape of requests and responses.

It is optional to declare schemas but highly recommended as it improves the developer experience and also makes the API self documenting 🎉.

Schemas must reside in `/src/schemas` - otherwise they will not be parsed and compiled into [JSON schemas](#what-about-json-schemas).

Handlers sets schemas as generic argument in the `Handler<...>` function. By doing that Flink will make the connection and use that to validate the request and response.

## Examples

```typescript
export interface Car {
  id: string;
  brand: string;
  model?: string;
}
```

👆 This will create a JSON schema where `id` and `brand` is required properties but model is optional.

Note that any comments on interface or field level will be used as `description` within the JSON schema.

Read more about TS schemas tips and trix [here](https://github.com/YousefED/typescript-json-schema/blob/master/api.md).

## What about JSON schemas?

Flink will during build compile schemas and convert them from TypeScript interfaces into JSON schemas. For that we are using the awesome [typescript-json-schema](https://github.com/YousefED/typescript-json-schema) library.

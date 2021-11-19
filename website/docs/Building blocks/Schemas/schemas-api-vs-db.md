---
sidebar_position: 2
---

# Schemas are not db schemas

The concept of schemas in Flink only applies to API schemas. This means that what you put in `/src/schemas` describes what goes in and out to/from the API (requests and responses).

These schemas is ever so often not 100% match of what you save in the database. In some cases you would want to transform the object into an internal structure (like [DTO's](https://en.wikipedia.org/wiki/Data_transfer_object)).

The most common example of such diffs is that database sets `id` (or `_id`) of a document. When you expose the API you do not want the user to be able to such id.

Flink does not enforce you to create database models or DTO's. You need to find your way. However you can in many cases achieve what you want using TypeScripts util interfaces `Omit`, `Partial` and `Pick` on schemas.

Example:

```typescript
// Create user accepts the user schema except for `_id` and `created`
interface CreateUserModel extends Omit<User, "_id" | "created"> {}
```

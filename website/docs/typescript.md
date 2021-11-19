---
sidebar_position: 6
---

# TypeScript

Flink has been built and designed with TypeScript end-to-end.

In fact, Flink has its own TypeScript compiler to analyse source code and make changes at compile time which is an important ingredient (the secret sauce 👩‍🍳) especially when making assumptions based on types and file location of source files.

This means that you should _not_ attempt to use Flink with vanilla javascript 💥

> Note: At the time of writing the TS compiler implementation in Flink is in beta and subject to change, although it should not (in theory) lead to any breaking changes from developer perspective.

## During compilation

Flink compiler performs the following tasks (at compile time):

- Reads source files location on folder structure and saves metadata to be used at runtime by Flink App. This is used so Flink knows that a repo is a repo, handler a handler, etc.
-

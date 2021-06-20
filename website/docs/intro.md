---
sidebar_position: 1
slug: /
---

# Introduction

Flink makes it easy to develop simple, yet robust, apps that exposes JSON based HTTP API (REST if you will).

It is built on top of the following proven technologies:

- Express
- MongoDB
- TypeScript (yes, you must use [TypeScript](./typescript))
- JSON schemas

If you compare Flink to vanilla Express app, the main difference is that Flink is much more opinionated. In fact, Flink will even dictate where in folder structure you must put your source files. It will also analyse source files during build/compile time to derive metadata which otherwise is not possible.

All with the goal to make the developer experience as smooth as possible.

## Getting Started

Get started by **creating a new flink app**.

## Generate a new app

Generate a new Flink app using **create-flink-app**:

```shell
npx create-flink-app my-app
```

## Start your app

Run the development server:

```shell
cd my-app

npm run dev
```

Your service starts at `http://localhost:3333`.

## When is Flink a good fit?

- If you want to develop a headless service that talks HTTP.
- You enjoy TypeScript and type safety that comes with it.
- You understand importance of self documenting API's.

## When is Flink _not_ a good fit?

- If your project is large in terms of line of code, team size.
- If you want to use vanilla javascript.

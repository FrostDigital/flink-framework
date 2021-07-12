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

Compared to a vanilla Express app the main difference is that Flink is much more opinionated in terms of conventions and tech stack.

In fact, Flink will even dictate where in folder structure you must put your source files. It will also analyse source files during build/compile time to derive metadata which otherwise is not possible.

All with the goal to make the developer experience as smooth as possible.

Read more about [Pros and Cons](./pros-cons) to find out of Flink is a good fit for you.

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

---
id: plugin-intro
title: Introduction to plugins
slug: /plugin-intro
---

# Plugin intro

Plugins are extensions of Flink. Plugins can add functionality in the following ways:

- Extending application context. Adds a programmatic plugin API on context.
- Registering handlers/routes. Extends exposed HTTP API that your flink app exposes
- Modifying the express app, for example adding a middleware.

## Official plugins

See **Offical plugins** for list of existing Flink plugins that is available to use in your Flink app.

## Install a plugin

Refer to plugin docs, but in general:

1. Install npm module
2. Add plugin and its configuration to your `FlinkApp`
3. Add plugin context type to you context (only needed if plugin exposes its API on context)

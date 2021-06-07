# Flink API Docs

**WORK IN PROGRESS**

A FLINK plugin that generates a VERY simple documentation based on the apps
registered routes and schemas.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/api-docs-plugin
```

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { apiDocPlugin } from "@flink-app/api-docs-plugin";

function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    loader: (file: any) => import(file),
    plugins: [
        // Register plugin, customize options if needed to
        apiDocPlugin({
            title: "API Docs: My app"
        })
    ],
  }).start();
}

```

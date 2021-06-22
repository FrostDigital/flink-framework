# Flink API Docs
A FLINK plugin that makes it possible to serve static files in FLINK.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/static-files-plugin
```

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { staticFilesPlugin } from "@flink-app/static-files-plugin";

function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    loader: (file: any) => import(file),
    plugins: [
        // Register plugin
        staticFilesPlugin({
          "path" : "/", 
          "folder" : join(__dirname, "public")
        })
    ],
  }).start();
}

```

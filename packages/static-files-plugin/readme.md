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

### Copy files

Flinks typescript compiler will package the app and run from inside the `dist/` folder. Only ts and json files are copied, so any static files needs to be copied manually.

There are numerous ways to do that but one way is by using the `copyfiles` package:


```
npm i -D copyfiles
```

Add following to package.json scripts

```
...
    "copy-files": "copyfiles -u 1 src/public/**/* dist/src/",
    "predev": "npm run copy-files",
    "prebuild": "npm run copy-files"
...
```

This way all static files in the `src/public` folder will be copied into dist. 

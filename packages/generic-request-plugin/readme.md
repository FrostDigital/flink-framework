# Flink API Docs
A FLINK plugin that makes it possible to overide the default request handler and handle a request by your own code.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/generic-request-plugin
```

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { genericRequestPlugin, HttpMethod} from "@flink-app/generic-request-plugin";

function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    loader: (file: any) => import(file),
    plugins: [
        // Register plugin
        genericRequestPlugin({
          "path" : "/url", 
          "method" : HttpMethod.get,
          "handler" : (req, res, app) => {
            res.setHeader('Content-type','text/html');
            res.end("Hello world!")
          }
        })
    ],
  }).start();
}

```

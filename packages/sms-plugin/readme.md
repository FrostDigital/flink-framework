# Flink API Docs

A FLINK plugin that makes it possible to send sms

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/sms-plugin
```

## Setup

### With 46 elks

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { smsPlugin, sms46elksClient } from "@flink-app/sms-plugin";

function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    plugins: [
        // Register plugin
        smsPlugin({
          client: new sms46elksClient({
            username: "XX",
            password: "YY",
          }),
        }),
    ],
  }).start();
}

```

Add plugin ctx to `Ctx.ts` in root project

```
import { smsPluginContext } from "@flink-app/sms-plugin";

export interface Ctx extends FlinkContext<smsPluginContext> {

}

```
## Send sms
Send email from your handlers by using the the context
```

 await ctx.plugins.smsPlugin.client.send({
    to : ["+4612345678"],
    from : "Sender",
    message : "Hello world"
    
  })

```

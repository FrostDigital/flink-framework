# Flink API Docs

A FLINK plugin that makes it possible to send email.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/email-plugin
```

## Setup

### With Sendgrid

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { emailPlugin, sendgridClient } from "@flink-app/email-plugin";

function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    plugins: [
        // Register plugin
        emailPlugin({
          client : new sendgridClient({
            apiKey : process.env.SENDGRID_API_KEY
          })
        })
    ],
  }).start();
}

```

Add plugin ctx to `Ctx.ts` in root project

```
import { emailPluginContext } from "@flink-app/email-plugin";

export interface Ctx extends FlinkContext<emailPluginContext> {

}

```

### With SMTP

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { emailPlugin, smtpClient } from "@flink-app/email-plugin";

function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    plugins: [
        // Register plugin
        emailPlugin({
          client : new smtpClient({
            host: "XYZ",
            port: 587,
            secure: false
            auth: {
              user: "user"
              pass: "pass"
            },
          })
        })
    ],
  }).start();
}

```

Add plugin ctx to `Ctx.ts` in root project

```
import { emailPluginContext } from "@flink-app/email-plugin";

export interface Ctx extends FlinkContext<emailPluginContext> {

}

```

## Send email

Send email from your handlers by using the the context

```

 await ctx.plugins.emailPlugin.client.send({
    from : "from@xxx.com",
    to : ["to@yyy.com"],
    subject : "Hello world",
    text : "Hello world",  //Eiter text or html must be specified
    html : "Hello <b>world</b>"
  })

```

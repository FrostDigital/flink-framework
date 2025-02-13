# APN Plugin

A FLINK plugin used for sending push notifications using APN (Apple Push Notification) service.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/apn-plugin
```

Add and configure plugin in your app startup:

```typescript
import { apnPlugin } from "@flink-app/apn-plugin";

function start() {
    new FlinkApp<AppContext>({
        name: "My app",
        plugins: [
            apnPlugin({
                token: {
                    key: "./path/to/AuthKey_XXXXXXXXXX.p8", // Absolute or relative path to your .p8 file
                    keyId: "XXXXXXXXXX", // Your APNs Auth Key ID
                    teamId: "YYYYYYYYYY", // Your Apple Developer Team ID
                },
                production: false, // Set to true if you want to use the production APNs server
            }),
        ],
    }).start();
}
```

Add it to your app context (normally `Ctx.ts` in the root folder of your project)

```
import { ApnPluginContext } from "@flink-app/apn-plugin";

export interface Ctx extends FlinkContext<ApnPluginContext> {
  // your context here
}

```

## Configuration

-   `token` - APNs Auth Key configuration
    -   `key` - Absolute or relative path to your .p8 file
    -   `keyId` - Your APNs Auth Key ID
    -   `teamId` - Your Apple Developer Team ID
-   `production` - Set to true if you want to use the production APNs server

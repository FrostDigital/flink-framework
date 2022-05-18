# Flink JWT Auth Plugin

A FLINK auth plugin that handles authentication and permission checks.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/jwt-auth-plugin
```

Add and configure plugin in your app startup (probably `index.ts` in root project):

```typescript
import { jwtAuthPlugin } from "@flink-app/jwt-auth-plugin";

function start() {
    new FlinkApp<AppContext>({
        name: "My app",
        auth: jwtAuthPlugin({
            // config...
        }),
    }).start();
}
```

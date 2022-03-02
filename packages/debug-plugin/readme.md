# Flink API Docs

A FLINK plugin that makes it possible to debug requests in FLINK.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/debug-plugin
```

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { debugPlugin } from '@flink-app/debug-plugin';

function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    plugins: [
        // Register plugin
        debugPlugin({ enabledAtStart: false, logToConsole: false, keepLogs : 100 }),
    ],
  }).start();
}

```

## Use as a management-api-module

This plugin can be exposed as a management-api-module and could after setup be used both from the management-api and from flink-admin.

To enable management-api capabilities, simply craete a managment module and supply it to the managementApiPlugin.


Example `index.ts`

```
import { FlinkApp } from '@flink-app/flink';
import { Ctx } from './Ctx';
import {
  debugPlugin,
  GetManagementModule as GetDebugManagementModule,
} from '@flink-app/debug-plugin';
import { managementApiPlugin } from '@flink-app/management-api-plugin';

const debugManagementModule = GetDebugManagementModule({
  ui: true,
});

function start() {
  new FlinkApp<Ctx>({
    name: 'My flink app',
    debug: true,
    db: {
      uri: 'mongodb://localhost:27017/my-flink-app',
    },
    plugins: [
      debugPlugin({ enabledAtStart: false, logToConsole: false, keepLogs : 100 }),
      managementApiPlugin({
        token: '123',
        jwtSecret: '123',
        modules: [debugManagementModule],
      }),
    ],
  }).start();
}

start();

```

This way all static files in the `src/public` folder will be copied into dist. 

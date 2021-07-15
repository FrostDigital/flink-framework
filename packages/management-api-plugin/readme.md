# Flink API Docs

**WORK IN PROGRESS 👷‍♀️👷🏻‍♂️**

A FLINK plugin that lets you expose management api:s for other plugins.

Other plugins must be able to generate a ManagementApiModule that can be registered with this plugin to expose management apis.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/management-api-plugin
```

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { managementApiPlugin } from "@flink-app/management-api-plugin";


function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    loader: (file: any) => import(file),
    plugins: [
        // Register plugin
        managementApiPlugin({
          token : "SECRET_TOKEN_USED_TO_COMMUNICATE_WITH_THE_API", 
          jwtSecret : "JWT_SECRET_USED_TO_GENERATE_LOGGED_IN_TOKENS",
          modules : []
        })
    ],
  }).start();
}
```


### Communicating with the mangement api
To work with the management api you must in the http header r `management-token` send either the `token` specified when register the plugin or a user login token.

The management API have it's own users system, where you might add, edit or remove management users.





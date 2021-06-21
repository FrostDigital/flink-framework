# Plugin: API Docs

> 👷🏻‍♂️ This plugin is in alpha

A plugin that generates API documentation based on registered handlers and their routes and schemas.

## Usage

Install plugin:

```
npm i -S @flink-app/api-docs-plugin
```

Add to FlinkApp:

```typescript
import { apiDocPlugin } from "@flink-app/api-docs-plugin";

new FlinkApp<C>({
  //...
  plugins: [
    apiDocsPlugin({
      // optional, defaults to `/docs`
      path: "/api-docs",
    }),
  ],
});
```

Start the app and open `http://localhost:3333/api-docs` in a browser.

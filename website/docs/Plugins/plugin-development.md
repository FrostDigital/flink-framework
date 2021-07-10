# Plugin development

Plugins makes sense when you want to reuse functionality in multiple apps or just
contain functionality in its own module (plugin) to make it more maintainable.

Create empty project:

> TODO

This will create an empty plugin project in folder `my-plugin`.

Now define your plugin in `src/MyPlugin.ts`. Often plugins needs options that is configured when adding
the plugin is a Flink app.

```
export type MyPluginOptions = {
  hello: string;
};

export const myPlugin = (options: MyPluginOptions): FlinkPlugin => {
  return {
    // Name of plugin
    name: "My plugin",
    // Plugin key, this is used as identifier/property to access plugin context from host app
    key: "myPlugin",
    // Optionally set plugin context which will be merged into host Flink apps context
    ctx: {
      sayHello: () => console.log(options.hello)
    }
  };
};
```

### Adding handlers

### Working with the Express app

### Publishing

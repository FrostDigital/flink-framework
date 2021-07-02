# Flink API Docs
A FLINK plugin that makes it easy to consume data from Content One.

The plugin also makes it possible to call ContentOne actions.

## Installation

Install plugin to your flink app project:

```
npm i -S @flink-app/contentone-plugin
```

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { ContentOneClient, ContentOneManagementAction, contentOnePlugin } from "@flink-app/contentone-plugin"

function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    loader: (file: any) => import(file),
    plugins: [
        // Register plugin
      contentOnePlugin({
        collections : {
          "Collection1" : new ContentOneClient({ 
              collection : "collectionid",
              token : "token.."
          }),
          "Collection2" : new ContentOneClient({ 
              collection : "collectionid",
              token : "token.."
          })          
        },
        actions : {
          "action1" : new ContentOneManagementAction({ 
            actionId : "action1",
            apiKey : "apikey"
          })
        }
      })
    ],
  }).start();
}

```

Finally add plugin context type as generic argument to your application context (probable the `Ctx.ts` in root project)
````
import { contentOnePluginContext } from "@flink-app/contentone-plugin";

export interface Ctx extends FlinkContext<contentOnePluginContext> {
  repos: {};
}

````

## Collections

Collections can be called for `get`,`list` and `query` actions.

### get 
````
const document  = (await ctx.plugins.contentOne.collections.NewsItems.get("documentid")).document
````

The following optional options can also be specified:

| Options       | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| language      | Language code (ISO 639-1) to get the documents in                 |
| environment   | "Production" | "Staging",                                         |
| resolve       | "yes" | "no" - Resolving related documents                        |

````
const document  = (await ctx.plugins.contentOne.collections.NewsItems.get("documentid"), { language : "en" }).document
````

### list 
````
const documents  = (await ctx.plugins.contentOne.collections.NewsItems.list()).documents
````
The following optional options can also be specified:

| Options         | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| language        | Language code (ISO 639-1) to get the documents in                 |
| environment     | "Production" | "Staging",                                         |
| resolve         | "yes" | "no" - Resolving related documents                        |
| skip            | Skip a number of documents, defaults to 0                         |
| limit           | Maximum of documents returned, defaults to 10 000                 |
| sort            | Field to sort the documents by                                    |
| sort_direction  | "asc" | "desc"                                                    |

````
const document  = (await ctx.plugins.contentOne.collections.NewsItems.get("documentid"), { skip : 100 }).document
````



### query
```
const documents  = (await ctx.plugins.contentOne.collections.NewsItems.query("QueryName", { Arg : "Hello" })).documents
````
The following optional options can also be specified:

| Options         | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| language        | Language code (ISO 639-1) to get the documents in                 |
| environment     | "Production" | "Staging",                                         |
| resolve         | "yes" | "no" - Resolving related documents                        |
| skip            | Skip a number of documents, defaults to 0                         |
| limit           | Maximum of documents returned, defaults to 10 000                 |
| sort            | Field to sort the documents by                                    |
| sort_direction  | "asc" | "desc"                                                    |

````
const documents  = (await ctx.plugins.contentOne.collections.NewsItems.query("QueryName", { Arg : "Hello" }, { limit : 1000 })).documents
````




## Actions
Content One actions can easily be called;
````
const resp =  ctx.plugins.contentOne.actions.ActionName.execute({ Arg : "Hello" });
````


## Direct collection calls
Direct calls to a collection can be made without configured by the initializing code. To do this use the getClient method:
````
const document  = (await ctx.plugins.contentOne.getClient({ token : "token", "collection" : "collectionid"}).get("documentid")).document
````

## Direct action calls
Direct calls to a actions can be made without configured by the initializing code. To do this use the management.action method:
````
const resp = (await ctx.plugins.contentOne.management.action("actionid", "apikey", {})).data;
````



## Typed calls
Each of these calls can specify the type on the returned document or documents by setting the type as a generic argument.
````
const document  = (await ctx.plugins.contentOne.collections.NewsItems.get<Type>("documentid")).document


````


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
        },
        cdns : {
          "photos" : new ContentOneCDN({
            token : "file_archive_token"
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
````
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


## Files
Content One have a built in File Archive and with this plugin you might easily upload files:

First configure your cdn:connections on plugin initilization. Then simply call the upload function:

````
const resp = await ctx.plugins.contentOne.cdns.photos.upload("/tmp/file.png", {} )

````

The following options can be specified

#### folderId
Folter to save the file to. Normally leave empty and default folder for the token will be used.

#### image_rotate
Set to 90,180,270 or auto to rotate the image, normally set it to auto and the image will be rotated based on the exif data of the image.

#### image_resize_width
Specify a width if you like to resize the image to a specific width

#### image_resize_height
Specify a height if you like to resize the image to a specific height

#### image_resize_max
If set to "yes" the image will be as big as possible, but never bigger then the specified width and height (and still keeping the aspect ratio)

#### image_resize_crop
Make the size of the resized image exacly the specified size, and crop image if required. 

#### image_thumb
Set to yes to also generate a thumbnail

#### image_thumb_width
Specify width of thumbnail

#### image_thumb_height
Specify height of thumbnail



### Response
When uploading a file you will get a response back looking something like this:
````
{
  status: 'success',
  file: {
    _id: '60e461887be82613ad95b39c',
    ProjectID: '5a980fb80459493b3378c9a2',
    Local_FileName: 'watermark.png',
    CDN_FileName: 'ef32c174d9c94caf8d5490626d62952a.png',
    Url: 'https://aqurocm.blob.core.windows.net/5a980fb80459493b3378c9a2-f7dd9134781541f6adacbdd654091847/ef32c174d9c94caf8d5490626d62952a.png',
    Type: 'Image',
    Size: 26888,
    CreatedDate: '2021-07-06T13:58:32.920Z',
    Thumbnail: 'https://aqurocm.blob.core.windows.net/5a980fb80459493b3378c9a2-f7dd9134781541f6adacbdd654091847/db275bd42fe345499fded27a66bf59ce.png',
    ThumbnailCDN_Filename: 'db275bd42fe345499fded27a66bf59ce.png',
    FolderID: '5a9811ac0459493b3378c9b6'
  }
}
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

## Direct CDN calls
Direct calls to a CDN client can also be made without configuring it first:
````
const resp  = await ctx.plugins.contentOne.cdns.photos.upload("./file.txt", "token", { })
````


## Typed calls
Each of these calls can specify the type on the returned document or documents by setting the type as a generic argument.
````
const document  = (await ctx.plugins.contentOne.collections.NewsItems.get<Type>("documentid")).document


````


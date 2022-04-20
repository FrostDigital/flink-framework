# Flink API Docs

**WORK IN PROGRESS 👷‍♀️👷🏻‍♂️**

A FLINK plugin that lets you work with s3.

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/s3-plugin
```

Add and configure plugin in your app startup (probable the `index.ts` in root project):

```
import { s3Plugin } from "@flink-app/s3-plugin";


function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    plugins: [
        // Register plugin
        s3Plugin({
                accessKeyId: "XXX",
                secretAccessKey: "YYY",
                bucket: "ZZZ",
                s3Acl: "public-read",
                enableUpload: true,
        }),
    ],
  }).start();
}
```

Finally add the s3PluginContext to your `Ctx.ts`
```
import { s3PluginContext } from "@flink-app/s3-plugin"
export interface Ctx extends FlinkContext<s3PluginContext> {

}
```



## Using built in upload endpoint
Set `enableUpload = true` to enable the /file-upload endpoint. 
Post a multipart file upload to that endpoint to upload the file to S3. 
Protect this route by specifying the required permission by specifying `uploadPermissionRequired` property to the required permission. Eg. `uploadPermissionRequired="authenticated"` setting. 


## Using the s3Client
From your handlers, access the s3Client by  `ctx.plugins.s3Plugin.s3Client`.
You will find methods for upload, delete and so on.


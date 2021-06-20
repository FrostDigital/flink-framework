# Firebase messaging plugin

**WORK IN PROGRESS 👷‍♀️👷🏻‍♂️**

A FLINK plugin used for sending push notifications using Firebase (a.k.a. Firebase Cloud Messaging).

## Usage

Install plugin to your flink app project:

```
npm i -S @flink-app/firebase-messaging-plugin
```

Add and configure plugin in your app startup:

```
import { apiDocPlugin } from "@flink-app/api-docs-plugin";

function start() {
  new FlinkApp<AppContext>({
    name: "My app",
    loader: (file: any) => import(file),
    plugins: [
        firebaseMessagingPlugin({
            serverKey: "YOUR FIREBASE SERVER KEY"
        })
    ],
  }).start();
}

```

## Configuration

- `serverKey` - The firebase server key

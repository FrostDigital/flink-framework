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
import { firebaseMessagingPlugin } from "@flink-app/firebase-messaging-plugin";

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

Add it to your app context (normally `Ctx.ts` in the root folder of your project)
```
import { FirebaseMessagingContext } from "@flink-app/firebase-messaging-plugin";

export interface Ctx extends FlinkContext<FirebaseMessagingContext> {
  ....
}

```

## Configuration

- `serverKey` - The firebase server key

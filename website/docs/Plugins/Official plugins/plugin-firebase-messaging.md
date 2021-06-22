# Plugin: Firebase messaging

> 👷🏻‍♂️ This plugin is in alpha

A plugin that sends messages/push notifications using Google Firebase.

## Usage

Install plugin:

```
npm i -S @flink-app/firebase-messaging-plugin
```

Add to FlinkApp:

```typescript
import { firebaseMessagingPlugin } from "@flink-app/firebase-messaging-plugin";

new FlinkApp<C>({
  //...
  plugins: [
    firebaseMessagingPlugin({
      // The firebase server key
      serverKey: "my-secret-firebase-key",
      // If plugin should expose HTTP endpoints/handlers for sending messages
      exposeEndpoints: true,
    }),
  ],
});
```

## Context methods

The plugin exposes the following method(s) on application context:

```typescript
firebaseMessaging.send(message);
```

## Exposed endpoints

Plugin can, if configured to do so (see `exposedEndpoints`), expose route `POST /send-message` to let API consumers deliver message(s).

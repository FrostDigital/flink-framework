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


## Use as a managementmodule in the management-api-plugin

Initiate the module and configure it:

```
import { GetManagementModule as GetNotificationManagementModule } from "@flink-app/firebase-messaging-plugin"
const notificationManagementModule = GetNotificationManagementModule({
  ui: true,
  uiSettings: {
      title: "Notifications"
  },
  segments : [{
    id : "all", 
    description : "All app users", 
    handler : async (ctx : Ctx) => {
      const users = await ctx.repos.userRepo.findAll({})
      return users.map(u=>({
        userId : u._id.toString(),
        pushToken : u.pushNotificationTokens.map(p=>p.token)
      }))
    },
   
  }],
  data : [],
})
```





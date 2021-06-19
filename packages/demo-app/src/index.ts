import { FlinkApp } from "@flink-app/flink";
import AppContext from "./ApplicationContext";
import { apiDocPlugin } from "@flink-app/api-docs-plugin";
import { firebaseMessagingPlugin } from "@flink-app/firebase-messaging-plugin";

function start() {
  new FlinkApp<AppContext>({
    name: "Demo app",
    debug: true,
    loader: (file: any) => import(file),
    plugins: [
      apiDocPlugin(),
      firebaseMessagingPlugin({ serverKey: "foo", exposeEndpoints: true }),
    ],
  }).start();
}

start();

export default () => {};

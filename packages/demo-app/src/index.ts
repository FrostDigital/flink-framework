import { apiDocPlugin } from "@flink-app/api-docs-plugin";
import { firebaseMessagingPlugin } from "@flink-app/firebase-messaging-plugin";
import { FlinkApp } from "@flink-app/flink";
import AppContext from "./ApplicationContext";

async function start() {
    await new FlinkApp<AppContext>({
        name: "Demo app",
        debug: true,
        // db: {
        //   uri: "mongodb://localhost:27017/flink-demo-app",
        // },
        plugins: [apiDocPlugin(), firebaseMessagingPlugin({ serviceAccountKey: "foo", exposeEndpoints: true })],
    }).start();
}

start();

export default () => {};

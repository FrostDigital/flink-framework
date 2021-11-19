import { FlinkApp } from "@flink-app/flink";
import { Ctx } from "./Ctx";

function start() {
  new FlinkApp<Ctx>({
    name: "My flink app",
    debug: true,
    db: {
      uri: "mongodb://localhost:27017/my-flink-app",
    },
    plugins: [
      // Add any plugins here
    ],
  }).start();
}

start();

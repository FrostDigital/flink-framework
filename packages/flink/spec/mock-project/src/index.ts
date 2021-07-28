import { FlinkApp } from "@flink-app/flink";
import * as ManuallyAddedHandler from "./handlers/ManuallyAddedHandler";
import * as ManuallyAddedHandler2 from "./handlers/ManuallyAddedHandler2";

async function start() {
  const app = await new FlinkApp<any>({
    name: "Test app",
    plugins: [],
  }).start();

  app.addHandler(ManuallyAddedHandler);
  app.addHandler(ManuallyAddedHandler2, { path: "/override" });
}

start();

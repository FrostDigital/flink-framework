import { FlinkApp } from "@flink-app/flink";
import AppContext from "./ApplicationContext";
import { apiDocPlugin } from "@flink-app/api-docs-plugin";

function start() {
  new FlinkApp<AppContext>({
    name: "Demo app",
    debug: true,
    loader: (file: any) => import(file),
    plugins: [apiDocPlugin()],
  }).start();
}

start();

export default () => {};

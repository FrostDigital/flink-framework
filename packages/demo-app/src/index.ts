import { FlinkApp } from "@flink-app/flink";
import AppContext from "./ApplicationContext";

function start() {
  new FlinkApp<AppContext>({
    name: "Demo app",
    debug: true,
    loader: (file: any) => import(file),
  }).start();
}

start();

export default () => {};

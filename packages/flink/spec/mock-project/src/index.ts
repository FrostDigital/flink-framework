import { FlinkApp, GetHandler, HttpMethod } from "@flink-app/flink";
import manuallyAddedHandler from "./handlers/ManuallyAddedHandler";

async function start() {
  const app = await new FlinkApp<any>({
    name: "Test app",
    plugins: [],
  }).start();

  app.addHandler(
    {
      routeProps: {
        path: "/manually-added-handler",
        method: HttpMethod.get,
      },
    },
    // Referenced to other file
    manuallyAddedHandler
  );

  app.addHandler(
    {
      routeProps: {
        path: "/manually-added-handler2",
        method: HttpMethod.get,
      },
    },
    // Defined in same file
    manuallyAddedHandler2
  );
}

const manuallyAddedHandler2: GetHandler<any, { hello: string }> = async ({
  req,
}) => {
  return {
    data: {
      hello: "world",
    },
  };
};

start();

export default () => {};

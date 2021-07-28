import {
  FlinkApp,
  GetHandler,
  Handler,
  HandlerConfigWithMethod,
  HttpMethod,
} from "@flink-app/flink";
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

  // Add handler in a loop
  const handlerDefs: {
    opts: HandlerConfigWithMethod;
    handlerFn: Handler<any>;
  }[] = [
    {
      opts: {
        routeProps: {
          method: HttpMethod.get,
          path: "/loop1",
        },
      },
      handlerFn: handler1,
    },
    {
      opts: {
        routeProps: {
          method: HttpMethod.get,
          path: "/loop2",
        },
      },
      handlerFn: handler2,
    },
  ];

  handlerDefs.forEach(({ opts, handlerFn }) => app.addHandler(opts, handlerFn));
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

const handler1: GetHandler<any, { loop: string }> = async () => {
  return {
    data: {
      loop: "hello from handler 1",
    },
  };
};

const handler2: GetHandler<any, { loop: string }> = async () => {
  return {
    data: {
      loop: "hello from handler 2",
    },
  };
};

start();

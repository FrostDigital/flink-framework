import { FlinkApp, GetHandler, HttpMethod } from "@flink-app/flink";

async function start() {
  const app = await new FlinkApp<any>({
    name: "Test app",
    plugins: [],
  }).start();

  app.addHandler(
    {
      routeProps: {
        path: "/foo",
        method: HttpMethod.get,
      },
    },
    getFooHandler
  );
}

const getFooHandler: GetHandler<any, { hello: string }> = async ({ req }) => {
  return {
    data: {
      hello: "world",
    },
  };
};

start();

export default () => {};

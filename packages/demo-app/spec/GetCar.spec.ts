import { join } from "path";
import { FlinkApp, FlinkContext } from "../../flink/dist/src";
import ApplicationContext from "../src/ApplicationContext";
import GetCar from "../src/handlers/car/GetCar";

fdescribe("GetCar", () => {
  // const ctx: FlinkContext = {
  //   repos: {},
  //   plugins: [],
  // };

  // const mockApp = new FlinkApp<ApplicationContext>({
  //   name: "Demo app",
  //   debug: true,
  //   loader: (file: any) => import(file),
  //   plugins: [
  //     //mock(apiDocPlugin()),
  //     //firebaseMessagingPlugin({ serverKey: "foo", exposeEndpoints: true }),
  //   ],
  // });

  const port = 3334;
  const baseUrl = "http://localhost:" + port;

  /**
   * Spins a Flink applications and invokes HTTP calls to it
   */

  let flinkApp: FlinkApp<any>;

  beforeAll(async () => {
    flinkApp = new FlinkApp<any>({
      port,
      name: "Test app",
      debug: true,
      loader: (file: any) => import(join(process.cwd(), "src", file)),
    });

    await flinkApp.start();
  });

  fit("should get car", () => {
    console.log("__dirname", __dirname, "process.cwd()", process.cwd());
    //  mockApp.r
    // GetCar({ctx, req});
  });
});

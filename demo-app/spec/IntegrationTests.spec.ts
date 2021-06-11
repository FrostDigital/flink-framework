import { FlinkApp } from "@flink-app/flink";

describe("Integration tests", () => {
  /**
   * Spins a Flink applications and invokes HTTP calls to it
   */

  let flinkApp: FlinkApp<any>;

  beforeAll(async () => {
    flinkApp = new FlinkApp<any>({
      port: 3334,
      name: "Test app",
      debug: true,
      // loader: (file: any) => import(join("spec", "mock-project", "src", file)),
      loader: (file: any) => import(file),
      // appRoot: "./spec/mock-project",
    });

    await flinkApp.start();
  });

  fit("should route to handlers", () => {});
});

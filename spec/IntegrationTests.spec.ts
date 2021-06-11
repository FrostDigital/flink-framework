import { Project } from "ts-morph";
import { FlinkApp } from "../src";
import { getSchemaFromHandlerSourceFile } from "../src/FlinkTsUtils";
import { join } from "path";
import { exec } from "child_process";

describe("Integration tests", () => {
  /**
   * Spins a Flink applications and invokes HTTP calls to it
   */

  let flinkApp: FlinkApp<any>;

  beforeAll(async () => {
    exec("ls -lh", (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }

      console.log(`stdout:\n${stdout}`);
    });

    // flinkApp = new FlinkApp<any>({
    //   port: 3334,
    //   name: "Test app",
    //   debug: true,
    //   loader: (file: any) => import(join("spec", "mock-project", "src", file)),
    //   appRoot: "./spec/mock-project",
    // });

    // await flinkApp.start();
  });

  fit("should route to handlers", () => {});
});

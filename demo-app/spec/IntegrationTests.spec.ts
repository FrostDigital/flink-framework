import { FlinkApp } from "@flink-app/flink";
import { join } from "path";
import got from "got";

describe("Integration tests", () => {
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
      loader: (file: any) => import(join("..", "src", file)),
    });

    await flinkApp.start();
  });

  it("should get 404", async () => {
    const res = await got(`${baseUrl}/fooo`, {
      json: true,
      throwHttpErrors: false,
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it("should get json", async () => {
    const res = await got(`${baseUrl}/car`, { json: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.model).toBe("Volvo");
  });

  it("should set and get HTTP header", async () => {
    const res = await got(`${baseUrl}/header-test`, {
      json: true,
      headers: { "x-test": "test" },
    });
    expect(res.headers["x-test"]).toBe("test");
  });
});

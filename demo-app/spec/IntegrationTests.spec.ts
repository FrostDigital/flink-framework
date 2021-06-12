import { FlinkApp } from "@flink-app/flink";
import { jwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
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
      auth: jwtAuthPlugin({
        secret: "123",
        getUser: async (id) => {
          return { id: id, username: "foo@foo.com" };
        },
      }),
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

  it("should fail to get authenticated route if not logged in", async () => {
    const res = await got(`${baseUrl}/car-secret`, {
      json: true,
      throwHttpErrors: false,
    });
    expect(res.statusCode).toBe(401);
  });

  it("should login and get authenticated route", async () => {
    const res = await got.post(`${baseUrl}/login`, {
      body: {
        username: "bob@frost.se",
        password: "password",
      },
      json: true,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();

    const secretRes = await got(`${baseUrl}/car-secret`, {
      json: true,
      headers: {
        authorization: `Bearer ${res.body.data.token}`,
      },
    });

    expect(secretRes.statusCode).toBe(200);
  });
});

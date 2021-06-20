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
        rolePermissions: {
          user: ["car:get"],
          manager: ["foo:get"],
          admin: ["*"],
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

  it("should fail to login if invalid password", async () => {
    const res = await got.post(`${baseUrl}/login`, {
      body: {
        username: "bob@frost.se",
        password: "faulty",
      },
      json: true,
      throwHttpErrors: false,
    });

    expect(res.statusCode).toBe(401);
  });

  it("should signup", async () => {
    const res = await got.post(`${baseUrl}/signup`, {
      body: {
        username: "barak@obama.com",
        password: "BruceSpringsteen2021",
      },
      json: true,
    });

    expect(res.statusCode).toBe(200);
  });

  it("should fail to signup if password is not compliant with password policy", async () => {
    const res = await got.post(`${baseUrl}/signup`, {
      body: {
        username: "barak@obama.com",
        password: "1234",
      },
      json: true,
      throwHttpErrors: false,
    });

    expect(res.statusCode).toBe(400);
  });

  describe("schema validation", () => {
    it("should respond with bad request if req body is not compliant with schema", async () => {
      const res = await got.post(`${baseUrl}/car`, {
        body: {
          foo: "bar",
        },
        json: true,
        throwHttpErrors: false,
      });

      expect(res.statusCode).toBe(400);
    });

    it("should respond with internal server error if response body is not compliant with schema", async () => {
      const res = await got.get(`${baseUrl}/car-invalid`, {
        json: true,
        throwHttpErrors: false,
        retry: 0,
      });

      expect(res.statusCode).toBe(500);
    });
  });

  describe("permissions", () => {
    let token = "";

    beforeAll(async () => {
      const res = await got.post(`${baseUrl}/login`, {
        body: {
          username: "bob@frost.se",
          password: "password",
        },
        json: true,
      });
      token = res.body.data.token;
    });

    it("should not allow access if user is missing permissions", async () => {
      const res = await got.get(`${baseUrl}/car-secret-permissions`, {
        json: true,
        headers: {
          authorization: `Bearer ${token}`,
        },
        throwHttpErrors: false,
        retry: 0,
      });

      expect(res.statusCode).toBe(401);
    });

    it("should allow access when user has correct permissions", () => {});
  });
});

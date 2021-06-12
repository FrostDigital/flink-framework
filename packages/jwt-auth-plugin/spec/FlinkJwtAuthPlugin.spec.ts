import { FlinkRequest } from "@flink-app/flink";
import jwtSimple from "jwt-simple";
import { jwtAuthPlugin } from "../src/FlinkJwtAuthPlugin";

describe("FlinkJwtAuthPlugin", () => {
  it("should create and configure plugin", () => {
    const plugin = jwtAuthPlugin({
      secret: "secret",
      getUser: async (id: string) => {
        return {
          id,
          username: "username",
        };
      },
    });

    expect(plugin).toBeDefined();
  });

  it("should fail auth if no token was provided", async () => {
    const plugin = jwtAuthPlugin({
      secret: "secret",
      getUser: async (id: string) => {
        return {
          id,
          username: "username",
        };
      },
    });

    const mockRequest = {
      headers: {
        authorization: "",
      },
    } as FlinkRequest;

    const authenticated = await plugin.authenticateRequest(mockRequest);

    expect(authenticated).toBeFalse();
  });

  it("should fail auth if token is invalid provided", async () => {
    const plugin = jwtAuthPlugin({
      secret: "secret",
      getUser: async (id: string) => {
        fail(); // Should not invoke this
        return {
          id,
          username: "username",
        };
      },
    });

    const mockRequest = {
      headers: {
        authorization: "Bearer 890suf089sudf0usdf0uf9s",
      },
    } as FlinkRequest;

    const authenticated = await plugin.authenticateRequest(mockRequest);

    expect(authenticated).toBeFalse();
  });

  it("should decode token and authenticate", async () => {
    const secret = "secret";
    const userId = "123";
    const encodedToken = jwtSimple.encode({ id: userId }, secret);

    const plugin = jwtAuthPlugin({
      secret,
      getUser: async ({ id }: { id: string }) => {
        expect(id).toBe(userId);
        return {
          id,
          username: "username",
        };
      },
    });

    const mockRequest = {
      headers: {
        authorization: "Bearer " + encodedToken,
      },
    } as FlinkRequest;

    const authenticated = await plugin.authenticateRequest(mockRequest);

    expect(authenticated).toBeTruthy();
  });

  it("should generate token", async () => {
    const secret = "secret";
    const plugin = jwtAuthPlugin({
      secret,
      getUser: async (id: string) => {
        fail(); // Should not invoke this
        return {
          id,
          username: "username",
        };
      },
    });

    const token = await plugin.createToken({ id: "123" });

    expect(token).toBeDefined();

    const decoded = jwtSimple.decode(token, secret);

    expect(decoded.id).toBe("123");
  });
});

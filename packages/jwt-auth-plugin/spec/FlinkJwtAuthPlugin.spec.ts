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
            rolePermissions: {},
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
            rolePermissions: {
                user: ["*"],
            },
        });

        const mockRequest = {
            headers: {
                authorization: "",
            },
        } as FlinkRequest;

        const authenticated = await plugin.authenticateRequest(mockRequest, "foo");

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
            rolePermissions: {
                user: ["*"],
            },
        });

        const mockRequest = {
            headers: {
                authorization: "Bearer 890suf089sudf0usdf0uf9s",
            },
        } as FlinkRequest;

        const authenticated = await plugin.authenticateRequest(mockRequest, "foo");

        expect(authenticated).toBeFalse();
    });

    it("should decode token and authenticate", async () => {
        const secret = "secret";
        const userId = "123";
        const encodedToken = jwtSimple.encode({ id: userId, roles: ["user"] }, secret);

        const plugin = jwtAuthPlugin({
            secret,
            getUser: async ({ id }: { id: string }) => {
                expect(id).toBe(userId);
                return {
                    id,
                    username: "username",
                };
            },
            rolePermissions: {
                user: ["*"],
            },
        });

        const mockRequest = {
            headers: {
                authorization: "Bearer " + encodedToken,
            },
        } as FlinkRequest;

        const authenticated = await plugin.authenticateRequest(mockRequest, "foo");

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
            rolePermissions: {
                user: ["*"],
            },
        });

        const token = await plugin.createToken({ id: "123" }, ["user"]);

        expect(token).toBeDefined();

        const decoded = jwtSimple.decode(token, secret);

        expect(decoded.id).toBe("123");
    });

    describe("single session", () => {
        function createPlugin(callbacks: {
            isSessionValid: (token: string, decodedToken: any) => Promise<boolean>;
            setUserSession: (token: string, user: any) => Promise<boolean>;
        }) {
            return jwtAuthPlugin({
                secret: "secret",
                getUser: async (id: string) => {
                    return {
                        id,
                        username: "username",
                    };
                },
                rolePermissions: {
                    user: ["*"],
                },
                singleSession: {
                    isSessionValid: callbacks.isSessionValid,
                    setUserSession: callbacks.setUserSession,
                },
            });
        }

        it("should invoke isSessionValid callback when authenticating a request", async () => {
            const secret = "secret";
            const userId = "123";
            const encodedToken = jwtSimple.encode({ id: userId, roles: ["user"] }, secret);

            let isSessionValidInvoked = false;
            let decodedToken: any;

            const plugin = createPlugin({
                isSessionValid: async (token: string, _decodedToken: any) => {
                    isSessionValidInvoked = true;
                    decodedToken = _decodedToken;
                    return true;
                },
                setUserSession: async (token: string, user: any) => true,
            });

            const mockRequest = {
                headers: {
                    authorization: "Bearer " + encodedToken,
                },
            } as FlinkRequest;

            const authenticated = await plugin.authenticateRequest(mockRequest, "foo");

            await sleep(100);

            expect(authenticated).toBeTruthy();
            expect(isSessionValidInvoked).toBeTruthy();
            expect(decodedToken).toBeDefined();
        });

        it("should fail auth if session is invalid", async () => {
            const secret = "secret";
            const userId = "123";
            const encodedToken = jwtSimple.encode({ id: userId, roles: ["user"] }, secret);

            const plugin = createPlugin({
                isSessionValid: async (token: string) => {
                    return false;
                },
                setUserSession: async (token: string, user: any) => true,
            });

            const mockRequest = {
                headers: {
                    authorization: "Bearer " + encodedToken,
                },
            } as FlinkRequest;

            const authenticated = await plugin.authenticateRequest(mockRequest, "foo");

            await sleep(100);

            expect(authenticated).toBeFalse();
        });

        it("should set user session when creating token", async () => {
            const userId = "123";
            let setUserSessionInvoked = false;

            const plugin = createPlugin({
                isSessionValid: async (token: string) => true,
                setUserSession: async (userId: string, token: string) => {
                    setUserSessionInvoked = true;
                    expect(userId).toBe("123");
                    return true;
                },
            });

            const token = await plugin.createToken({ _id: userId }, ["user"]);

            expect(token).toBeDefined();
            expect(setUserSessionInvoked).toBeTruthy();
        });

        it("should fail to set user session when creating token", async () => {
            const userId = "123";

            const plugin = createPlugin({
                isSessionValid: async (token: string) => true,
                setUserSession: async (userId: string, token: string) => {
                    return false;
                },
            });

            await expectAsync(plugin.createToken({ _id: userId }, ["user"])).toBeRejectedWithError("Failed to set user session");
        });
    });
});

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

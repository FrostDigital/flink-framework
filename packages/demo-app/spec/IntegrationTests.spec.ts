import { FlinkApp, HttpMethod } from "@flink-app/flink";
import { jwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import * as testUtils from "@flink-app/test-utils";
import * as NonAutoRegisteredHandler from "../src/handlers/NonAutoRegisteredHandler";
import { afterDelayInvocations } from "../src/jobs/AfterDelayJob";
import { cronJobInvocations } from "../src/jobs/FooCronJob";
import { intervalJobInvocations } from "../src/jobs/IntervalJob";
import CarListRes from "../src/schemas/CarListRes";

describe("Integration tests", () => {
    let flinkApp: FlinkApp<any>;

    beforeAll(async () => {
        flinkApp = await new FlinkApp<any>({
            port: 3335,
            name: "Test app",
            debug: true,
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
        }).start();

        flinkApp.addHandler(NonAutoRegisteredHandler, { method: HttpMethod.get });

        testUtils.init(flinkApp);
    });

    it("should register routes", () => {
        expect(flinkApp.getRegisteredRoutes().length).toBe(12);
    });

    it("should get 404", async () => {
        const res = await testUtils.get("/fooo");

        expect(res.status).toBe(404);
        expect(res.error).toBeDefined();
    });

    it("should get list of cars", async () => {
        const res = await testUtils.get<CarListRes>(`/car`);
        expect(res.status).toBe(200);
        expect(res.data).toBeDefined();
        expect(res.data!.cars[0].model).toBe("Volvo");
    });

    it("should set and get HTTP header", async () => {
        const res = await testUtils.get(`/header-test`, {
            headers: { "x-test": "test" },
        });
        expect(res.headers && res.headers["x-test"]).toBe("test");
    });

    it("should fail to get authenticated route if not logged in", async () => {
        const res = await testUtils.get(`/car-secret`);
        expect(res.status).toBe(401);
    });

    it("should login and get authenticated route", async () => {
        const res = await testUtils.post(`/login`, {
            username: "bob@frost.se",
            password: "password",
        });

        expect(res.status).toBe(200);
        expect(res.data.token).toBeDefined();

        const secretRes = await testUtils.get(`/car-secret`, {
            headers: {
                authorization: `Bearer ${res.data.token}`,
            },
        });

        expect(secretRes.status).toBe(200);
    });

    it("should fail to login if invalid password", async () => {
        const res = await testUtils.post(`/login`, {
            username: "bob@frost.se",
            password: "faulty",
        });

        expect(res.status).toBe(401);
    });

    it("should signup", async () => {
        const res = await testUtils.post(`/signup`, {
            username: "barak@obama.com",
            password: "BruceSpringsteen2021",
        });

        expect(res.status).toBe(200);
    });

    it("should fail to signup if password is not compliant with password policy", async () => {
        const res = await testUtils.post(`/signup`, {
            username: "barak@obama.com",
            password: "1234",
        });

        expect(res.status).toBe(400);
    });

    describe("schema validation", () => {
        it("should respond with bad request if req body is not compliant with schema", async () => {
            const res = await testUtils.post(`/car`, {
                foo: "bar",
            });

            expect(res.status).toBe(400);
        });

        it("should respond with internal server error if response body is not compliant with schema", async () => {
            const res = await testUtils.get(`/car-invalid`);
            expect(res.status).toBe(500);
        });
    });

    describe("permissions", () => {
        let token = "";

        beforeAll(async () => {
            const res = await testUtils.post(`/login`, {
                username: "bob@frost.se",
                password: "password",
            });
            token = res.data.token;
        });

        it("should not allow access if user is missing permissions", async () => {
            const res = await testUtils.get(`/car-secret-permissions`, {
                headers: {
                    authorization: `Bearer ${token}`,
                },
            });

            expect(res.status).toBe(401);
        });
    });

    describe("jobs", () => {
        beforeAll(async () => {
            expect(intervalJobInvocations).toBe(0);
            expect(afterDelayInvocations).toBe(0);
            expect(cronJobInvocations).toBe(0);
            await sleep(2500);
        });

        it("should run job on interval", async () => {
            expect(intervalJobInvocations).toBeGreaterThan(1);
        });
        it("should run job afterDelay", async () => {
            expect(afterDelayInvocations).toBe(1);
        });
        it("should run job using cron schedule", async () => {
            // TODO: I have no idea how to test this properly
            // expect(cronJobInvocations).toBe(0);
        });
    });
});

function sleep(ms = 500) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

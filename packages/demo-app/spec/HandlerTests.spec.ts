import { FlinkApp } from "@flink-app/flink";
import * as testUtils from "@flink-app/test-utils";
import { noOpAuthPlugin } from "@flink-app/test-utils";
import ApplicationContext from "../src/ApplicationContext";
import GetCarById from "../src/handlers/car/GetCarById";
import GetCars from "../src/handlers/car/GetCars";
import GetHeaderTest from "../src/handlers/GetHeaderTest";

// Example of a test suite that invokes handlers
// directly, without using the HTTP server.

describe("Handler tests", () => {
    let flinkApp: FlinkApp<ApplicationContext>;

    beforeAll(async () => {
        flinkApp = await new FlinkApp<ApplicationContext>({
            name: "Test app",
            debug: true,
            auth: noOpAuthPlugin(),
            scheduling: {
                enabled: false,
            },
            disableHttpServer: true,
        }).start();
    });

    it("should get list of cars", async () => {
        const res = await GetCars({
            ctx: flinkApp.ctx,
            req: testUtils.mockReq(),
        });

        expect(res.data).toBeDefined();
        expect(res.data!.cars[0].model).toBe("Volvo");
    });

    it("should set and get HTTP header", async () => {
        const res = await GetHeaderTest({
            ctx: flinkApp.ctx,
            req: testUtils.mockReq({
                headers: { "x-test": "test" },
            }),
        });
        expect(res.headers && res.headers["x-test"]).toBe("test");
    });

    it("should get car by id", async () => {
        const res = await GetCarById({
            ctx: flinkApp.ctx,
            req: testUtils.mockReq({
                params: { id: "123" },
            }),
        });

        expect(res.status).toBe(200);
    });
});

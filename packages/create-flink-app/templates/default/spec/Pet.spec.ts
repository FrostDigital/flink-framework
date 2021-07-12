import * as testUtils from "@flink-app/test-utils";
import { join } from "path";
import { FlinkApp } from "../../../../flink/dist/src";
import { Pet } from "../src/schemas/Pet";

describe("Pet", () => {
  let flinkApp: FlinkApp<any>;

  beforeAll(async () => {
    flinkApp = new FlinkApp({
      name: "Test",
      loader: (file) => import(join(process.cwd(), "src", file)),
      db: {
        uri: "mongodb://localhost:27017/my-flink-app-test",
      },
    });

    testUtils.init(await flinkApp.start());
  });

  describe("get pet", () => {
    const aPet: Pet = {
      _id: "123",
      age: 12,
      created: new Date(),
      name: "Buster",
    };

    beforeAll(async () => {
      await flinkApp.db?.collection("pets").insertOne(aPet);
    });

    it("should get 404", async () => {
      const { status } = await testUtils.get("/pet/foo");
      expect(status).toBe(404);
    });

    it("should get pet", async () => {
      const { status, data } = await testUtils.get<Pet>(`/pet/${aPet._id}`);
      expect(status).toBe(200);
      expect(data).toEqual(aPet);
    });
  });
});

import { FlinkApp } from "@flink-app/flink";
import * as testUtils from "@flink-app/test-utils";
import { Ctx } from "../src/Ctx";
import { Pet } from "../src/schemas/Pet";

describe("Pet", () => {
  let flinkApp: FlinkApp<Ctx>;

  beforeAll(async () => {
    flinkApp = new FlinkApp({
      name: "Test",
      db: {
        uri: "mongodb://localhost:27017/my-flink-app-test",
      },
    });

    testUtils.init(await flinkApp.start());
  });

  describe("get pet", () => {
    let aPet: Pet;

    beforeAll(async () => {
      aPet = await flinkApp.ctx.repos.petRepo.create({
        age: 12,
        created: new Date(),
        name: "Buster",
      });
    });

    it("should get 404", async () => {
      const nonExistingPetId = "5349b4ddd2781d08c09890f3";
      const { status } = await testUtils.get(`/pet/${nonExistingPetId}`);
      expect(status).toBe(404);
    });

    it("should get pet", async () => {
      const { status, data } = await testUtils.get<Pet>(`/pet/${aPet._id}`);
      expect(status).toBe(200);
      expect(data!._id).toEqual(aPet._id.toString());
      expect(new Date(data!.created)).toEqual(aPet.created);
    });
  });
});

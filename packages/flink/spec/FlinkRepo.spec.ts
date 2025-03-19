import { Collection, Db, MongoClient } from "mongodb";
import { FlinkRepo } from "../src/FlinkRepo";

interface Model {
    _id: string;
    name: string;
}

class Repo extends FlinkRepo<any, Model> {}

describe("FlinkRepo", () => {
    if (!process.env.CI) {
        console.warn("Skipping repo test which requires db if CI flag is not set");
        return;
    }

    let db: Db;
    let collection: Collection;
    let repo: Repo;

    beforeAll(async () => {
        const client = await MongoClient.connect("mongodb://localhost:27017/flink-test-db");
        db = client.db();
        collection = db.collection("test-coll");

        repo = new Repo("test-coll", db);
    });

    it("should get document by id", async () => {
        const { insertedId } = await collection.insertOne({ name: "foo" });

        const doc = await repo.getById(insertedId + "");

        expect(doc).toBeDefined();
        expect(doc?.name).toBe("foo");
    });

    it("should get document by id using ObjectId", async () => {
        const { insertedId } = await collection.insertOne({ name: "foo" });

        const doc = await repo.getById(insertedId);

        expect(doc).toBeDefined();
        expect(doc?.name).toBe("foo");
    });

    it("should create and delete document", async () => {
        const createdDoc = await repo.create<{ name: string }>({ name: "bar" });

        expect(createdDoc).toBeDefined();
        expect(createdDoc?._id).toBeDefined();
        expect(createdDoc?.name).toBe("bar");

        const delCount = await repo.deleteById(createdDoc._id);

        expect(delCount).toBe(1);
    });

    it("should update document", async () => {
        const createdDoc = await repo.create({ name: "bar" });

        const updatedDoc = await repo.updateOne(createdDoc._id + "", {
            name: "foo",
        });

        expect(updatedDoc).toBeDefined();
        expect(updatedDoc?.name).toBe("foo");
    });
});

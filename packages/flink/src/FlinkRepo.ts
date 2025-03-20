import { Collection, Db, Document, InsertOneResult, ObjectId } from "mongodb";
import { FlinkContext } from "./FlinkContext";

/**
 * Partial model to have intellisense for partial updates but
 * also allow any other properties to be set such as nested objects etc.
 */
type PartialModel<Model> = Partial<Model> & { [x: string]: any };

export abstract class FlinkRepo<C extends FlinkContext, Model extends Document> {
    collection: Collection;

    private _ctx?: C;

    set ctx(ctx: FlinkContext) {
        this._ctx = ctx as C;
    }

    get ctx() {
        if (!this._ctx) throw new Error("Missing FlinkContext");
        return this._ctx;
    }

    constructor(private collectionName: string, private db: Db) {
        this.collection = db.collection(this.collectionName);
    }

    async findAll(query = {}): Promise<Model[]> {
        const res = await this.collection.find<Model>(query).toArray();
        return res.map(this.objectIdToString) as Model[];
    }

    async getById(id: string | ObjectId) {
        const res = await this.collection.findOne<Model>({ _id: this.buildId(id) });
        if (res) {
            return this.objectIdToString(res) as Model;
        }
        return null;
    }

    async getOne(query = {}) {
        const res = await this.collection.findOne<Model>(query);
        if (res) {
            return this.objectIdToString(res) as Model;
        }
        return null;
    }

    async create<C = Omit<Model, "_id">>(model: C): Promise<C & { _id: string }> {
        const result: InsertOneResult<Model> = await this.collection.insertOne(model as any);
        return { ...model, _id: result.insertedId.toString() };
    }

    async updateOne(id: string | ObjectId, model: PartialModel<Model>): Promise<Model | null> {
        const oid = this.buildId(id);

        await this.collection.updateOne({ _id: oid }, { $set: model });

        const res = await this.collection.findOne<Model>({ _id: oid });

        if (res) {
            return this.objectIdToString(res) as Model;
        }
        return null;
    }

    async updateMany<U = PartialModel<Model>>(query: any, model: U): Promise<number> {
        const { modifiedCount } = await this.collection.updateMany(query, {
            $set: model as any,
        });
        return modifiedCount;
    }

    async deleteById(id: string | ObjectId): Promise<number> {
        const { deletedCount } = await this.collection.deleteOne({
            _id: this.buildId(id),
        });
        return deletedCount || 0;
    }

    private buildId(id: string | ObjectId) {
        let oid: ObjectId | string;

        if (typeof id === "string") {
            oid = new ObjectId(id);
        } else if (id instanceof ObjectId) {
            oid = id;
        } else {
            throw new Error("Invalid id type");
        }

        return oid;
    }

    private objectIdToString<T>(doc: T & { _id?: any }) {
        if (doc && doc._id) {
            doc._id = doc._id.toString();
        }
        return doc;
    }
}

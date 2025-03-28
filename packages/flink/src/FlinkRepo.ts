import { Collection, Db, ObjectId } from "mongodb";
import { FlinkContext } from "./FlinkContext";

export abstract class FlinkRepo<C extends FlinkContext, Model = any> {
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
        return this.collection.find(query).toArray();
    }

    async getById(id: string): Promise<Model | null> {
        return this.collection.findOne({ _id: this.buildId(id) });
    }

    async getOne(query = {}): Promise<Model | null> {
        return this.collection.findOne(query);
    }

    async create<C = Omit<Model, "_id">>(model: C): Promise<C & { _id: string }> {
        const { ops } = await this.collection.insertOne(model);
        return ops[0];
    }

    async updateOne<U = Partial<Model>>(id: string, model: U): Promise<Model> {
        const oid = this.buildId(id);

        await this.collection.updateOne(
            {
                _id: oid,
            },
            {
                $set: model,
            }
        );
        return this.collection.findOne({ _id: oid });
    }

    async updateMany<U = Partial<Model>>(query: any, model: U): Promise<number> {
        const { modifiedCount } = await this.collection.updateMany(query, {
            $set: model,
        });
        return modifiedCount;
    }

    async deleteById(id: string): Promise<number> {
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
}

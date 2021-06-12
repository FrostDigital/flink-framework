import { Collection, Db } from "mongodb";
import { FlinkContext } from "./FlinkContext";

export abstract class FlinkRepo<C extends FlinkContext, Model = any> {
    collection: Collection;

    private _ctx?: C;

    set ctx(ctx: FlinkContext) {
        this._ctx = ctx as C;
    }

    get ctx() {
        if (!this._ctx)
            throw new Error("Missing FlinkContext");
        return this._ctx;
    }

    constructor(private collectionName: string, private db: Db) {
        this.collection = db.collection(this.collectionName);
    }

    async findAll(query = {}): Promise<Model[]> {
        return this.collection.find(query).toArray();
    }

    async getBydId(id: string): Promise<Model | null> {
        return this.collection.findOne({ _id: id });
    }

    async create(model: Omit<Model, "_id">): Promise<Model> {
        const { ops } = await this.collection.insertOne(model);
        return ops[0];
    }

    async deleteById(id: string): Promise<number> {
        const { deletedCount } = await this.collection.deleteOne({ _id: id });
        return deletedCount || 0;
    }
}


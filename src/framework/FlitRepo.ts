import { Collection, Db } from "mongodb";
import FlitContext from "./FlitContext";

abstract class FlitRepo<C extends FlitContext, Model = any> {
    collection: Collection;

    private _ctx?: C;

    set ctx(ctx: FlitContext) {
        this._ctx = ctx as C;
    }

    get ctx() {
        if (!this._ctx)
            throw new Error("Missing FlitContext");
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

export default FlitRepo;


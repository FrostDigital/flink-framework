import { FlinkRepo, log } from "@flink-app/flink";
import BankIdSession from "../schemas/BankIdSession";

class BankIdSessionRepo extends FlinkRepo<any, BankIdSession> {
    async getSession(orderRef: string, type?: "auth" | "sign") {
        if (type) {
            return this.getOne({ orderRef, type });
        }

        return this.getOne({ orderRef });
    }

    async createSession(session: BankIdSession) {
        return await this.create(session);
    }

    async updateSession(orderRef: string, updateData: Partial<BankIdSession> & any) {
        await this.collection.updateOne({ orderRef }, { $set: { ...updateData, updatedAt: new Date() } });
        return this.getOne({ orderRef });
    }

    async completeSession(orderRef: string, userData: Pick<BankIdSession, "user" | "device" | "hintCode">) {
        await this.collection.updateOne({ orderRef }, { $set: { status: "complete", completedAt: new Date(), ...userData } });
        return this.getOne({ orderRef });
    }

    async failSession(orderRef: string, errorCode?: string, hintCode?: string) {
        await this.collection.updateOne({ orderRef }, { $set: { status: "failed", completedAt: new Date(), errorCode, hintCode } });
        return this.getOne({ orderRef });
    }

    async cancelSession(orderRef: string) {
        await this.collection.updateOne({ orderRef }, { $set: { status: "cancelled", completedAt: new Date() } });
        return this.getOne({ orderRef });
    }

    async ensureExpiringIndex(ttlSec: number) {
        try {
            await this.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: ttlSec });
        } catch (err) {
            log.error("Error creating expiring index for BankID sessions:", err);
        }
    }
}

export default BankIdSessionRepo;

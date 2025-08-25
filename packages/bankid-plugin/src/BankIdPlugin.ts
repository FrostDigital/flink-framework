import { FlinkApp, FlinkPlugin, log } from "@flink-app/flink";
import { BankIdClientV6 } from "bankid";
import { BankIdPluginOptions } from "./BankIdPluginOptions";
import BankIdSessionRepo from "./repos/BankIdSessionRepo";
import * as GetBankidAuth from "./handlers/GetBankIdAuth";
import * as PostBankidAuth from "./handlers/PostBankIdAuth";
import * as GetBankidSign from "./handlers/GetBankIdSign";
import * as DeleteBankidSession from "./handlers/DeleteBankIdSession";
import { BankIdPluginContext } from "./BankIdPluginContext";
import { auth } from "./functions/auth";
import { sign } from "./functions/sign";
import { getAuthStatus } from "./functions/getAuthStatus";
import { getSignStatus } from "./functions/getSignStatus";
import { cancelSession } from "./functions/cancelSession";

export function bankIdPlugin(options: BankIdPluginOptions): FlinkPlugin {
    if (!options.pfxBase64) {
        throw new Error("BankID Plugin: pfxBase64 is required");
    }

    if (!options.passphrase) {
        throw new Error("BankID Plugin: passphrase is required");
    }

    const bankIdClient = new BankIdClientV6({
        production: options.production || false,
        pfx: Buffer.from(options.pfxBase64, "base64"),
        passphrase: options.passphrase,
    });

    let flinkApp: FlinkApp<any>;

    async function init(app: FlinkApp<any>) {
        log.info("Initializing BankID Plugin...");

        flinkApp = app;

        try {
            if (!app.db) {
                throw new Error("BankID Plugin: Database connection is required");
            }

            const repo = new BankIdSessionRepo(options.bankIdSessionsCollectionName || "bankid_sessions", app.db);

            app.addRepo("bankIdSessionRepo", repo);

            // Only register handlers if registerRoutes is enabled (default: true)
            if (options.registerRoutes !== false) {
                app.addHandler(GetBankidAuth);
                app.addHandler(PostBankidAuth);
                app.addHandler(GetBankidSign);
                app.addHandler(DeleteBankidSession);
            }

            repo.ensureExpiringIndex(options.keepSessionsSec || 86400 /* 24 hours */);

            log.info(`BankID Plugin initialized in ${options.production ? "production" : "test"} mode`);
        } catch (error) {
            log.error("Failed to initialize BankID Plugin:", error);
            throw error;
        }
    }

    const pluginCtx: BankIdPluginContext["bankId"] = {
        bankIdClient,
        options,
        auth: (authOptions) => auth(flinkApp.ctx as any, authOptions),
        sign: (signOptions) => sign(flinkApp.ctx as any, signOptions),
        getAuthStatus: (statusOptions) => getAuthStatus(flinkApp.ctx as any, statusOptions),
        getSignStatus: (statusOptions) => getSignStatus(flinkApp.ctx as any, statusOptions),
        cancelSession: (cancelOptions) => cancelSession(flinkApp.ctx as any, cancelOptions),
    };

    return {
        id: "bankId",
        db: {
            useHostDb: true,
        },
        ctx: pluginCtx,
        init,
    };
}

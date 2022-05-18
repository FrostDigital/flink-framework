import { FlinkPlugin, log } from "@flink-app/flink";
import { AuthRequest, BankIdClient, CollectResponse } from "bankid";

export enum BankIdStatus {
    /**
     * The sign or auth was successful.
     */
    complete = "complete",

    /**
     * The sign or auth failed, i.e. the user entered wrong PIN code.
     */
    failed = "failed",

    /**
     * Something unforeseen went wrong.
     */
    error = "error",
}

export interface BankIdPluginOptions {
    /**
     * Id of plugin, will be set to bankid-plugin if not provided.
     */
    id?: string;

    /**
     * Base64 encoded string of BankID PFX.
     */
    pfx: string;

    /**
     * The PFX passphrase.
     */
    passphrase: string;

    /**
     * If to use production BankID or their test sandbox
     */
    production: boolean;
}

interface BankIdSession<T> {
    /**
     * Cancels the sign or auth operation
     */
    cancel: () => Promise<any>;

    /**
     * The order ref of the sign or auth operation.
     */
    orderRef: string;

    /**
     * Collects the result of sign or auth operation
     */
    collect: () => Promise<T>;
}

export interface BankIdSignOptions {
    /**
     * Personal number on format YYYYMMDDNNNN or YYYYMMDD-NNNN
     */
    personalNumber: string;

    /**
     * End users IP, is passed on to BankID
     */
    endUserIp: string;

    /**
     * Text shown during the sign process in the BankID app.
     * Simple markdown is supported.
     */
    text: string;
}

export interface BankIdSignResult {
    /**
     * If sign was successful
     */
    success: boolean;

    /**
     * Status of the sign.
     */
    status: BankIdStatus;

    /**
     * Includes more details about the user. Only present in case of success.
     * This is where you would the users name etc.
     */
    completionData?: CollectResponse["completionData"];
}

export interface BankIdAuthOptions {
    /**
     * Personal number on format YYYYMMDDNNNN or YYYYMMDD-NNNN
     */
    personalNumber: string;

    /**
     * End users IP, is passed on to BankID
     */
    endUserIp: string;

    /**
     * Requirements of the auth.
     */
    requirement?: AuthRequest["requirement"];
}

export interface BankIdAuthResult {}

export interface BankIdPlugin extends FlinkPlugin {
    sign: (signOptions: BankIdSignOptions) => Promise<BankIdSession<BankIdSignResult>>;
    authenticate: (authOptions: BankIdAuthOptions) => Promise<BankIdSession<BankIdAuthResult>>;
}

export function bankIdPlugin(opts: BankIdPluginOptions): BankIdPlugin {
    return {
        id: opts.id || "bankid-plugin",
        sign: (signOptions) => sign(signOptions, opts),
        authenticate: (authOptions) => auth(authOptions, opts),
    };
}

async function sign(signOptions: BankIdSignOptions, pluginOptions: BankIdPluginOptions): Promise<BankIdSession<BankIdSignResult>> {
    const client = getBankIdClient(pluginOptions);

    const signRes = await client.sign({
        endUserIp: signOptions.endUserIp,
        personalNumber: alignAndValidatePersonalNumber(signOptions.personalNumber),
        userVisibleData: signOptions.text,
    });

    log.debug("[BankID]", `Got sign order ref ${signRes.orderRef}`);

    const collectPromise: Promise<BankIdSignResult> = collect(client, signRes.orderRef).then((res) => ({
        success: res.status === BankIdStatus.complete,
        orderRef: signRes.orderRef,
        status: res.status,
        completionData: res.collectResponse?.completionData,
    }));

    return {
        orderRef: signRes.orderRef,
        cancel: () =>
            client.cancel({
                orderRef: signRes.orderRef,
            }),
        collect: () => collectPromise,
    };
}

async function auth(authOptions: BankIdAuthOptions, pluginOptions: BankIdPluginOptions): Promise<BankIdSession<BankIdAuthResult>> {
    const client = getBankIdClient(pluginOptions);

    const authRes = await client.authenticate({
        personalNumber: authOptions.personalNumber,
        endUserIp: authOptions.endUserIp,
        requirement: authOptions.requirement,
    });

    log.debug("[BankID]", `Got auth order ref ${authRes.orderRef}`);

    const collectPromise: Promise<BankIdAuthResult> = collect(client, authRes.orderRef).then((res) => ({
        success: res.status === BankIdStatus.complete,
        orderRef: authRes.orderRef,
        status: res.status,
        completionData: res.collectResponse?.completionData,
    }));

    return {
        orderRef: authRes.orderRef,
        cancel: () => client.cancel({ orderRef: authRes.orderRef }),
        collect: () => collectPromise,
    };
}

let bankIdClient: BankIdClient;

function getBankIdClient(pluginOptions: BankIdPluginOptions) {
    if (!bankIdClient) {
        const pfx = Buffer.from(pluginOptions.pfx, "base64");

        bankIdClient = new BankIdClient({
            production: pluginOptions.production,
            passphrase: pluginOptions.passphrase,
            pfx,
        });
    }
    return bankIdClient;
}

function alignAndValidatePersonalNumber(personalNumber: string) {
    const alignedPersonalNumber = personalNumber.trim().replace("-", "");

    // Note: Don't be to though validating as Skatteverket might use weird formats
    // for like Samordningsnummer and such (?)
    if (alignedPersonalNumber.length !== 12) {
        throw new Error("Invalid personal number: " + personalNumber);
    }

    return alignedPersonalNumber;
}

async function collect(client: BankIdClient, orderRef: string) {
    return new Promise<{ status: BankIdStatus; collectResponse: CollectResponse | null }>((resolve) => {
        const timer = setInterval(() => {
            const done = () => clearInterval(timer);

            client
                .collect({ orderRef })
                .then((res) => {
                    if (res.status === "complete" || res.status === "failed") {
                        done();
                        resolve({ status: res.status as BankIdStatus, collectResponse: res });
                    } else {
                        log.debug("[BankId]", "Collect status pending");
                    }
                })
                .catch((err) => {
                    log.error("[BankId]", `Collect failed for order ref ${orderRef} with error`, err);
                    done();
                    resolve({
                        status: BankIdStatus.error,
                        collectResponse: null,
                    });
                });
        }, 1000);
    });
}

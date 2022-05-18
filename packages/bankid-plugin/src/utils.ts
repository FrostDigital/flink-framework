import { BankIdClient, SignResponse, CollectResponse } from "bankid";
import config from "../config";

export async function sign(options: { endUserIp: string; text: string; pno?: string; callback: (res: CollectResponse) => void }): Promise<SignResponse> {
    let pfx: Buffer | undefined;

    if (config.bankid.clientConfig.pfx) {
        pfx = Buffer.from(config.bankid.clientConfig.pfx, "base64");
    }

    const client = new BankIdClient({ ...config.bankid.clientConfig, pfx });
    const { endUserIp, text, pno } = options;

    const res = await client.sign({
        endUserIp,
        personalNumber: pno,
        userVisibleData: text,
    });

    const timer = setInterval(() => {
        const done = () => clearInterval(timer);

        client
            .collect({ orderRef: res.orderRef })
            .then((res) => {
                if (res.status === "complete") {
                    done();
                    options.callback(res);
                } else if (res.status === "failed") {
                    done();
                    options.callback(res);
                }
            })
            .catch((err) => {
                console.error(err);
                done();
            });
    }, 1000);

    return res;
}

export async function getStatus(options: { orderRef: string }): Promise<"pending" | "failed" | "complete"> {
    const client = new BankIdClient(config.bankid.clientConfig);
    const response = await client.collect({ orderRef: options.orderRef });
    return response.status;
}

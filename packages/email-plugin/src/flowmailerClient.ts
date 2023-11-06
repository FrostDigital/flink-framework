import { emailFlowmailer as email } from "./schemas/emailFlowmailer";
import { client } from "./schemas/client";
import axios from "axios";
import querystring from "querystring";

export interface flowmailerClientOptions {
    client_id: string;
    client_secrect: string;
    account_id: string;
}

type SubmitMessage = {
    messageType: "EMAIL";
    senderAddress: string;
    recipientAddress: string;
    subject: string;
    text?: string;
    html?: string;
    attachments? : {
        content : string;
        contentType : string;
        disposition : "attachment",
        filename : string;
    }[]
};

export class flowMailerClient implements client {
    accessToken: string;
    client_id: string;
    client_secrect: string;
    account_id: string;

    constructor(options: flowmailerClientOptions) {
        this.accessToken = "";
        this.client_id = options.client_id;
        this.client_secrect = options.client_secrect;
        this.account_id = options.account_id;
    }

    async getToken() {
        try {
            const resp = await axios.post(
                "https://login.flowmailer.net/oauth/token",
                querystring.stringify({
                    client_id: this.client_id,
                    client_secret: this.client_secrect,
                    grant_type: "client_credentials",
                    scope: "api",
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );
            if (resp.status == 200) {
                this.accessToken = resp.data.access_token;
            }
        } catch (ex) {}
    }
    async sendEmail(email: email, to: string): Promise<boolean> {
        let data : SubmitMessage = {
            messageType: "EMAIL",
            senderAddress: email.from,
            recipientAddress: to,
            subject: email.subject,
            text: email.text,
            html: email.html,
        };
        if(email.attachments) {
            data = { ...data, attachments : email.attachments.map(a=>( {...a, disposition : "attachment"}) )}
        }
        try {
            const resp = await axios.post(`https://api.flowmailer.net/${this.account_id}/messages/submit`, data, {
                headers: {
                    Accept: "application/vnd.flowmailer.v1.12+json",
                    "Content-Type": "application/vnd.flowmailer.v1.12+json;charset=UTF-8",
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });
            if (resp.status == 201) return true;
        } catch (ex) {
            if ((ex as any)?.response?.data?.error != "invalid_token") {
         
            }
        }
        return false;
    }
    async send(email: email) {
        let failure = false;
        for (const i in email.to) {
            if (!this.client_secrect) {
                this.getToken();
            }
            let success = await this.sendEmail(email, email.to[i]);
            if (!success) {
                await this.getToken();
            } else {
                continue;
            }
            success = await this.sendEmail(email, email.to[i]);
            if (!success) failure = true;
        }
        return !failure;
    }
}

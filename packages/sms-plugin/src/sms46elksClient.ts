import { sms } from "./schemas/sms";
import { client } from "./schemas/client";
import axios from "axios";
import { URLSearchParams } from "url";

export interface sms46elksClientOptions {
    username: string;
    password: string;
}

export class sms46elksClient implements client {
    username: string;
    password: string;
    constructor(options: sms46elksClientOptions) {
        this.username = options.username;
        this.password = options.password;
    }
    async sendSMS(sms: sms) {
        const authKey = Buffer.from(this.username + ":" + this.password).toString("base64");

        for (let t in sms.to) {
            const to = sms.to[t];

            // Set the SMS endpoint
            const url = "https://api.46elks.com/a1/sms";

            // Request data object
            var data = {
                ...sms,
                to,
            };

            const postData = new URLSearchParams(data).toString();

            // Set the headers
            const config = {
                headers: {
                    Authorization: "Basic " + authKey,
                },
            };

            // Send request
            const res = await axios.post(url, postData, config);
        }
    }

    async send(sms: sms) {
        try {
            await this.sendSMS(sms);
        } catch (ex) {
            console.log(JSON.stringify(ex));
            return false;
        }
        return true;
    }
}

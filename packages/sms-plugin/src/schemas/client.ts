import { sms } from "./sms";

export interface client {
    send(sms: sms): Promise<boolean>;
}

import { Readable } from "stream";
import { Url } from "url";

export interface sms {
    from: string;

    to: string[];

    message: string;
}

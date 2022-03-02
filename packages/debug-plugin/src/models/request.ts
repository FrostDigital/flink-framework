import { HttpMethod } from "@flink-app/flink";
import { IncomingHttpHeaders } from "http";

export default interface request {
    start: Date;
    end?: Date;
    method: string;
    path: string;
    headers?: IncomingHttpHeaders;
    body?: any;
    response?: string;
}

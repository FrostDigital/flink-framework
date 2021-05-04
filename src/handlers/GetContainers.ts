import { Request } from "express";
import HttpHandler, { HttpVerbs } from "../flit/HttpHandler";


class GetContainers implements HttpHandler {
    method = HttpVerbs.get;
    path = "/";

    async handleHttp(_req: Request) {
        return {
            reqId: "1",
            status: 200,
            data: {
                msg: "Hello world"
            }
        }
    }
}


export default GetContainers;
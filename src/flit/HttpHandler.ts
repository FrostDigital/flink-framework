import { Request } from 'express';
import FlitResponse from './FlitResponse';

export enum HttpVerbs {
    get = "get",
    post = "post",
    put = "put",
    delete = "delete"
};

interface HandleHttp<ReqBody = any, ResBody = any> {
    method: HttpVerbs;
    path: string;
    handleHttp: (req: Request) => Promise<FlitResponse>;
}


export default HandleHttp;


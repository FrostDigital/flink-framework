import { Request } from 'express';
import FlitContext from './FlitContext';
import FlitResponse from './FlitResponse';

export enum HttpMethod {
    get = "get",
    post = "post",
    put = "put",
    delete = "delete"
};

type Params = Request["params"];
type Query = Request["query"];

export type FlitRequest<T = any, P = Params, Q = Query> = Request<P, any, T, Q>

/**
 * Route props decides routing.
 * 
 * Each handler should declare RouteProps which will
 * instruct express which traffic to route.
 */
export interface RouteProps<S = any> {
    method?: HttpMethod;
    path: string;
    reqSchema?: S;
    resSchema?: S;
}

export type FlitSchema = "none";

/**
 * Http handler function that handlers implements in order to
 * handle HTTP requests and return a JSON response.
 */
export type HandlerFn<Ctx extends FlitContext, ReqSchema = any, ResSchema = any, P = Params, Q = Query> = (props: { req: FlitRequest<ReqSchema, P, Q>, ctx: Ctx }) => Promise<FlitResponse<ResSchema>>;


/**
 * Http handler function specifically for GET requests as those does 
 * not normally have a request body.
 * 
 * Just syntactic sugar on top op `HandlerFn`
 */
export type GetHandlerFn<Ctx extends FlitContext, ResSchema = any, P = Params, Q = Query> = HandlerFn<Ctx, any, ResSchema, P, Q>;


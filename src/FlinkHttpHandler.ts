import { Request } from "express";
import { FlinkContext } from "./FlinkContext";
import { FlinkResponse } from "./FlinkResponse";

export enum HttpMethod {
    get = "get",
    post = "post",
    put = "put",
    delete = "delete",
}

type Params = Request["params"];
type Query = Request["query"];

export type FlinkRequest<T = any, P = Params, Q = Query> = Request<
    P,
    any,
    T,
    Q
>;

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

/**
 * Http handler function that handlers implements in order to
 * handle HTTP requests and return a JSON response.
 */
export type Handler<
    Ctx extends FlinkContext,
    ReqSchema = any,
    ResSchema = any,
    P = Params,
    Q = Query
    > = (props: {
        req: FlinkRequest<ReqSchema, P, Q>;
        ctx: Ctx;
    }) => Promise<FlinkResponse<ResSchema>>;

/**
 * Http handler function specifically for GET requests as those does
 * not normally have a request body.
 *
 * Just syntactic sugar on top op `HandlerFn`
 */
export type GetHandler<
    Ctx extends FlinkContext,
    ResSchema = any,
    P = Params,
    Q = Query
    > = Handler<Ctx, any, ResSchema, P, Q>;

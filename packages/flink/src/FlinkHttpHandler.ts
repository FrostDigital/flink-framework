import { Request } from "express";
import { JSONSchema } from "./FlinkApp";
import { FlinkContext } from "./FlinkContext";
import { FlinkError } from "./FlinkErrors";
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
> & { reqId: string; user?: any };

/**
 * Route props to control routing.
 *
 * Each handler needs to declare RouteProps which
 * instructs express web server how to route traffic.
 */
export interface RouteProps {
  /**
   * HTTP method which this handlers responds to.
   *
   * Will if not set attempt to extract HTTP method based
   * on handler file name prefix, for example `GetFoo.ts` will assume
   * HTTP method `GET`.
   */
  method?: HttpMethod;

  /**
   * Route path including any path params.
   * Example: `/user/:id`
   */
  path: string;

  /**
   * Generates mock response based on handlers response schema.
   *
   * Will be ignored if handler does not have any response schema defined.
   *
   * This should only be used during development 💥
   */
  mockApi?: boolean;

  /**
   * Set permissions needed to access route if route requires authentication.
   */
  permissions?: string | string[];

  /**
   * Optional documentation of endpoint. Can be used for example in API docs.
   * Supports markdown strings.
   */
  docs?: string; // TODO

  /**
   * If handler should not be auto registered
   */
  skipAutoRegister?: boolean;

  /**
   * I.e. filename or plugin name that describes where handler origins from
   */
  origin?: string;
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
  origin?: string;
}) => Promise<FlinkResponse<ResSchema | FlinkError>>;

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

/**
 * Type for Handler file. Describes shape of exports when using
 * syntax like:
 *
 * `import * as FooHandler from "./src/handlers/FooHandler"
 */
export type HandlerFile = {
  default: Handler<any>;
  Route?: RouteProps;
  /**
   * Name of schemas, is set at compile time by Flink compiler.
   */
  __schemas?: {
    reqSchema?: JSONSchema;
    resSchema?: JSONSchema;
  };
  /**
   * Typescript source file name, is set at compile time by Flink compiler.
   */
  __file?: string;

  /**
   * Description of query params, is set at compile time by Flink compiler.
   */
  __query?: {
    name: string;
    description: string;
  }[];

  /**
   * Description of path params, is set at compile time by Flink compiler.
   */
  __params?: {
    name: string;
    description: string;
  }[];
};

import { Response, Request } from "express";

export interface FlinkResponse<T = any> {
  /**
   * Unique id of request.
   * Used to track request in logs.
   */
  reqId?: string;

  /**
   * HTTP status code, default to 200.
   */
  status?: number;

  /**
   * Optional redirect. Will trigger a redirect of provided type.
   */
  redirect?: {
    to: string;
    type?: "TEMPORARY" | "PERMANENT";
  };

  /**
   * Actual payload to return.
   */
  data?: T;

  /**
   * Error object set if error response.
   * If set the `status` is set to 4xx or 5xx code.
   */
  error?: {
    id: string;
    title: string;
    detail?: string;
    code?: string;
  };

  /**
   * HTTP headers, names are lower cased
   */
  headers?: {
    [x: string]: string;
  };
}

export type ExpressResponse = Response;
export type ExpressRequest = Request;

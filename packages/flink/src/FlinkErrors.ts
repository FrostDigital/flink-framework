import { v4 } from "uuid";
import { FlinkResponse } from "./FlinkResponse";

// A marker for FlinkError, but all it means is that data is undefined
export type FlinkError = undefined;

export function notFound(detail?: string, code?: string ): FlinkResponse<FlinkError> {
  return {
    status: 404,
    error: {
      id: v4(),
      title: "Not Found",
      detail: detail || "The requested resource does not exist",
      code : code || "notFound"
    },
  };
}

export function conflict(detail?: string, code?: string ): FlinkResponse<FlinkError> {
  return {
    status: 409,
    error: {
      id: v4(),
      title: "Conflict",
      detail: detail || "An identical entity exits",
      code : code || "conflict"
    },
  };
}



export function badRequest(detail?: string, code?: string): FlinkResponse<FlinkError> {
  return {
    status: 400,
    error: {
      id: v4(),
      title: "Bad Request",
      detail: detail || "Invalid request",
      code : code || "badRequest"
    },
  };
}

export function unauthorized(detail?: string, code?: string): FlinkResponse<FlinkError> {
  return {
    status: 401,
    error: {
      id: v4(),
      title: "Unauthorized",
      detail:
        detail || "User not logged in or or not allowed to access resource",
      code : code || "badRequest"
    },
  };
}

export function internalServerError(
  detail?: string,
  code?: string
): FlinkResponse<FlinkError> {
  return {
    status: 500,
    error: {
      id: v4(),
      title: "Internal Server Error",
      detail: detail || "Something unexpected went wrong",
      code : code || "internalServerError"
    },
  };
}

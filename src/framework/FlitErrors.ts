import { v4 } from "uuid";
import FlitResponse from "./FlitResponse";

export function notFound(detail?: string): FlitResponse {
    return {
        status: 404,
        error: {
            id: v4(),
            title: "Not Found",
            detail: detail || "The requested resource does not exist"
        }
    }
}

export function internalServerError(detail?: string): FlitResponse {
    return {
        status: 500,
        error: {
            id: v4(),
            title: "Internal Server Error",
            detail: detail || "Something unexpected went wrong"
        }
    }
}

import { Request } from "express";
import FlitResponse from "./FlitResponse";
import { HttpMethod } from "./HttpHandler";

export function isRouteMatch(req: Request, routes: { method: HttpMethod, path: string }[]) {
    const match = routes.find(({ method, path }) => {
        const sameMethod = req.method.toLowerCase() === method;
        const samePath = req.route.path === path;
        return sameMethod && samePath;
    });

    return !!match;
}

export function isError(message: FlitResponse) {
    return message.status && message.status > 399;
}
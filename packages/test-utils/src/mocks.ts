import { FlinkAuthPlugin, FlinkRequest } from "@flink-app/flink";

interface TestFlinkRequest<T, P, Q> extends Omit<Partial<FlinkRequest<T, P, Q>>, "body" | "params" | "query"> {
    body?: T;
    params?: P;
    query?: Q;
}

/**
 * Creates a mocked FlinkRequest object where only essential properties are required.
 * Will convert req body to JSON to ensure the body is a plain object.
 * @param req
 * @returns
 */
export function mockReq<T, P, Q>(req?: TestFlinkRequest<T, P, Q>): FlinkRequest<T, P, Q> {
    const aMockReq = {
        get: (headerName: string) => req?.headers?.[headerName],
        ...(req || {}),
    };

    if (!req) {
        return aMockReq as any;
    }

    req.body = req.body ? JSON.parse(JSON.stringify(req.body)) : undefined;

    req.query = req.query || ({} as Q);

    req.params = req.params ? JSON.parse(JSON.stringify(req.params)) : {};

    return aMockReq as any;
}

/**
 * Auth plugin used for testing handlers.
 * Will allow all requests.
 * @returns
 */
export function noOpAuthPlugin(): FlinkAuthPlugin {
    return {
        authenticateRequest: async () => true,
        createToken: async () => "mock-token",
    };
}

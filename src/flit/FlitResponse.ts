interface FlitResponse<T = any> {
    /**
     * Unique id of request.
     * Used to track request in logs.
     */
    reqId: string; // TODO: Is this needed

    /**
     * HTTP status code, default to 200.
     */
    status?: number;

    /**
     * Optional redirect. Will trigger a redirect of provided type.     
     */
    redirect?: {
        to: string;
        type?: "TEMPORARY" | "PERMANENT"
    },

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
        detail: string;
        message?: string;
    }
}


export default FlitResponse;


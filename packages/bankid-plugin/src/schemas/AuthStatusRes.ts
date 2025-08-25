export default interface AuthStatusRes {
    status: "pending" | "complete" | "failed" | "cancelled";
    orderRef: string;
    /**
     * Access token is set when auth is successful
     */
    token?: string;
    /**
     * User information is set when auth is successful
     */
    user?: any;
    hintCode?: string;
    errorCode?: string;
    qr?: string;
}

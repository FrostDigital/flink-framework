export default interface AuthInitiateReq {
    /**
     * The end users IP is required by BankID to prevent abuse.
     */
    endUserIp: string;
}

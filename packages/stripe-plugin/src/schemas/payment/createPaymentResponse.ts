export interface createPaymentResponse {
    paymentIntentId: string;
    token: string;
    paymentUrl?: string;
}

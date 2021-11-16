export interface confirmPaymentResponse {
    paymentIntentId: string;
    confirmed: boolean;
    captured: boolean;
    token?: string;
    redirectUrl?: string;
}

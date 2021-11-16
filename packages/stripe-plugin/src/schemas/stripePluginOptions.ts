export interface stripePluginOptions {
    baseUrl?: string;
    stripeSecreteKey: string;
    stripePublishableKey: string;
    JTW_TOKEN: string;
    callbacks: { [key: string]: any };

    logo?: string;
    redirectUrl?: string;
    phrases?: {
        setupDescription?: string;
        setupButtonText?: string;
        setupDoneMessage: string;
        paymentSelectCardPayButtonText?: string;
        paymentSelectCardChangeCardButtonText?: string;
    };

    callBackTest?(): void;
}

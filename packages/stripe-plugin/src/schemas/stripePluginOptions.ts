export interface stripePluginOptions {
    baseUrl?: string;
    stripeSecreteKey: string;
    stripePublishableKey: string;
    JTW_TOKEN: string;

    logo?: string;
    redirectUrl?: string;
    stripeConnectClientID?: string;
    phrases?: {
        setupDescription?: string;
        setupButtonText?: string;
        setupDoneMessage: string;
        paymentSelectCardPayButtonText?: string;
        paymentSelectCardChangeCardButtonText?: string;
        paymentDoneMessage?: string;
        paymentEnterCardPayButtonText?: string;
        connectDoneMessage: string;
    };
    templates?: {
        master?: string;
        style?: string;
        setupCard?: string;
        setupDone?: string;
        error?: string;
        paySelectCard?: string;
        payEnterCard?: string;
        connectDone?: string;
    };

    paymentCallback?(paymentIntentId: string, status: string): void;
    stripeConnectCallback?(userId: string, stripeConnectUserId: string): void;
}

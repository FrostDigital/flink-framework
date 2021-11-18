import { Stripe } from "stripe";
import { createStripeCustomer, hasPaymentMethod, setupCardRegistration } from "./lib/customer";
import { hasPaymentMethodOptions } from "./schemas/customer/hasPaymentMethodOptions";
import { setupCardOptions } from "./schemas/customer/setupCardOptions";
import { setupCardResponse } from "./schemas/customer/setupCardResponse";
import { stripePluginOptions } from "./schemas/stripePluginOptions";
import { confirmPayment, createPaymentIntent } from "./lib/payment";
import { confirmPaymentOptions } from "./schemas/payment/confirmPaymentOptions";
import { confirmPaymentResponse } from "./schemas/payment/confirmPaymentResponse";
import { createPaymentResponse } from "./schemas/payment/createPaymentResponse";
import ConnectSessionRepo from "./reposx/ConnectSessionRepo";
import { connectToStripeConnectOptions } from "./schemas/customer/connectToStripeConnectOptions";
export class StripeAPI {
    stripe: Stripe;
    pluginOptions: stripePluginOptions;
    repo?: ConnectSessionRepo;
    constructor(options: stripePluginOptions) {
        const stripe = new Stripe(options.stripeSecreteKey, {
            apiVersion: "2020-08-27",
        });

        this.stripe = stripe;
        this.pluginOptions = options;
    }
    config = {
        setRepo: (repo: ConnectSessionRepo): void => {
            this.repo = repo;
        },
    };

    payment = {
        create: async (options: Stripe.PaymentIntentCreateParams): Promise<createPaymentResponse> => {
            let resp = await createPaymentIntent(this.stripe, this.pluginOptions.JTW_TOKEN, options);
            resp.paymentUrl = `${this.pluginOptions.baseUrl || "/stripe"}/payment/confirm/${resp.token}`;
            return resp;
        },
        confirm: async (options: confirmPaymentOptions): Promise<confirmPaymentResponse> => {
            let resp = await confirmPayment(this.stripe, this.pluginOptions.JTW_TOKEN, options);
            if (resp.token != null) {
                resp.redirectUrl = `${this.pluginOptions.baseUrl || "/stripe"}/payment/confirm/${resp.token}`;
            }
            return resp;
        },
        createAndConfirm: async (options: Stripe.PaymentIntentCreateParams): Promise<confirmPaymentResponse> => {
            const createPaymentResponse = await createPaymentIntent(this.stripe, this.pluginOptions.JTW_TOKEN, options);
            let resp = await confirmPayment(this.stripe, this.pluginOptions.JTW_TOKEN, { paymentIntentId: createPaymentResponse.paymentIntentId });
            if (resp.token != null) {
                resp.redirectUrl = `${this.pluginOptions.baseUrl || "/stripe"}/payment/confirm/${resp.token}`;
            }
            return resp;
        },
    };
    customer = {
        create: async (options: Stripe.CustomerCreateParams): Promise<string> => {
            return await createStripeCustomer(this.stripe, options);
        },
        hasPaymentMethod: async (options: hasPaymentMethodOptions): Promise<boolean> => {
            return await hasPaymentMethod(this.stripe, options);
        },
        setupCard: async (options: setupCardOptions): Promise<setupCardResponse> => {
            const token = await setupCardRegistration(this.stripe, this.pluginOptions.JTW_TOKEN, options);
            return {
                token,
                redirectUrl: `${this.pluginOptions.baseUrl || "/stripe"}/customer/setup-card/${token}`,
            };
        },
        connectToStripeConnect: async (options: connectToStripeConnectOptions): Promise<string> => {
            if (this.repo == null) {
                throw "Repo not set, cannot use connectToStripeConnect()";
            }
            const session = await this.repo!.create(options);
            const url = "https://connect.stripe.com/express/oauth/authorize?client_id=" + this.pluginOptions.stripeConnectClientID + "&state=" + session._id;
            return url;
        },
    };
}

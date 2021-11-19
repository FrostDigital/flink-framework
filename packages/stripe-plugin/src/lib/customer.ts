import { createStripeCustomerOptions } from "../schemas/createStripeCustomerOptions";
import { setupCardResponse } from "../schemas/customer/setupCardResponse";
import { setupCardOptions } from "../schemas/customer/setupCardOptions";
import { setupCardTokenOptions } from "../schemas/customer/setupCardTokenOptions";
import { hasPaymentMethodOptions } from "../schemas/customer/hasPaymentMethodOptions";

import { sign } from "jsonwebtoken";
import { stripeAPIToken } from "../schemas/stripeAPIToken";
import { Stripe } from "stripe";

export const createStripeCustomer = async (stripe: Stripe, options: Stripe.CustomerCreateParams): Promise<string> => {
    const resp = await stripe.customers.create(options);
    return resp.id;
};

export const hasPaymentMethod = async (stripe: Stripe, options: hasPaymentMethodOptions): Promise<boolean> => {
    const paymentMethods = await stripe.paymentMethods.list({
        customer: options.stripeCustomerId,
        type: "card",
    });
    return paymentMethods.data.length > 0;
};

export const setupCardRegistration = async (stripe: Stripe, JWT_TOKEN: string, options: setupCardOptions): Promise<string> => {
    //Remove old payment methods if they exists
    const paymentMethods = await stripe.paymentMethods.list({
        customer: options.stripeCustomerId,
        type: "card",
    });

    for (var x in paymentMethods.data) {
        const pi = paymentMethods.data[x];
        await stripe.paymentMethods.detach(pi.id);
    }

    const intent = await stripe.setupIntents.create({
        customer: options.stripeCustomerId,
    });

    const tokenOptions: setupCardTokenOptions = {
        ...options,
        client_secret: intent.client_secret!,
    };
    intent.client_secret;

    const tokenData: stripeAPIToken<setupCardTokenOptions> = {
        type: "setup_card",
        options: tokenOptions,
    };
    const token = sign(tokenData, JWT_TOKEN);
    return token;
};

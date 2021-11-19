import { Stripe } from "stripe";
import { confirmPaymentOptions } from "../schemas/payment/confirmPaymentOptions";
import { confirmPaymentResponse } from "../schemas/payment/confirmPaymentResponse";
import { confirmPaymentTokenOptions } from "../schemas/payment/confirmPaymentTokenOptions";
import { createPaymentResponse } from "../schemas/payment/createPaymentResponse";

import { stripeAPIToken } from "../schemas/stripeAPIToken";
import { sign } from "jsonwebtoken";

export const createPaymentIntent = async (stripe: Stripe, JWT_TOKEN: string, options: Stripe.PaymentIntentCreateParams): Promise<createPaymentResponse> => {
    const paymentIntent = await stripe.paymentIntents.create(options);

    const tokenData: stripeAPIToken<confirmPaymentTokenOptions> = {
        type: "payment",
        options: {
            paymentIntentId: paymentIntent.id,
            client_secret: paymentIntent.client_secret!,
        },
    };
    const token = sign(tokenData, JWT_TOKEN);

    return {
        paymentIntentId: paymentIntent.id,
        token,
    };
};

export const confirmPayment = async (stripe: Stripe, JWT_TOKEN: string, options: confirmPaymentOptions): Promise<confirmPaymentResponse> => {
    const paymentIntent = await stripe.paymentIntents.retrieve(options.paymentIntentId);
    const paymentMethods = await stripe.paymentMethods.list({
        customer: paymentIntent.customer?.toString(),
        type: "card",
    });

    if (paymentMethods.data.length == 0) {
        throw "Payment method is missing";
    }

    const resp = await stripe.paymentIntents.confirm(options.paymentIntentId, {
        payment_method: paymentMethods.data[0].id,
    });
    let captured = false;
    let confirmed = false;
    let token = undefined;
    if (resp.status == "requires_capture" || resp.status == "succeeded") {
        confirmed = true;
        if (resp.status == "succeeded") captured = true;
    } else {
        const tokenData: stripeAPIToken<confirmPaymentTokenOptions> = {
            type: "payment",
            options: {
                paymentIntentId: options.paymentIntentId,
                client_secret: paymentIntent.client_secret!,
            },
        };
        token = sign(tokenData, JWT_TOKEN);
    }
    return {
        paymentIntentId: options.paymentIntentId,
        captured,
        confirmed,
        token,
    };
};

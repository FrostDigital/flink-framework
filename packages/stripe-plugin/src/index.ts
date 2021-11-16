import { FlinkApp, FlinkPlugin, HttpMethod, log, unauthorized } from "@flink-app/flink";
import { Stripe } from "stripe";
import { stripePluginOptions } from "./schemas/stripePluginOptions";
import { StripeAPI } from "./stripeAPI";
import { HandlebarsTemplateHandler } from "./handlers/HandlebarsTemplateHandler";
export * from "./stripePluginContext";

import { masterTemplate } from "./templates/master";
import { setupCardTemplate } from "./templates/setup-card";
import { styleTemplate } from "./templates/style";
import { setupDoneTemplate } from "./templates/setup-done";
import { errorTemplate } from "./templates/error";
import { paySelectCardTemplate } from "./templates/pay-select-card";

import { verify } from "jsonwebtoken";
import { stripeAPIToken } from "./schemas/stripeAPIToken";
import { setupCardTokenOptions } from "./schemas/customer/setupCardTokenOptions";
import { confirmPaymentTokenOptions } from "./schemas/payment/confirmPaymentTokenOptions";
export const stripePlugin = (options: stripePluginOptions): FlinkPlugin => {
    if (options.callBackTest == null) options.callBackTest = () => {};

    const stripe = new Stripe(options.stripeSecreteKey, {
        apiVersion: "2020-08-27",
    });
    const stripeAPI = new StripeAPI(options);

    const templates = {
        master: masterTemplate,
        style: styleTemplate,
        setupCard: setupCardTemplate,
        setupDone: setupDoneTemplate,
        error: errorTemplate,
        paySelectCard: paySelectCardTemplate,
    };
    return {
        id: "stripePlugin",
        init: (app) => init(app, options),
        ctx: {
            callbackTest: options.callBackTest,
            stripeAPI,
            templates,
        },
    };
};

function init(app: FlinkApp<any>, options: stripePluginOptions) {
    if (options.baseUrl == null) options.baseUrl = "/stripe";

    app.expressApp?.get(options.baseUrl + "/customer/setup-card/:token", (req, res) => {
        try {
            const tokenData: stripeAPIToken<setupCardTokenOptions> = verify(req.params.token, options.JTW_TOKEN) as stripeAPIToken<setupCardTokenOptions>;
            if (tokenData.type != "setup_card") {
                throw "Invalid token type";
            }
            HandlebarsTemplateHandler(
                app.ctx.plugins.stripePlugin.templates.master,
                app.ctx.plugins.stripePlugin.templates.style,
                app.ctx.plugins.stripePlugin.templates.setupCard,
                {
                    setupDescription: options.phrases?.setupDescription,
                    logo: options.logo,
                    stripePublishableKey: options.stripePublishableKey,
                    client_secret: tokenData.options.client_secret,
                    baseUrl: options.baseUrl,
                    setupButtonText: options.phrases?.setupButtonText || "Spara",
                },
                res
            );
        } catch (ex) {
            log.error(ex);
            res.redirect(options.baseUrl + "/error");
            return;
        }
    });

    app.expressApp?.get(options.baseUrl + "/customer/setup-card-done/", (req, res) => {
        try {
            HandlebarsTemplateHandler(
                app.ctx.plugins.stripePlugin.templates.master,
                app.ctx.plugins.stripePlugin.templates.style,
                app.ctx.plugins.stripePlugin.templates.setupDone,
                {
                    redirectUrl: options.redirectUrl,
                    message: options.phrases?.setupDoneMessage || "Kortet har sparats.",
                },
                res
            );
        } catch (ex) {
            log.error(ex);
            res.redirect(options.baseUrl + "/error");
            return;
        }
    });

    app.expressApp?.get(options.baseUrl + "/error", (req, res) => {
        try {
            HandlebarsTemplateHandler(
                app.ctx.plugins.stripePlugin.templates.master,
                app.ctx.plugins.stripePlugin.templates.style,
                app.ctx.plugins.stripePlugin.templates.error,
                {},
                res
            );
        } catch (ex) {
            log.error(ex);
            res.redirect(options.baseUrl + "/");
            return;
        }
    });

    app.expressApp?.get(options.baseUrl + "/payment/confirm/:token", async (req, res) => {
        try {
            const tokenData = verify(req.params.token, options.JTW_TOKEN) as stripeAPIToken<confirmPaymentTokenOptions>;
            if (tokenData.type != "payment") {
                throw "Invalid token type";
            }
            const stripe = app.ctx.plugins.stripePlugin.stripeAPI.stripe as Stripe;
            const paymentIntent = await stripe.paymentIntents.retrieve(tokenData.options.paymentIntentId);
            const paymentMethods = await stripe.paymentMethods.list({
                customer: paymentIntent.customer?.toString(),
                type: "card",
            });
            if (paymentMethods.data.length == 0) {
                res.redirect(options.baseUrl + "/payment/enter-card/" + req.params.token);
            } else {
                res.redirect(options.baseUrl + "/payment/select-card/" + req.params.token);
            }
        } catch (ex) {
            log.error(ex);
            res.redirect(options.baseUrl + "/error");
            return;
        }
    });

    app.expressApp?.get(options.baseUrl + "/payment/select-card/:token", async (req, res) => {
        try {
            const tokenData = verify(req.params.token, options.JTW_TOKEN) as stripeAPIToken<confirmPaymentTokenOptions>;
            if (tokenData.type != "payment") {
                throw "Invalid token type";
            }
            const stripe = app.ctx.plugins.stripePlugin.stripeAPI.stripe as Stripe;
            const paymentIntent = await stripe.paymentIntents.retrieve(tokenData.options.paymentIntentId);
            const paymentMethods = await stripe.paymentMethods.list({
                customer: paymentIntent.customer?.toString(),
                type: "card",
            });
            if (paymentMethods.data.length == 0) {
                res.redirect(options.baseUrl + "/payment/enter-card/" + req.params.token);
            }

            const ctx = {
                card: paymentMethods.data[0].card,
                paymentSelectCardPayButtonText: options.phrases?.paymentSelectCardPayButtonText || "Betala",
                paymentSelectCardChangeCardButtonText: options.phrases?.paymentSelectCardChangeCardButtonText || "Byt kort",
                publishableKey: options.stripePublishableKey,
                token: req.params.token,
                baseUrl: options.baseUrl,
            };

            HandlebarsTemplateHandler(
                app.ctx.plugins.stripePlugin.templates.master,
                app.ctx.plugins.stripePlugin.templates.style,
                app.ctx.plugins.stripePlugin.templates.paySelectCard,
                {
                    redirectUrl: options.redirectUrl,
                    message: options.phrases?.setupDoneMessage || "Kortet har sparats.",
                },
                res
            );
        } catch (ex) {
            log.error(ex);
            res.redirect(options.baseUrl + "/error");
            return;
        }
    });

    app.expressApp?.get(options.baseUrl + "/payment/select-card/:token", (req, res) => {});

    // app.addHandler(userLoginHandler, {
    //   method: HttpMethod.post,
    //   path: options.baseUrl + "/login",
    //   docs: "Authenticates a user",
    //   origin: options.pluginId,
    // });
}

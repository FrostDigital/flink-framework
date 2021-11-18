import { badRequest, FlinkApp, FlinkPlugin, HttpMethod, log, unauthorized } from "@flink-app/flink";
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
import { payEnterCardTemplate } from "./templates/pay-enter-card";
import { connectDoneTemplate } from "./templates/connect-done";

import { verify } from "jsonwebtoken";
import { stripeAPIToken } from "./schemas/stripeAPIToken";
import { setupCardTokenOptions } from "./schemas/customer/setupCardTokenOptions";
import { confirmPaymentTokenOptions } from "./schemas/payment/confirmPaymentTokenOptions";
import connectSessionRepo from "./reposx/ConnectSessionRepo";
export const stripePlugin = (options: stripePluginOptions): FlinkPlugin => {
    if (options.paymentCallback == null) options.paymentCallback = () => {};
    if (options.stripeConnectCallback == null) options.stripeConnectCallback = () => {};

    const stripeAPI = new StripeAPI(options);

    const templates = {
        master: options.templates?.master || masterTemplate,
        style: options.templates?.style || styleTemplate,
        setupCard: options.templates?.setupCard || setupCardTemplate,
        setupDone: options.templates?.setupDone || setupDoneTemplate,
        error: options.templates?.error || errorTemplate,
        paySelectCard: options.templates?.paySelectCard || paySelectCardTemplate,
        payEnterCard: options.templates?.payEnterCard || payEnterCardTemplate,
        connectDone: options.templates?.connectDone || connectDoneTemplate,
    };
    return {
        id: "stripePlugin",
        init: (app) => init(app, options),
        ctx: {
            stripeAPI,
            templates,
        },
    };
};

function init(app: FlinkApp<any>, options: stripePluginOptions) {
    if (options.baseUrl == null) options.baseUrl = "/stripe";

    log.info("Registered route GET " + options.baseUrl + "/customer/setup-card/:token");
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

    log.info("Registered route GET " + options.baseUrl + "/customer/setup-card-done");

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

    log.info("Registered route GET " + options.baseUrl + "/payment/confirm/:token");
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

    log.info("Registered route GET " + options.baseUrl + "/payment/select-card/:token");

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
                logo: options.logo,
                client_secrect: paymentIntent.client_secret,
                price: (paymentIntent.amount / 100).toFixed(2) + " " + paymentIntent.currency.toUpperCase(),
                description: paymentIntent.description,
            };

            HandlebarsTemplateHandler(
                app.ctx.plugins.stripePlugin.templates.master,
                app.ctx.plugins.stripePlugin.templates.style,
                app.ctx.plugins.stripePlugin.templates.paySelectCard,
                ctx,
                res
            );
        } catch (ex) {
            log.error(ex);
            res.redirect(options.baseUrl + "/error");
            return;
        }
    });

    log.info("Registered route GET " + options.baseUrl + "/payment/enter-card/:token");
    app.expressApp?.get(options.baseUrl + "/payment/enter-card/:token", async (req, res) => {
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
            for (var x in paymentMethods.data) {
                const pi = paymentMethods.data[x];
                await stripe.paymentMethods.detach(pi.id);
            }

            const ctx = {
                paymentEnterCardPayButtonText: options.phrases?.paymentEnterCardPayButtonText || "Betala",
                publishableKey: options.stripePublishableKey,
                token: req.params.token,
                baseUrl: options.baseUrl,
                logo: options.logo,
                client_secrect: paymentIntent.client_secret,
                price: (paymentIntent.amount / 100).toFixed(2) + " " + paymentIntent.currency.toUpperCase(),
                description: paymentIntent.description,
            };

            HandlebarsTemplateHandler(
                app.ctx.plugins.stripePlugin.templates.master,
                app.ctx.plugins.stripePlugin.templates.style,
                app.ctx.plugins.stripePlugin.templates.payEnterCard,
                ctx,
                res
            );
        } catch (ex) {
            log.error(ex);
            res.redirect(options.baseUrl + "/error");
            return;
        }
    });

    log.info("Registered route GET " + options.baseUrl + "/callback/:event");
    app.expressApp?.post(options.baseUrl + "/callback/:event", async (req, res) => {
        if (req.params.event == "charge.succeeded") {
            const paymentIntentId = req.body?.data?.object?.payment_intent;
            if (paymentIntentId == null) {
                res.status(400).send("Bad request");
                return;
            }
            const stripe = app.ctx.plugins.stripePlugin.stripeAPI.stripe as Stripe;
            try {
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent == null) {
                    res.status(400).send("Bad request");
                    return;
                }
                if (paymentIntent.status == "succeeded" || paymentIntent.status == "requires_capture") {
                    try {
                        options.paymentCallback!(paymentIntent.id, paymentIntent.status);
                    } catch (ex) {
                        log.error("paymentCallback:" + ex);
                    }
                }
            } catch (ex) {
                log.error(ex);
                res.status(500).send("Internal error");
            }
        }
        res.status(200).send("Completed");
    });

    log.info("Registered route GET " + options.baseUrl + "/connect");
    app.expressApp?.get(options.baseUrl + "/connect", async (req, res) => {
        const { code, state } = req.query;
        if (code && state) {
            const stripe = app.ctx.plugins.stripePlugin.stripeAPI.stripe as Stripe;
            const token = await stripe.oauth.token({
                grant_type: "authorization_code",
                code: code.toString(),
            });

            const repo = app.ctx.repos.connectsessionRepo as connectSessionRepo;
            const session = await repo.getById(state.toString());

            try {
                options.stripeConnectCallback!(session!.userId, token.stripe_user_id!);

                HandlebarsTemplateHandler(
                    app.ctx.plugins.stripePlugin.templates.master,
                    app.ctx.plugins.stripePlugin.templates.style,
                    app.ctx.plugins.stripePlugin.templates.connectDone,
                    {
                        redirectUrl: options.redirectUrl,
                        message: options.phrases?.connectDoneMessage || "Kontot har kopplats till Stripe.",
                    },
                    res
                );
            } catch (ex) {
                log.error("paymentCallback:" + ex);
                res.redirect(options.baseUrl + "/error");
            }
        } else {
            res.redirect(options.baseUrl + "/error");
        }
    });

    if (app.db != null) {
        app.addRepo("connectsessionRepo", new connectSessionRepo("ConnectSessionRepo", app.db));
    }

    app.ctx.plugins.stripePlugin.stripeAPI.config.setRepo(app.ctx.repos.connectsessionRepo);
}

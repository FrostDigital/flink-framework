import { bankIdPlugin } from "../src/FlinkBankIdPlugin";

const BANKID_TEST_CERT =
    "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";

describe("FlinkBankIdPlugin", () => {
    it("should create and configure plugin", () => {
        const plugin = bankIdPlugin({
            passphrase: "qwerty123",
            pfx: BANKID_TEST_CERT,
            production: false,
        });

        expect(plugin).toBeDefined();
    });

    describe("bankid integration tests", () => {
        // Skip bankid integration tests on CI server
        if (process.env.CI) return;

        jasmine.DEFAULT_TIMEOUT_INTERVAL = 20 * 1000;

        it("should sign and cancel", async () => {
            const plugin = bankIdPlugin({
                passphrase: "qwerty123",
                pfx: BANKID_TEST_CERT,
                production: false,
            });

            const signSession = await plugin.sign({
                endUserIp: "127.0.0.1",
                personalNumber: "198204111234",
                text: "Please sign",
            });

            expect(signSession.orderRef).toBeDefined();

            await signSession.cancel();
        });

        it("should auth and cancel", async () => {
            const plugin = bankIdPlugin({
                passphrase: "qwerty123",
                pfx: BANKID_TEST_CERT,
                production: false,
            });

            const authSession = await plugin.authenticate({
                endUserIp: "127.0.0.1",
                personalNumber: "198204111234",
            });

            expect(authSession.orderRef).toBeDefined();

            await authSession.cancel();

            //  const collectRes = await authSession.collect();
        });
    });
});

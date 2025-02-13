import ApnMessage from "./schemas/ApnMessage";

export interface ApnPluginContext {
    apn: {
        send: (message: ApnMessage) => void;
    };
}

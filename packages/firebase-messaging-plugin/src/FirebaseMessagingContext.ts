import Message from "./schemas/Message";

export interface FirebaseMessagingContext {
  firebaseMessaging: {
    send: (message: Message) => void;
  };
}

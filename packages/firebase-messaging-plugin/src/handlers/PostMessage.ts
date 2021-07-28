import {
  FlinkContext,
  Handler,
  HttpMethod,
  RouteProps,
} from "@flink-app/flink";
import { FirebaseMessagingContext } from "../FirebaseMessagingContext";
import Message from "../schemas/Message";
import SendResult from "../schemas/SendResult";

export const Route: RouteProps = {
  method: HttpMethod.post,
  path: "/send-message",
  docs: "Publishes push notification to one or multiple devices",
};

const PostMessage: Handler<
  FlinkContext<FirebaseMessagingContext>,
  Message,
  SendResult
> = async ({ ctx, req }) => {
  await ctx.plugins.firebaseMessaging.send(req.body);

  return {
    data: { failedDevices: [] }, // TODO
  };
};

export default PostMessage;

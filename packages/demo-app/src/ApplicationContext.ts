import { FlinkContext } from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";
import { FirebaseMessagingContext } from "@flink-app/firebase-messaging-plugin";

interface ApplicationContext extends FlinkContext<FirebaseMessagingContext> {
  auth: JwtAuthPlugin;
}

export default ApplicationContext;

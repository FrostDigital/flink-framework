import { FlinkContext } from "@flink-app/flink";
import { JwtAuthPlugin } from "@flink-app/jwt-auth-plugin";

interface ApplicationContext extends FlinkContext {
  auth: JwtAuthPlugin;
}

export default ApplicationContext;

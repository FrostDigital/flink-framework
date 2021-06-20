import { FlinkAuthPlugin } from "./auth/FlinkAuthPlugin";
import { FlinkRepo } from "./FlinkRepo";

export interface FlinkContext<P = any> {
  repos: {
    [x: string]: FlinkRepo<any>;
  };

  plugins: P;

  /**
   * Type of authentication, if any.
   */
  auth?: FlinkAuthPlugin;
}

import { FlinkAuthPlugin } from "./auth/FlinkAuthPlugin";
import { FlinkPlugin } from "./FlinkPlugin";
import { FlinkRepo } from "./FlinkRepo";

export interface FlinkContext {
  repos: {
    [x: string]: FlinkRepo<any>;
  };

  plugins: {
    [x: string]: FlinkPlugin;
  };

  authPlugin?: FlinkAuthPlugin;
}

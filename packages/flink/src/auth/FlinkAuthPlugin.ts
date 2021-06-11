import { FlinkRequest } from "../FlinkHttpHandler";

export interface FlinkAuthPlugin {
  authenticateRequest: (req: FlinkRequest) => Promise<boolean>;
  createToken: (payload: any) => Promise<string>;
}

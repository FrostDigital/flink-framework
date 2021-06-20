import { FlinkRequest } from "../FlinkHttpHandler";

export interface FlinkAuthPlugin {
  authenticateRequest: (
    req: FlinkRequest,
    permissions: string | string[]
  ) => Promise<boolean>;
  createToken: (payload: any, roles: string[]) => Promise<string>;
}

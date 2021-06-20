import { FlinkContext } from "@flink-app/flink";
import PetRepo from "./repos/PetRepo";

// Pass any plugin types as generic argument
// Example: FlinkContext<ApiDocsPlugin & FirbasePlugin>

export interface Ctx extends FlinkContext {
  repos: {
    petRepo: PetRepo;
  };
}

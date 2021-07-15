import { ModuleList } from "./schemas/ModuleList";

export interface managementApiContext {
    managementApi: {
        jwtSecret : string,
        moduleList : ModuleList
    }
}
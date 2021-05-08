import { FlinkRepo } from "./FlinkRepo";

export interface FlinkContext {
    repos: {
        [x: string]: FlinkRepo<any>
    }
}

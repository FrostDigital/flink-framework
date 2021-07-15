import { FlinkContext } from "@flink-app/flink";
import { managementApiContext } from "./managementApiContext";
import ManagementUserRepo from "./repos/ManagementUserRepo";


export interface Ctx extends FlinkContext<managementApiContext>{
    repos : {
        managementUserRepo : ManagementUserRepo;
    };


}
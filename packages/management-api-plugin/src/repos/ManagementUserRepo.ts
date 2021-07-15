import { FlinkRepo } from "@flink-app/flink";
import { ManagementUser } from "../schemas/ManagementUser";

class ManagementUserRepo extends FlinkRepo<any, ManagementUser> {}

export default ManagementUserRepo;

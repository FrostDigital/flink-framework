import { ManagementUser } from "../ManagementUser";

export interface PutUserByUseridReq  extends Partial<Omit<ManagementUser, "_id" | "salt">>{
}
 
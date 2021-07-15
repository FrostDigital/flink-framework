import { ManagementUser } from "../ManagementUser";

export interface PostUserReq extends Omit<ManagementUser, "_id" | "salt">{

}
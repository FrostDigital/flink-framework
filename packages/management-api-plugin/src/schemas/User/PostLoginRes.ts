import { ManagementUserViewModel } from "../ManagementUserViewModel";

export interface PostUserLoginRes{
    user : ManagementUserViewModel,
    token : string
}
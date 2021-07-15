import { User}  from "../User";
export interface UserListItem{
    _id : string,
    username : string

}
export interface GetManagementUserRes{
    users : UserListItem[]
}
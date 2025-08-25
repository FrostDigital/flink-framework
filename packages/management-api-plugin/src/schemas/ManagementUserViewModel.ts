import { ManagementUser } from "./ManagementUser";
export interface ManagementUserViewModel extends Omit<ManagementUser, "password" | "salt"> {}

export const GetManagementUserViewModel = (user: ManagementUser): ManagementUserViewModel => {
    const { password, salt, ...resp } = user;
    return resp;
};

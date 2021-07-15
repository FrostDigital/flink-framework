import { User} from "../User";

export interface GetManagementUserByUseridRes extends Omit<User, "password" | "salt">{




}
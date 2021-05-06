import AppContext from "../AppContext";
import FlitRepo from "../framework/FlitRepo";
import User from "../schemas/User";

class UserRepo extends FlitRepo<AppContext, User> {
}

export default UserRepo;


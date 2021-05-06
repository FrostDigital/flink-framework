import FlitContext from "./framework/FlitContext";
import ContainerRepo from "./repos/ContainerRepo";
import UserRepo from "./repos/UserRepo";

interface AppContext extends FlitContext {
    repos: {
        containerRepo: ContainerRepo;
        userRepo: UserRepo;
    }
}

export default AppContext;
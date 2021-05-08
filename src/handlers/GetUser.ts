import AppContext from "../AppContext";
import { Handler, HttpMethod, RouteProps } from "../framework/HttpHandler";
import GetUsersRes from '../schemas/GetUsersRes';

export const Route: RouteProps = {
    path: "/user",
    method: HttpMethod.post,
    resSchema: "GetUsersRes"
}

const GetUser: Handler<AppContext, any, GetUsersRes> = async ({ ctx }) => {
    const users = await ctx.repos.userRepo.findAll();

    return {
        data: { users }
    }
}


export default GetUser;


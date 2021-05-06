import { Schemas } from '../../generated/schemas/Schemas';
import AppContext from "../AppContext";
import { HandlerFn, HttpMethod, RouteProps } from "../framework/HttpHandler";
import GetUsersRes from '../schemas/GetUsersRes';

export const Route: RouteProps<Schemas> = {
    path: "/user",
    method: HttpMethod.post,
    resSchema: "GetUsersRes"
}

const GetUser: HandlerFn<AppContext, any, GetUsersRes> = async ({ ctx }) => {
    const users = await ctx.repos.userRepo.findAll();

    return {
        data: { users }
    }
}


export default GetUser;


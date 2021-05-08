import AppContext from "../AppContext";
import { notFound } from '../framework/FlitErrors';
import { GetHandler, RouteProps } from "../framework/HttpHandler";
import User from '../schemas/User';

export const Route: RouteProps = {
    path: "/user/:id",
    resSchema: "User"
}

type Params = {
    id: string;
}

const GetUser: GetHandler<AppContext, User, Params> = async ({ req, ctx }) => {
    const { userRepo } = ctx.repos;

    const user = await userRepo.getBydId(req.params.id);

    if (!user) {
        return notFound(`User ${req.params.id} does not exist`);
    }

    return {
        data: user
    }
}

export default GetUser;


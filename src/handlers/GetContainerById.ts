import AppContext from "../AppContext";
import { notFound } from "../framework/FlitErrors";
import { GetHandler, RouteProps } from "../framework/HttpHandler";
import Container from "../schemas/Container";

export const Route: RouteProps = {
    path: "/container/:id",
}

type Params = {
    id: string;
}

const GetContainersById: GetHandler<AppContext, Container, Params> = async ({ req, ctx }) => {
    const container = await ctx.repos.containerRepo.getBydId(req.params.id);

    if (!container) {
        return notFound(`Container ${req.params.id} was not found`);
    }

    return {
        status: 201,
        data: container
    }
}


export default GetContainersById;


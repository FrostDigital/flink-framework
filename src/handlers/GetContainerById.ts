import { Schemas } from "../../generated/schemas/Schemas";
import AppContext from "../AppContext";
import { notFound } from "../framework/FlitErrors";
import { GetHandlerFn, RouteProps } from "../framework/HttpHandler";
import Container from "../schemas/Container";

export const Route: RouteProps<Schemas> = {
    path: "/container/:id",
    resSchema: "Container"
}

type Params = {
    id: string;
}

const GetContainersById: GetHandlerFn<AppContext, Container, Params> = async ({ req, ctx }) => {
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


import { Schemas } from '../../generated/schemas/Schemas';
import AppContext from "../AppContext";
import { GetHandlerFn, RouteProps } from "../framework/HttpHandler";
import GetContainersRes from "../schemas/GetContainersRes";

export const Route: RouteProps<Schemas> = {
    path: "/container",
    resSchema: "GetContainersRes"
};

const GetContainers: GetHandlerFn<AppContext, GetContainersRes> = async ({ ctx }) => {
    const { containerRepo } = ctx.repos;

    const containers = await containerRepo.findAll({});

    return {
        data: { containers }
    };
};

export default GetContainers;

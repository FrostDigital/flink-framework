import AppContext from "../AppContext";
import { GetHandler, RouteProps } from "../framework/HttpHandler";
import GetContainersRes from "../schemas/GetContainersRes";

export const Route: RouteProps = {
    path: "/container",
};

const GetContainers: GetHandler<AppContext, GetContainersRes> = async ({ ctx }) => {
    const { containerRepo } = ctx.repos;

    const containers = await containerRepo.findAll({});

    return {
        data: { containers }
    };
};

export default GetContainers;

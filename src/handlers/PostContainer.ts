import AppContext from "../AppContext";
import { HandlerFn, HttpMethod, RouteProps } from "../framework/HttpHandler";
import Container from "../schemas/Container";
import PostContainersReq from "../schemas/PostContainersReq";

export const Route: RouteProps = {
    path: "/container",
    method: HttpMethod.post,
}

const PostContainers: HandlerFn<AppContext, PostContainersReq, Container> = async ({ req, ctx }) => {
    const createdContainer = await ctx.repos.containerRepo.create(req.body);

    return {
        status: 201,
        data: createdContainer
    }
}


export default PostContainers;


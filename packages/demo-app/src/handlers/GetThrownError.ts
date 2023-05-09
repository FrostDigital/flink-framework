import { badRequest, Handler, RouteProps } from "@flink-app/flink";
import ApplicationContext from "../ApplicationContext";

export const Route: RouteProps = {
    path: "/throw-up",
};

const GetThrownError: Handler<ApplicationContext> = async ({ ctx, req }) => {
    throw badRequest("This is a thrown error");
};

export default GetThrownError;

import { Handler, RouteProps } from "../../../src/FlinkHttpHandler";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/foo",
};

const HandlerWithInvalidSchemas: Handler<
  any,
  { foo: number },
  Omit<Car, "model">
> = async ({ ctx, req }) => {
  return {
    data: {
      msg: "hello world",
    },
  };
};

export default HandlerWithInvalidSchemas;

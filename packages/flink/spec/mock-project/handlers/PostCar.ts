import { Handler, RouteProps } from "../../../src/FlinkHttpHandler";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car",
};

const PostCar: Handler<any, Car, Car> = async ({ ctx, req }) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default PostCar;

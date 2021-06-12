import { Handler, RouteProps } from "@flink-app/flink";
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

import { GetHandler, RouteProps } from "@flink-app/flink";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car-with-literal-schema",
};

const GetCarWithLiteralSchema: GetHandler<any, { car: Car }> = async ({
  ctx,
  req,
}) => {
  return {
    data: {
      car: { model: "Volvo" },
    },
  };
};

export default GetCarWithLiteralSchema;

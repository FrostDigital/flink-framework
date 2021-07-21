import { GetHandler, RouteProps } from "@flink-app/flink";
import Car from "../schemas/Car";

export const Route: RouteProps = {
  path: "/car-with-array-schema2",
};

const GetCarWithArraySchema2: GetHandler<any, { car: Car }[]> = async ({
  ctx,
  req,
}) => {
  return {
    data: [{ car: { model: "Volvo" } }],
  };
};

export default GetCarWithArraySchema2;

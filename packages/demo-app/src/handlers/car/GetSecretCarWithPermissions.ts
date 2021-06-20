import { GetHandler, RouteProps } from "@flink-app/flink";
import Car from "../../schemas/Car";

export const Route: RouteProps = {
  path: "/car-secret-permissions",
  permissions: ["secret"],
};

const GetSecretCarWithPermissions: GetHandler<any, Car> = async ({
  ctx,
  req,
}) => {
  return {
    data: {
      model: "Volvo",
    },
  };
};

export default GetSecretCarWithPermissions;

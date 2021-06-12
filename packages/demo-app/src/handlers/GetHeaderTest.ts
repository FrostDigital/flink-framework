import { Handler, RouteProps } from "@flink-app/flink";

export const Route: RouteProps = {
  path: "/header-test",
};

const GetHeaderTest: Handler<any> = async ({ ctx, req }) => {
  const testHeader = req.get("x-test") || "";
  return {
    data: {},
    headers: {
      "x-test": testHeader,
    },
  };
};

export default GetHeaderTest;

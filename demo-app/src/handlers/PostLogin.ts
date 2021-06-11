import { Handler, RouteProps } from "@flink-app/flink";

export const Route: RouteProps = {
  path: "/car",
};

const PostLogin: Handler<any> = async ({ ctx, req }) => {
  return {
    data: {},
    headers: {
      "x-test": "hello world",
    },
  };
};

export default PostLogin;

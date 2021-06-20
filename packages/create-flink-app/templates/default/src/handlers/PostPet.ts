import { Handler, notFound, RouteProps } from "@flink-app/flink";
import { Ctx } from "../Ctx";
import { Pet } from "../schemas/Pet";
import { PostPetReq } from "../schemas/PostPetReq";

export const Route: RouteProps = {
  path: "/pet",
};

const PostPet: Handler<Ctx, PostPetReq, Pet> = async ({ ctx, req }) => {
  const { petRepo } = ctx.repos;
  const pet = await petRepo.create({ ...req.body, created: new Date() });

  return {
    data: pet,
  };
};

export default PostPet;

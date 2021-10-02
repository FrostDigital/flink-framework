import { GetHandler, notFound, RouteProps } from "@flink-app/flink";
import { Ctx } from "../Ctx";
import { Pet } from "../schemas/Pet";

export const Route: RouteProps = {
  path: "/pet/:id",
};

type Params = {
  id: string;
};

const GetPet: GetHandler<Ctx, Pet, Params> = async ({ ctx, req }) => {
  const { id } = req.params;
  const { petRepo } = ctx.repos;

  const pet = await petRepo.getById(id);

  if (!pet) {
    return notFound(`Pet with id ${id} could not be found`);
  }

  return {
    data: pet,
  };
};

export default GetPet;

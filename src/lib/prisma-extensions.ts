import { Prisma } from "@prisma/client";

const SOFT_DELETE_MODELS = [
  "Tournament",
  "Group",
  "Match",
  "Team",
  "Player",
] as const;

type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}

export const softDeleteExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = { ...args.where, archivedAt: null };
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = { ...args.where, archivedAt: null };
        }
        return query(args);
      },
      async findUnique({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          return query(args);
        }
        return query(args);
      },
    },
  },
});

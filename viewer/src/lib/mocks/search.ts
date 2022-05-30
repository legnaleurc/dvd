import { rest } from "msw";

export const handlers = [
  rest.get("/api/v1/nodes", (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json([]));
  }),
];

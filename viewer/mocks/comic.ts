import { rest } from "msw";

import type { ImageResponse } from "$types/api";
import { assertIsString, folderResponse } from "./utils";

const TABLE: Record<string, ImageResponse[]> = {
  __NORMAL__: [
    {
      width: 100,
      height: 100,
    },
  ],
};

export const handlers = [
  rest.get("/api/v1/nodes/:id/images", (req, res, ctx) => {
    const { id } = req.params;
    assertIsString(id);
    return res(ctx.status(200), ctx.json(TABLE[id]));
  }),
  rest.get("/api/v1/nodes/:id", (req, res, ctx) => {
    const { id } = req.params;
    assertIsString(id);
    return res(ctx.status(200), ctx.json(folderResponse(id, "__ROOT__")));
  }),
  rest.get("/api/v1/cache", (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: "__NORMAL__",
          name: "__NORMAL__",
          image_list: TABLE["__NORMAL__"],
        },
      ]),
    );
  }),
  rest.delete("/api/v1/cache", (_req, res, ctx) => {
    return res(ctx.status(204));
  }),
];

import { rest } from "msw";

import type { VideoResponse } from "$lib/types/api";
import { assertIsString } from "./utils";

const TABLE: Record<string, VideoResponse[]> = {
  __NORMAL__: [
    {
      id: "__NORMAL__",
      name: "NORMAL",
      width: 100,
      height: 100,
      mime_type: "video/mp4",
    },
  ],
};

export const handlers = [
  rest.get("/api/v1/nodes/:id/videos", (req, res, ctx) => {
    const { id } = req.params;
    assertIsString(id);
    if (!TABLE[id]) {
      return res(ctx.status(404));
    }
    return res(ctx.status(200), ctx.json(TABLE[id]));
  }),
];

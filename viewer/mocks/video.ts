import { http, HttpResponse } from "msw";

import type { VideoResponse } from "$types/api";
import { assertIsString, status404 } from "./utils";

const TABLE: Record<string, VideoResponse[]> = {
  __NORMAL__: [
    {
      id: "__NORMAL__",
      name: "NORMAL",
      width: 100,
      height: 100,
      mime_type: "video/mp4",
      path: "__NORMAL__",
    },
  ],
};

export const handlers = [
  http.get("/api/v1/nodes/:id/videos", ({ params }) => {
    const { id } = params;
    assertIsString(id);
    if (!TABLE[id]) {
      return status404();
    }
    return HttpResponse.json(TABLE[id]);
  }),
];

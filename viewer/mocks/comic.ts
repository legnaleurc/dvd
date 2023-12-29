import { http, HttpResponse } from "msw";

import type { ImageResponse } from "$types/api";
import { assertIsString, folderResponse, status204 } from "./utils";

const TABLE: Record<string, ImageResponse[]> = {
  __NORMAL__: [
    {
      width: 100,
      height: 100,
    },
  ],
};

export const handlers = [
  http.get("/api/v1/nodes/:id/images", ({ params }) => {
    const { id } = params;
    assertIsString(id);
    return HttpResponse.json(TABLE[id]);
  }),
  http.get("/api/v1/nodes/:id", ({ params }) => {
    const { id } = params;
    assertIsString(id);
    return HttpResponse.json(folderResponse(id, "__ROOT__"));
  }),
  http.get("/api/v1/cache", () => {
    return HttpResponse.json([
      {
        id: "__NORMAL__",
        name: "__NORMAL__",
        image_list: TABLE["__NORMAL__"],
      },
    ]);
  }),
  http.delete("/api/v1/cache", () => {
    return status204();
  }),
];

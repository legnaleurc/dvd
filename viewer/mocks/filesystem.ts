import { http, HttpResponse } from "msw";

import type { ChangeResponse, NodeResponse } from "$types/api";
import { assertIsString, fileResponse, rootResponse, status404 } from "./utils";

const TABLE: Record<string, NodeResponse> = {
  __ROOT__: rootResponse(),
  __ID_1__: fileResponse("__ID_1__", "__ROOT__"),
};
const CHILDREN: Record<string, string[]> = {
  __ROOT__: ["__ID_1__"],
};
const CHANGE_LIST: ChangeResponse[] = [
  // rename
  {
    removed: false,
    node: fileResponse("__ID_1__", "__ROOT__", {
      name: "file_1_new",
    }),
  },
];

export const handlers = [
  http.get("/api/v1/nodes/root", () => {
    return HttpResponse.json(TABLE["__ROOT__"]);
  }),
  http.get("/api/v1/nodes/:id", ({ params }) => {
    const { id } = params;
    assertIsString(id);
    if (!TABLE[id]) {
      return status404();
    }
    return HttpResponse.json(TABLE[id]);
  }),
  http.get("/api/v1/nodes/:id/children", ({ params }) => {
    const { id } = params;
    assertIsString(id);
    if (!CHILDREN[id]) {
      return status404();
    }
    const children = CHILDREN[id];
    const rv = children.map((id) => TABLE[id]);
    return HttpResponse.json(rv);
  }),
  http.post("/api/v1/changes", () => {
    return HttpResponse.json(CHANGE_LIST);
  }),
  http.patch("/api/v1/nodes/:id", () => {
    return HttpResponse.json(null);
  }),
  http.delete("/api/v1/nodes/:id", () => {
    return HttpResponse.json(null);
  }),
];

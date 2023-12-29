import { http, HttpResponse } from "msw";

import { assertIsString, folderResponse, status204, status404 } from "./utils";

const VALID_ID = new Set(["a", "b", "c"]);

export const handlers = [
  http.patch("/api/v1/nodes/:id", ({ params }) => {
    const { id } = params;
    assertIsString(id);
    if (VALID_ID.has(id)) {
      return status204();
    } else {
      return status404();
    }
  }),
  http.delete("/api/v1/nodes/:id", ({ params }) => {
    const { id } = params;
    assertIsString(id);
    if (VALID_ID.has(id)) {
      return status204();
    } else {
      return status404();
    }
  }),
  http.get("/api/v1/nodes", ({ request }) => {
    const url = new URL(request.url);
    const path = url.searchParams.get("path");
    assertIsString(path);
    return HttpResponse.json([folderResponse(path, "__ROOT__")]);
  }),
];

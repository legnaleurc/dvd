import { rest } from "msw";
import { assertIsString, folderResponse } from "./utils";

const VALID_ID = new Set(["a", "b", "c"]);

export const handlers = [
  rest.patch("/api/v1/nodes/:id", (req, res, ctx) => {
    const { id } = req.params;
    assertIsString(id);
    if (VALID_ID.has(id)) {
      return res(ctx.status(204));
    } else {
      return res(ctx.status(404));
    }
  }),
  rest.delete("/api/v1/nodes/:id", (req, res, ctx) => {
    const { id } = req.params;
    assertIsString(id);
    if (VALID_ID.has(id)) {
      return res(ctx.status(204));
    } else {
      return res(ctx.status(404));
    }
  }),
  rest.get("/api/v1/nodes", (req, res, ctx) => {
    const path = req.url.searchParams.get("path");
    assertIsString(path);
    return res(
      ctx.status(200),
      ctx.json([folderResponse(path, "__ROOT__")]),
    );
  }),
];

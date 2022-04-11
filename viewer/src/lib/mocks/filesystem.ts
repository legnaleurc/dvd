import { rest } from "msw";

import type { ChangeResponse, NodeResponse } from "$lib/types/api";
import {
  assertIsString,
  fileResponse,
  rootResponse,
} from "./utils";

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
  rest.get("/api/v1/nodes/root", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(TABLE["__ROOT__"]));
  }),
  rest.get("/api/v1/nodes/:id", (req, res, ctx) => {
    const { id } = req.params;
    assertIsString(id);
    if (!TABLE[id]) {
      return res(ctx.status(404));
    }
    return res(ctx.status(200), ctx.json(TABLE[id]));
  }),
  rest.get("/api/v1/nodes/:id/children", (req, res, ctx) => {
    const { id } = req.params;
    assertIsString(id);
    if (!CHILDREN[id]) {
      return res(ctx.status(404));
    }
    const children = CHILDREN[id];
    const rv = children.map((id) => TABLE[id]);
    return res(ctx.status(200), ctx.json(rv));
  }),
  rest.post("/api/v1/changes", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(CHANGE_LIST));
  }),
  rest.patch("/api/v1/nodes/:id", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),
  rest.delete("/api/v1/nodes/:id", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),
];

import { describe, expect, test } from "vitest";

import {
  fileNode,
  fileResponse,
  folderNode,
  folderResponse,
} from "$lib/mocks/utils";
import type { ChangeResponse } from "$lib/types/api";
import { applyChange } from "./filesystem";

describe("filesystem", () => {
  describe("applyChange", () => {
    describe("new", () => {
      test("file under an expanded node", () => {
        const nodeMap = {
          __parent__: folderNode("__parent__", "__ROOT__"),
        };
        const childrenMap = {
          __parent__: [],
        };
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__child__", "__parent__"),
        };
        applyChange(nodeMap, childrenMap, change);

        // the new file is added to children
        expect(childrenMap).toEqual({
          __parent__: ["__child__"],
        });
        // the new node is added to cache
        expect(nodeMap).toHaveProperty("__child__");
      });

      test("folder under an expanded node", () => {
        const nodeMap = {
          __parent__: folderNode("__parent__", "__ROOT__"),
        };
        const childrenMap = {
          __parent__: [],
        };
        const change: ChangeResponse = {
          removed: false,
          node: folderResponse("__child__", "__parent__"),
        };
        applyChange(nodeMap, childrenMap, change);

        // the new file is added to children
        expect(childrenMap).toEqual({
          __parent__: ["__child__"],
        });
        // the new node is added to cache
        expect(nodeMap).toHaveProperty("__child__");
      });

      test("for a presented but non-expanded node", () => {
        const nodeMap = {
          __parent__: folderNode("__parent__", "__ROOT__"),
        };
        const childrenMap = {};
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__child__", "__parent__"),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({});
        // the cache should be untouched
        expect(nodeMap).not.toHaveProperty("__child__");
      });

      test("for a non-presented node", () => {
        const nodeMap = {};
        const childrenMap = {};
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__child__", "__parent__"),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({});
        // the cache should be untouched
        expect(nodeMap).not.toHaveProperty("__child__");
      });
    });

    describe("update", () => {
      test("existing node", () => {
        const nodeMap = {
          __node__: fileNode("__node__", "__ROOT__", {
            name: "old",
          }),
        };
        const childrenMap = {};
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__node__", "__ROOT__", {
            name: "new",
          }),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({});
        // the cache is updated
        expect(nodeMap).toHaveProperty("__node__");
        expect(nodeMap["__node__"].name).toEqual("new");
      });
    });

    describe("move", () => {
      test("from an expanded folder to another expanded folder", () => {
        const nodeMap = {
          __parent_a__: folderNode("__parent_a__", "__ROOT__"),
          __parent_b__: folderNode("__parent_b__", "__ROOT__"),
          __child__: folderNode("__child__", "__parent_a__", {
            name: "c",
          }),
        };
        const childrenMap = {
          __parent_a__: ["__child__"],
          __parent_b__: [],
        };
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__child__", "__parent_b__", {
            name: "cc",
          }),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({
          __parent_a__: [],
          __parent_b__: ["__child__"],
        });
        // the cache is updated
        expect(nodeMap).toHaveProperty("__child__");
        expect(nodeMap["__child__"].name).toEqual("cc");
      });

      test("from an expanded folder to a presented folder", () => {
        const nodeMap = {
          __parent_a__: folderNode("__parent_a__", "__ROOT__"),
          __parent_b__: folderNode("__parent_b__", "__ROOT__"),
          __child__: folderNode("__child__", "__parent_a__", {
            name: "c",
          }),
        };
        const childrenMap = {
          __parent_a__: ["__child__"],
        };
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__child__", "__parent_b__", {
            name: "cc",
          }),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({
          __parent_a__: [],
        });
        // the cache is updated
        expect(nodeMap).toHaveProperty("__child__");
        expect(nodeMap["__child__"].name).toEqual("cc");
      });

      test("from an expanded folder to a non-presented folder", () => {
        const nodeMap = {
          __parent_a__: folderNode("__parent_a__", "__ROOT__"),
          __child__: folderNode("__child__", "__parent_a__", {
            name: "c",
          }),
        };
        const childrenMap = {
          __parent_a__: ["__child__"],
        };
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__child__", "__parent_b__", {
            name: "cc",
          }),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({
          __parent_a__: [],
        });
        // the cache is updated
        expect(nodeMap).toHaveProperty("__child__");
        expect(nodeMap["__child__"].name).toEqual("cc");
      });
    });

    describe("trash", () => {
      test("file from an expanded folder", () => {
        const nodeMap = {
          __parent__: folderNode("__parent__", "__ROOT__"),
          __child__: folderNode("__child__", "__parent__"),
        };
        const childrenMap = {
          __parent__: ["__child__"],
        };
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__child__", "__parent__", {
            trashed: true,
          }),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({
          __parent__: [],
        });
        // the cache is updated
        expect(nodeMap).not.toHaveProperty("__child__");
      });

      test("file from a presented folder", () => {
        const nodeMap = {
          __parent__: folderNode("__parent__", "__ROOT__"),
        };
        const childrenMap = {};
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__child__", "__parent__", {
            trashed: true,
          }),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({});
        // the cache is updated
        expect(nodeMap).not.toHaveProperty("__child__");
      });

      test("file from a non-presented folder", () => {
        const nodeMap = {};
        const childrenMap = {};
        const change: ChangeResponse = {
          removed: false,
          node: fileResponse("__child__", "__parent__", {
            trashed: true,
          }),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({});
        // the cache is updated
        expect(nodeMap).not.toHaveProperty("__child__");
      });

      test("expanded folder from another expanded folder", () => {
        const nodeMap = {
          __parent__: folderNode("__parent__", "__ROOT__"),
          __child__: folderNode("__child__", "__parent__"),
          __grandchild__: folderNode("__grandchild__", "__child__"),
        };
        const childrenMap = {
          __parent__: ["__child__"],
          __child__: ["__grandchild__"],
        };
        const change: ChangeResponse = {
          removed: false,
          node: folderResponse("__child__", "__parent__", {
            trashed: true,
          }),
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({
          __parent__: [],
        });
        // the cache is updated
        expect(nodeMap).not.toHaveProperty("__child__");
      });
    });

    describe("delete", () => {
      test("file from an expanded folder", () => {
        const nodeMap = {
          __parent__: folderNode("__parent__", "__ROOT__"),
          __child__: folderNode("__child__", "__parent__"),
        };
        const childrenMap = {
          __parent__: ["__child__"],
        };
        const change: ChangeResponse = {
          removed: true,
          id: "__child__",
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({
          __parent__: [],
        });
        // the cache is updated
        expect(nodeMap).not.toHaveProperty("__child__");
      });

      test("file from a presented folder", () => {
        const nodeMap = {
          __parent__: folderNode("__parent__", "__ROOT__"),
        };
        const childrenMap = {};
        const change: ChangeResponse = {
          removed: true,
          id: "__child__",
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({});
        // the cache is updated
        expect(nodeMap).not.toHaveProperty("__child__");
      });

      test("file from a non-presented folder", () => {
        const nodeMap = {};
        const childrenMap = {};
        const change: ChangeResponse = {
          removed: true,
          id: "__child__",
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({});
        // the cache is updated
        expect(nodeMap).not.toHaveProperty("__child__");
      });

      test("expanded folder from another expanded folder", () => {
        const nodeMap = {
          __parent__: folderNode("__parent__", "__ROOT__"),
          __child__: folderNode("__child__", "__parent__"),
          __grandchild__: folderNode("__grandchild__", "__child__"),
        };
        const childrenMap = {
          __parent__: ["__child__"],
          __child__: ["__grandchild__"],
        };
        const change: ChangeResponse = {
          removed: true,
          id: "__child__",
        };
        applyChange(nodeMap, childrenMap, change);

        // the children should not change
        expect(childrenMap).toEqual({
          __parent__: [],
        });
        // the cache is updated
        expect(nodeMap).not.toHaveProperty("__child__");
      });
    });
  });
});

import { describe, expect, test } from "vitest";

import { extractCircleAndAuthor } from "$lib/tools/string";

describe("string", () => {
  describe("extractCircleAndAuthor", () => {
    test("circle and author", () => {
      const rv = extractCircleAndAuthor("(A1) [B2 C3 (D4 E5)] F6 (G7) [0].H8");
      expect(rv).toStrictEqual("B2 C3 (D4 E5)");
    });

    test("circle only", () => {
      const rv = extractCircleAndAuthor("(A1) [B2 C3] F6 (G7) [0].H8");
      expect(rv).toStrictEqual("B2 C3");
    });
  });
});

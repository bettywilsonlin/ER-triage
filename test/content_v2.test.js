import { it, expect } from "vitest";
import { CONTENT_V2 } from "../src/content_v2.js";
import { validateContentV2 } from "../src/schema_v2.js";

it("content_v2 通過 schema 驗證", () => {
  const r = validateContentV2(CONTENT_V2);
  expect(r.errors).toEqual([]);
  expect(r.ok).toBe(true);
});
it("part1 以 part1_ref 標記，不重複收錄題庫", () => {
  expect(CONTENT_V2.part1_ref?.repo).toBeDefined();
  expect(CONTENT_V2.part1).toBeUndefined(); // Part 1 不在此檔
});

import assert from "node:assert/strict";
import test from "node:test";

import { buildBrowseSearchUrl } from "../lib/search-url.js";

test("buildBrowseSearchUrl trims and encodes query", () => {
  const result = buildBrowseSearchUrl("boosters", "  Radiant #1  ");
  assert.equal(result, "/booster-browse?scope=boosters&q=Radiant%20%231");
});

test("buildBrowseSearchUrl keeps empty query", () => {
  const result = buildBrowseSearchUrl("all", "");
  assert.equal(result, "/booster-browse?scope=all&q=");
});

// frontend/src/utils/chart_data.test.mjs
//
// Covers docs/design_system.md §3 principle 3 as it applies to the
// snapshot charts: a section with nothing to plot is omitted, not drawn
// empty.
//
//   npm run test:utils

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { hasPlottableData, hasPieData, PIE_PLACEHOLDER } from "./chart_data.ts";

describe("hasPlottableData", () => {
  test("accepts a bar payload with real values", () => {
    assert.equal(
      hasPlottableData([
        { category: "q1", Home: 3.2, Away: 5.7 },
        { category: "q2", Home: 6.7, Away: 5.6 },
      ]),
      true
    );
  });

  test("rejects the all-zero payload that drew an empty axis frame", () => {
    // The NFL preseason "Key Offensive Metrics" case, verbatim in shape.
    assert.equal(
      hasPlottableData([
        { category: "Passing Yards / Attempt", Home: 0, Away: 0 },
        { category: "Rushing Yards / Attempt", Home: 0, Away: 0 },
      ]),
      false
    );
  });

  test("keeps a row where only one side has played", () => {
    assert.equal(
      hasPlottableData([{ category: "q1", Home: 0, Away: 7 }]),
      true
    );
  });

  test("rejects empty, null and undefined", () => {
    assert.equal(hasPlottableData([]), false);
    assert.equal(hasPlottableData(null), false);
    assert.equal(hasPlottableData(undefined), false);
  });

  test("ignores labels, so a payload of names alone is not data", () => {
    assert.equal(
      hasPlottableData([{ category: "q1" }, { category: "q2" }]),
      false
    );
  });

  test("ignores the backend's embedded colour field", () => {
    assert.equal(
      hasPlottableData([{ category: "Home", value: 0, color: "#4ade80" }]),
      false
    );
  });

  test("covers the radar shape without naming its fields", () => {
    assert.equal(
      hasPlottableData([
        { metric: "SRS", home_idx: 51.2, away_idx: 48.9, home_raw: 1.2, away_raw: -0.4 },
      ]),
      true
    );
    assert.equal(
      hasPlottableData([
        { metric: "SRS", home_idx: 0, away_idx: 0, home_raw: 0, away_raw: 0 },
      ]),
      false
    );
  });
});

describe("hasPieData", () => {
  test("accepts a real distribution", () => {
    assert.equal(
      hasPieData([
        { category: "Home (23.6)", value: 23.6 },
        { category: "Away (19.2)", value: 19.2 },
      ]),
      true
    );
  });

  test("rejects the two-zero pie that rendered no sectors but kept a legend", () => {
    assert.equal(
      hasPieData([
        { category: "Home (0.0)", value: 0 },
        { category: "Away (0.0)", value: 0 },
      ]),
      false
    );
  });

  test("rejects the NBA placeholder literal", () => {
    assert.equal(
      hasPieData([{ category: PIE_PLACEHOLDER, value: 1 }]),
      false
    );
  });

  test("rejects empty and missing", () => {
    assert.equal(hasPieData([]), false);
    assert.equal(hasPieData(undefined), false);
  });
});

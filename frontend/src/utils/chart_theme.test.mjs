// frontend/src/utils/chart_theme.test.mjs
//
// Covers docs/design_system.md §6.11 — the snapshot chart palette.
//
//   npm run test:utils
//
// The point of this file is the mirroring check. chart_theme.ts has to
// carry literal hex values because Recharts writes colours as SVG
// presentation attributes, where a var() reference does not resolve. So
// the neutrals are duplicated from index.css, and a duplicated constant
// that nothing verifies is a token drift waiting to happen — the same
// hazard venues.ts carries against stadium_data.json (§4.4).
//
// This parses the stylesheet and asserts the two agree, so changing a
// token without changing the palette fails the build.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { chartPalette, seriesColor } from "./chart_theme.ts";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "..", "index.css"), "utf8");

/**
 * Reads a token out of a block. The light values sit in `:root` and the
 * dark overrides in `.dark`, so the block has to be isolated first or
 * the light lookup finds the dark override.
 */
const tokenIn = (selector, name) => {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `no ${selector} block in index.css`);
  const end = css.indexOf("\n}", start);
  const block = css.slice(start, end);
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(match, `--${name} not declared in ${selector}`);
  return match[1].trim().toLowerCase();
};

describe("chart palette mirrors the index.css tokens", () => {
  const cases = [
    ["light", ":root", { axis: "ink-2", grid: "line", surface: "panel", ink: "ink" }],
    [".dark", ".dark", { axis: "ink-2", grid: "line", surface: "panel", ink: "ink" }],
  ];

  for (const [label, selector, mapping] of cases) {
    const theme = selector === ".dark" ? "dark" : "light";
    const palette = chartPalette(theme);

    for (const [slot, token] of Object.entries(mapping)) {
      test(`${label}: ${slot} matches --${token}`, () => {
        assert.equal(
          palette[slot].toLowerCase(),
          tokenIn(selector, token),
          `chart_theme.ts ${slot} has drifted from --${token}; edit both`
        );
      });
    }
  }
});

describe("series colours stay off the signal hues", () => {
  // Green means the model's output and orange means live (§5.1). A
  // series painted either one makes a claim the chart is not making.
  const RESERVED = ["#00b140", "#ff7f00", "#3ade72", "#00762c", "#ff9e3d", "#b25600"];

  for (const theme of ["light", "dark"]) {
    test(`${theme} series avoid brand green and orange`, () => {
      const { series1, series2 } = chartPalette(theme);
      for (const hue of RESERVED) {
        assert.notEqual(series1.toLowerCase(), hue);
        assert.notEqual(series2.toLowerCase(), hue);
      }
    });

    test(`${theme} series are distinct from each other`, () => {
      const { series1, series2 } = chartPalette(theme);
      assert.notEqual(series1.toLowerCase(), series2.toLowerCase());
    });
  }
});

describe("seriesColor keys on the label, not the payload order", () => {
  const p = chartPalette("dark");

  test("assigns home and away consistently whatever the index", () => {
    // MLB writes away first and NFL writes home first; both must land
    // on the same colour for the same side.
    assert.equal(seriesColor("Home (23.6)", 0, p), p.series1);
    assert.equal(seriesColor("Home (23.6)", 1, p), p.series1);
    assert.equal(seriesColor("Away (19.2)", 0, p), p.series2);
    assert.equal(seriesColor("Away (19.2)", 1, p), p.series2);
  });

  test("handles the long MLB category strings", () => {
    assert.equal(
      seriesColor("Home Offense vs Starting Pitcher's Hand (4.21 Runs)", 0, p),
      p.series1
    );
    assert.equal(
      seriesColor("Away Offense vs Starting Pitcher's Hand (3.90 Runs)", 1, p),
      p.series2
    );
  });

  test("falls back to the index for an unrecognised label", () => {
    assert.equal(seriesColor("Neutral site", 0, p), p.series1);
    assert.equal(seriesColor(undefined, 1, p), p.series2);
  });
});

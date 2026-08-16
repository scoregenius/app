// frontend/src/version_stamp.test.mjs
//
// Covers docs/design_system.md §8.4 — the More screen's version line.
//
//   npm run test:utils
//
// This is a mirroring check, the same shape as chart_theme.test.mjs
// against index.css. `import.meta.env.VITE_APP_VERSION` is supplied by a
// `define` in vite.config.ts, and a define is invisible from the code
// that reads it: if it is removed, nothing fails to compile, nothing
// warns, and the version line silently renders wrong.
//
// That is exactly how the line came to be dead in the first place. It
// was written against a variable no `.env`, no config and no CI step
// ever set, so the value was always "" and the guard around it was never
// true. The screen shipped for months with no way to tell which build
// you were running.
//
// The assertions are deliberately on the source text rather than on a
// built bundle: this suite runs with no dependencies and no build step.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(here, "..", ...p), "utf8");

const config = read("vite.config.ts");
const pkg = JSON.parse(read("package.json"));
const screen = read("src", "screens", "more_screen.tsx");

describe("the version stamp survives", () => {
  test("package.json carries a version to stamp", () => {
    assert.match(
      pkg.version ?? "",
      /^\d+\.\d+\.\d+/,
      "package.json needs a semver version; it is the only source"
    );
  });

  test("vite.config.ts defines VITE_APP_VERSION", () => {
    assert.match(
      config,
      /define:\s*\{[^}]*import\.meta\.env\.VITE_APP_VERSION/s,
      "the define is gone, so the version line renders nothing again"
    );
  });

  test("the define reads package.json rather than a literal", () => {
    assert.match(
      config,
      /readFileSync\([^)]*package\.json/,
      "hardcoding the version here would let it drift from package.json"
    );
    assert.doesNotMatch(
      config,
      /VITE_APP_VERSION"?\]?:\s*JSON\.stringify\("\d/,
      "the version is written as a literal, which will go stale"
    );
  });

  test("the screen still renders the version unguarded", () => {
    assert.match(
      screen,
      /import\.meta\.env\.VITE_APP_VERSION/,
      "More no longer reads the version"
    );
    assert.doesNotMatch(
      screen,
      /appVersion\s*&&/,
      "the line is behind a truthiness guard again, which is what hid it"
    );
  });
});

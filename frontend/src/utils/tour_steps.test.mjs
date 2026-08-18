// frontend/src/utils/tour_steps.test.mjs
//
// Covers docs/design_system.md §6.10 — the guided tour's step model.
//
//   npm run test:utils
//
// This file exists because of a constraint rather than a preference.
// **Nothing in this project can drive the guided tour automatically:**
// `requestAnimationFrame` does not fire in the agent's browser pane, so
// the tooltip never lays out past the first step. Every defect the tour
// has produced — 27, 47, 48, 49, 50, 51 — was found by a human clicking
// through, several of them months late. So the parts that can be
// asserted without a browser are asserted here, and the click-through is
// left to catch what genuinely needs eyes.
//
// Two of these are drift checks against files this module duplicates
// information from, in the same spirit as chart_theme.test.mjs against
// index.css: the anchor selectors against the step targets, and the
// route table against the routes App.tsx actually defines.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  baseSteps,
  CONDITIONAL_ANCHORS,
  CONDITIONAL_IDS,
  STEP_ROUTES,
  routeForStep,
  baseIndexOf,
  desiredDrops,
  freezeDrops,
  sameSet,
} from "./tour_steps.ts";

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, "..", "App.tsx"), "utf8");

const ids = baseSteps.map((s) => s.id);
const present = (weather) => ({ weather });

/** Steps whose anchor is app chrome, so they belong to no single screen. */
const CHROME_STEPS = ["sport-switch", "tab-stats", "tab-more"];

describe("the step array", () => {
  test("ids are unique", () => {
    assert.equal(new Set(ids).size, ids.length);
  });

  test("every step has a string target and content", () => {
    for (const step of baseSteps) {
      assert.equal(typeof step.target, "string", `${step.id} target`);
      assert.ok(step.content, `${step.id} content`);
    }
  });

  /* §10: sentence case, and no exclamation marks anywhere in the app. */
  test("copy has no exclamation marks", () => {
    for (const step of baseSteps) {
      assert.doesNotMatch(String(step.content), /!/, `${step.id}`);
    }
  });
});

describe("the conditional-anchor selectors match their own steps", () => {
  /* The filter and the step both name a selector. If they drift, the
   * filter silently stops describing the step it filters — which is the
   * mechanism behind defect 47, one level up. */
  for (const id of CONDITIONAL_IDS) {
    test(`${id}`, () => {
      const step = baseSteps.find((s) => s.id === id);
      assert.ok(step, `${id} is not a step`);
      assert.equal(step.target, CONDITIONAL_ANCHORS[id]);
    });
  }
});

describe("the route table", () => {
  test("covers every step that is not app chrome", () => {
    const routed = Object.keys(STEP_ROUTES).sort();
    const expected = ids.filter((id) => !CHROME_STEPS.includes(id)).sort();
    assert.deepEqual(routed, expected);
  });

  test("chrome steps have no route, so Back does not navigate for them", () => {
    for (const id of CHROME_STEPS) {
      assert.equal(routeForStep(id), null, id);
    }
  });

  /* Drift check against App.tsx. A renamed route would otherwise send
   * Back to a path the router answers with the catch-all redirect. */
  test("every route is one App.tsx actually defines", () => {
    const defined = [...appSource.matchAll(/<Route\s+path="([^"*:]+)"/g)].map(
      (m) => `/${m[1]}`
    );
    assert.ok(defined.length >= 3, "found no routes in App.tsx to check");
    for (const [id, route] of Object.entries(STEP_ROUTES)) {
      assert.ok(defined.includes(route), `${id} routes to ${route}, which App.tsx does not define`);
    }
  });
});

describe("desiredDrops", () => {
  test("NBA drops the weather step outright", () => {
    assert.ok(desiredDrops("NBA", present(true)).has("weather"));
  });

  test("an absent chip drops it on the sports that have one", () => {
    assert.ok(desiredDrops("MLB", present(false)).has("weather"));
    assert.ok(desiredDrops("NFL", present(false)).has("weather"));
  });

  test("a present chip keeps it", () => {
    assert.equal(desiredDrops("MLB", present(true)).size, 0);
  });
});

describe("freezeDrops — the array may only change ahead of the reader", () => {
  const none = () => new Set();
  const dropWeather = () => new Set(["weather"]);

  test("drops a step the reader has not reached", () => {
    // reader on the first step; weather is the fourth
    const next = freezeDrops(none(), dropWeather(), "sport-switch");
    assert.ok(next.has("weather"));
  });

  test("will not drop the step the reader is on", () => {
    const next = freezeDrops(none(), dropWeather(), "weather");
    assert.equal(next.has("weather"), false);
  });

  /* The defect this rule exists for: the reader follows "Open the Stats
   * tab", Games unmounts, the weather chip goes with it — and the array
   * must not shrink under them. */
  test("will not drop a step the reader has passed", () => {
    for (const id of ["tab-stats", "stats-subtab", "tab-more", "theme"]) {
      const next = freezeDrops(none(), dropWeather(), id);
      assert.equal(next.has("weather"), false, `reader on ${id}`);
    }
  });

  test("will not re-add a step behind the reader either", () => {
    const next = freezeDrops(dropWeather(), none(), "tab-stats");
    assert.ok(next.has("weather"), "re-adding would shift the reader too");
  });

  test("re-adds a step still ahead of the reader", () => {
    // the chip mounts late, after the card expands — this is the case
    // that stops a start-time latch from working
    const next = freezeDrops(dropWeather(), none(), "game-card");
    assert.equal(next.has("weather"), false);
  });

  test("returns the same set when nothing moved, so React can bail out", () => {
    const prev = dropWeather();
    assert.equal(freezeDrops(prev, dropWeather(), "sport-switch"), prev);
    assert.equal(freezeDrops(prev, none(), "tab-stats"), prev);
  });

  test("with no reader, everything ahead is fair game", () => {
    assert.ok(freezeDrops(none(), dropWeather(), null).has("weather"));
  });
});

describe("baseIndexOf", () => {
  test("orders steps as declared", () => {
    assert.ok(baseIndexOf("game-card") < baseIndexOf("weather"));
    assert.ok(baseIndexOf("weather") < baseIndexOf("tab-stats"));
    assert.ok(baseIndexOf("tab-stats") < baseIndexOf("theme"));
  });

  test("a null reader sorts before every step", () => {
    assert.equal(baseIndexOf(null), -1);
    for (const id of ids) assert.ok(baseIndexOf(id) > -1, id);
  });
});

describe("sameSet", () => {
  test("compares by member, not identity", () => {
    assert.ok(sameSet(new Set(["weather"]), new Set(["weather"])));
    assert.equal(sameSet(new Set(), new Set(["weather"])), false);
  });
});

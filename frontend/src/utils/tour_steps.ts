// frontend/src/utils/tour_steps.ts
import type { Step } from "react-joyride";
import type { Sport } from "@/contexts/sport_context";
import type { TourStepId } from "@/contexts/tour_context";

/**
 * The guided tour's step model. See docs/design_system.md §6.10.
 *
 * Pure data and pure functions, split out of `joyride_tour.tsx` so it can
 * be tested — the SOP's rule that helpers get tests and components do
 * not. That rule earns its keep here more than anywhere else in the app:
 * **nothing in this project can drive the guided tour automatically.**
 * `requestAnimationFrame` does not fire in the headless test browser, so
 * the tooltip never lays out past the first step, and every defect this
 * module encodes a rule against — 27, 47, 48, 49, 50, 51 — was found by a
 * human clicking through. What can be pinned by a test should be.
 *
 * All imports here are type-only on purpose, so the module can be loaded
 * by `node --test` with nothing resolved but itself.
 */

/** A Joyride step carrying the stable id consumers match on. */
export interface TourStep extends Step {
  id: TourStepId;
}

/**
 * Base step definitions.
 *
 * Copy rules are docs/design_system.md §10: sentence case, no shouting, no
 * exclamation marks, and no claim the data cannot support. Each step names
 * the control in the words the interface actually uses — "H2H Stats", "More",
 * "Roof closed" — so the tour and the app cannot describe different products.
 *
 * §4 constrains what may be said here: there is no live feed, so nothing
 * describes a score in progress, and model probabilities are never surfaced,
 * so the edge is a comparison rather than a confidence.
 */
export const baseSteps: TourStep[] = [
  {
    id: "sport-switch",
    target: '[data-tour="sport-switch"]',
    content: "Switch between MLB, NBA and NFL here.",
    disableBeacon: true,
    placement: "bottom",
  },
  {
    id: "game-card",
    target: '[data-tour="game-card"]:first-of-type',
    content:
      "One card is one matchup. Each team's row carries the model's predicted score, and a green triangle marks the side it favours.",
    disableBeacon: true,
    placement: "top",
  },
  {
    id: "snapshot",
    target: '[data-tour="snapshot-button"]:first-of-type',
    content: "H2H Stats opens the statistical snapshot for this matchup.",
    disableBeacon: true,
    placement: "right",
  },
  {
    /* Not "real-time weather". It is a venue forecast, and §4 plus §10 both
     * rule out implying precision the data does not have. */
    id: "weather",
    target: '[data-tour="weather-badge"]',
    content:
      "Conditions at the venue for outdoor games, including wind speed and direction. Covered venues read Roof closed instead.",
    disableBeacon: true,
    placement: "left",
  },
  {
    id: "tab-stats",
    target: '[data-tour="tab-stats"]',
    content: "Open the Stats tab, then press Next.",
    disableBeacon: true,
    placement: "top",
  },
  {
    id: "stats-subtab",
    target: '[data-tour="stats-subtab-advanced"]',
    content:
      "These sub-tabs switch between team, player and advanced figures. Players is NBA only.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    id: "stats-column",
    target: '[data-tour="stats-column-winpct"]',
    content:
      "Any column header sorts the table. Press it again to reverse the order.",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    id: "tab-more",
    target: '[data-tour="tab-more"]',
    content: "Open the More tab, then press Next.",
    placement: "top",
    disableBeacon: true,
  },
  {
    id: "theme",
    target: '[data-tour="theme-toggle"]',
    content: "Switch between light and dark here at any time.",
    placement: "top",
    disableBeacon: true,
  },
];

/**
 * Anchors filtered on presence rather than on a rule.
 *
 * **Only put an anchor here if it can be absent at the moment its own step
 * runs.** Filtering is not free: the array is what Joyride indexes, so a
 * step appearing or disappearing mid-run renumbers everything after it.
 *
 * The weather chip qualifies: it is omitted outright when the request
 * fails, so its step can be reached with nothing to point at.
 *
 * The two Stats anchors do **not** qualify, even though they are absent
 * while the reader is on Games. Their steps come after the one that sends
 * the reader to Stats, so by the time they are reached the anchors exist —
 * and tracking them would have removed them again the moment the reader
 * moved on to More. If a target genuinely is missing, the
 * TARGET_NOT_FOUND handler skips the step, which is the right outcome.
 */
export const CONDITIONAL_ANCHORS = {
  weather: '[data-tour="weather-badge"]',
} as const satisfies Partial<Record<TourStepId, string>>;

export type ConditionalStepId = keyof typeof CONDITIONAL_ANCHORS;
export type AnchorPresence = Record<ConditionalStepId, boolean>;

export const CONDITIONAL_IDS = Object.keys(
  CONDITIONAL_ANCHORS
) as ConditionalStepId[];

/**
 * The route that owns each step's anchor.
 *
 * Only steps whose anchor lives on exactly one screen appear here. The
 * sport switcher and the two bottom-nav items are app chrome, on every
 * screen, so they own no route and need no navigation — which is why most
 * of the tour's Back presses never needed routing and defect 50 only
 * showed at two boundaries.
 *
 * **This is a contract in the same sense the anchors are** (§6.10). A step
 * whose anchor moves to a different screen has to be re-listed here, or
 * Back will route to the wrong one.
 */
export const STEP_ROUTES = {
  "game-card": "/games",
  snapshot: "/games",
  weather: "/games",
  "stats-subtab": "/stats",
  "stats-column": "/stats",
  theme: "/more",
} as const satisfies Partial<Record<TourStepId, string>>;

export const routeForStep = (id: TourStepId): string | null =>
  (STEP_ROUTES as Partial<Record<TourStepId, string>>)[id] ?? null;

/**
 * Position in the unfiltered array. Filtering preserves order, so a base
 * position is a stable way to ask "is this step behind the reader?"
 * without the filter having to depend on its own output.
 */
export const baseIndexOf = (id: TourStepId | null): number =>
  id === null ? -1 : baseSteps.findIndex((step) => step.id === id);

/** What the filter would drop if nothing were frozen. */
export const desiredDrops = (
  sport: Sport,
  present: AnchorPresence
): Set<TourStepId> => {
  const drops = new Set<TourStepId>();
  // NBA never renders a weather chip at all — not a failure case.
  if (sport === "NBA") drops.add("weather");
  for (const id of CONDITIONAL_IDS) if (!present[id]) drops.add(id);
  return drops;
};

export const sameSet = (a: Set<TourStepId>, b: Set<TourStepId>): boolean =>
  a.size === b.size && [...a].every((id) => b.has(id));

/**
 * **The array may only change ahead of the reader.**
 *
 * The note above CONDITIONAL_ANCHORS has always said a step disappearing
 * mid-run renumbers everything after it. This is the rule that enforces
 * it, because the hazard was happening on every run: the weather chip is
 * a Games element, so the moment the reader follows "Open the Stats tab"
 * it unmounts, the observer drops its step, and the array goes 9 to 8
 * under a reader sitting at index 4.
 *
 * Presence is still tracked — it must be, since the chip mounts
 * asynchronously after the card expands, so a filter latched at start
 * would lose that step on every MLB and NFL run. What it may not do is
 * change anything at or behind the reader.
 *
 * Returns `prev` unchanged when nothing moved, so React can bail out.
 */
export const freezeDrops = (
  prev: Set<TourStepId>,
  want: Set<TourStepId>,
  readerId: TourStepId | null
): Set<TourStepId> => {
  const readerBase = baseIndexOf(readerId);
  const next = new Set(prev);
  let changed = false;

  for (const id of CONDITIONAL_IDS) {
    if (baseIndexOf(id) <= readerBase) continue; // frozen behind the reader
    const shouldDrop = want.has(id);
    if (shouldDrop === next.has(id)) continue;
    if (shouldDrop) next.add(id);
    else next.delete(id);
    changed = true;
  }

  return changed ? next : prev;
};

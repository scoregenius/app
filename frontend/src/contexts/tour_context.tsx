// frontend/src/contexts/tour_context.tsx
import { createContext, useContext, SetStateAction } from "react";

/**
 * Stable identity for each tour step.
 *
 * Declared here rather than beside the step definitions so that
 * joyride_tour can import it without a cycle — that module already
 * imports TourContext from this one.
 *
 * Anything that needs to know *which* step is showing must compare this,
 * never a number. The step array is filtered per sport and again on
 * whether the weather chip is present, so a position is not a stable
 * reference to a step.
 */
export type TourStepId =
  | "sport-switch"
  | "game-card"
  | "snapshot"
  | "weather"
  | "tab-stats"
  | "stats-subtab"
  | "stats-column"
  | "tab-more"
  | "theme";

/**
 * Everything a hop to another step needs to know about its destination.
 *
 * `route` is the screen that owns the anchor, or null where the anchor is
 * app chrome and exists on every screen.
 */
export interface TourHop {
  id: TourStepId;
  target: string | null;
  route: string | null;
}

export interface TourCtx {
  start: () => void;
  setStepIndex: React.Dispatch<SetStateAction<number>>;
  setRun: React.Dispatch<SetStateAction<boolean>>;
  /** Position within the *filtered* array. Joyride is driven by number. */
  currentStepIndex: number;
  /** Which step is showing, or null when the tour is not running. */
  currentStepId: TourStepId | null;
  /**
   * CSS selector the *next* step will target, or null at the end.
   *
   * Advancing waits for this to exist. Without it, pressing Next into a
   * step whose anchor has not mounted yet makes Joyride fire
   * TARGET_NOT_FOUND, which skips the step — and if the one after it is
   * also unmounted, skips that too.
   */
  nextStepTarget: string | null;
  /**
   * The step Back returns to, or null on the first step.
   *
   * Back has to be able to do what Next does, and then some. Advancing
   * only ever waits, because the reader is the one who navigates
   * forwards — the tour tells them to open a tab and press Next, and that
   * instruction is the lesson. Going back there is no lesson, so the tour
   * routes: see docs/design_system.md §6.10.
   */
  prevStep: TourHop | null;
  /**
   * The step a hop is moving to, while it is still in flight.
   *
   * Read by anything that has to prepare its own DOM before the anchor
   * can exist — today only the game card, which opens itself for the
   * three steps whose targets live inside an expanded card.
   */
  pendingStepId: TourStepId | null;
  setPendingStepId: (id: TourStepId | null) => void;
  /**
   * Which way the reader last asked to move. TARGET_NOT_FOUND uses it, so
   * a missing anchor is skipped in the direction of travel instead of
   * always forwards — which is how Back could move the reader on.
   */
  setTravel: (d: 1 | -1) => void;
  run: boolean;
}

export const TourContext = createContext<TourCtx | undefined>(undefined);

export const useTour = (): TourCtx => {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used inside a TourProvider");
  }
  return ctx;
};

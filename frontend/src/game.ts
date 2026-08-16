// frontend/src/game.ts
import type { UnifiedGame } from "@/types";

/** Helper: are two dates the same local calendar day? */
const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** 3.5 hours — the same window game_card uses to infer "in progress". */
const STALE_WINDOW_MS = 3.5 * 60 * 60 * 1000;

/**
 * Should this game drop off *today's* list?
 *
 * The screen answers "which of today's games are worth a closer look?", so a
 * game with nothing left to say should go. But a finished game with a
 * reported result still has something to say — the score — and the card has a
 * Final state built for exactly that: muted, score at full contrast, sorted
 * last. So the test is what we can show, not merely how long ago it started:
 *
 * - a result has been reported  → keep it, however long ago it started
 * - past the window, no result  → drop it, there is nothing to render
 * - within the window           → keep it, it is upcoming or in progress
 *
 * This only ever applies to games on the current local day. Past dates are
 * left alone so results stay browsable.
 *
 * Gating on the result rather than the clock matters because the feed is
 * slow and inconsistent: schedule rows routinely still read
 * `statusState: "NS"` with null scores many hours after a game has ended. A
 * purely time-based rule hid finished games whose scores had already landed,
 * while a purely permissive rule would leave placeholder cards reading
 * "Started 7:10 PM — / —" in the list all evening.
 */
export function isGameStale(game: UnifiedGame, now = Date.now()): boolean {
  const ts = new Date(game.gameTimeUTC ?? "").getTime();
  if (Number.isNaN(ts)) return false; // can't judge, let higher-level logic handle finals

  const gameDate = new Date(game.gameTimeUTC ?? game.game_date);

  // Only ever prune today's slate.
  if (!isSameLocalDay(new Date(now), gameDate)) return false;

  // A reported result is worth showing, so the card can render it as Final.
  const hasResult =
    game.home_final_score != null && game.away_final_score != null;
  if (hasResult) return false;

  // Past the window with no result: there is nothing left to display.
  return now >= ts + STALE_WINDOW_MS;
}

// frontend/src/utils/market.ts
//
// Market-line presentation for the game card. Pure — no React, no fetching.
// Rules: docs/design_system.md §8.1 "Fallback — odds".

import type { Sport } from "@/types";

/** U+2212. A hyphen is not a minus sign and does not align in tabular figures. */
const MINUS = "−";

/**
 * Odds feeds send `0` as a placeholder for "not posted yet" rather than
 * omitting the field, so a zero counts as absent alongside null, undefined
 * and anything non-numeric.
 *
 * The one exception is the spread, where zero is a real line — see
 * `marketSegments`.
 */
export const isPresent = (v: unknown): boolean => {
  if (v === null || v === undefined || v === "") return false;
  const n = Number(v);
  return Number.isFinite(n) && n !== 0;
};

/** American odds: +145, −162. Returns "" when absent. */
export const fmtAmerican = (v: string | number | null | undefined): string => {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return "";
  return n > 0 ? `+${n}` : `${MINUS}${Math.abs(n)}`;
};

/** Signed line: +1.5, −7.5, PK. Returns "" when non-numeric. */
export const fmtSigned = (v: number | string | null | undefined): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "PK";
  return n > 0 ? `+${n}` : `${MINUS}${Math.abs(n)}`;
};

export interface MarketSegment {
  /** Short label — ML, SPR, O/U. */
  key: string;
  value: string;
}

export interface OddsInput {
  moneylineHome?: string | number | null;
  moneylineAway?: string | number | null;
  spreadLine?: number | null;
  totalLine?: number | null;
}

/**
 * Build the market strip from whatever is present. Missing values are
 * omitted rather than rendered as placeholders, so the strip simply gets
 * shorter.
 *
 * Two rules worth knowing:
 *
 * - A moneyline needs both sides. Half of one is meaningless, so an
 *   incomplete pair drops the whole segment. This also removes the edge
 *   chip upstream: `computeBestEdge` returns null without both prices.
 *
 * - A spread of `0` is a legitimate pick'em, but the NFL preseason feed
 *   sends `0` for spread *and* total together as placeholder data. So a
 *   zero spread counts as real only when a valid total sits beside it.
 *   That keeps the genuine pick'em and kills the placeholder, which is
 *   what currently renders as "Spread: 0 / O/U: 0" on preseason cards.
 */
export function marketSegments(o: OddsInput): MarketSegment[] {
  const segments: MarketSegment[] = [];

  if (isPresent(o.moneylineAway) && isPresent(o.moneylineHome)) {
    segments.push({
      key: "ML",
      value: `${fmtAmerican(o.moneylineAway)} / ${fmtAmerican(o.moneylineHome)}`,
    });
  }

  const totalOk = isPresent(o.totalLine);

  const spreadNum = Number(o.spreadLine);
  const spreadOk =
    o.spreadLine !== null &&
    o.spreadLine !== undefined &&
    Number.isFinite(spreadNum) &&
    (spreadNum !== 0 || totalOk);
  if (spreadOk) segments.push({ key: "SPR", value: fmtSigned(spreadNum) });

  if (totalOk) segments.push({ key: "O/U", value: String(o.totalLine) });

  return segments;
}

/**
 * Half-width fill fraction for the lean bar, 0 to 0.5.
 *
 * The scale is the margin at which the bar reaches the end of its side —
 * roughly a lopsided result for that sport. It is a presentation constant,
 * not a model output.
 */
const MARGIN_SCALE: Record<Sport, number> = { MLB: 3, NFL: 14, NBA: 15 };

export const leanFraction = (margin: number, sport: Sport): number => {
  if (!Number.isFinite(margin)) return 0;
  const scale = MARGIN_SCALE[sport] ?? 10;
  return (Math.min(Math.abs(margin), scale) / scale) * 0.5;
};

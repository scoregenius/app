// frontend/src/utils/stats_format.ts
//
// Cell formatting, column arithmetic and row ordering for the Stats
// screen. See docs/design_system.md §8.2.
//
// Lifted out of stats_screen.tsx, where these lived as module constants
// and inline comparators with no tests. Pure — no React, no fetching —
// so they are covered by `npm run test:utils` with no framework.
//
// Ordering lives here rather than in its own module because Node's
// native type stripping resolves a `.ts` import only with the extension
// spelled out, which TypeScript rejects without
// `allowImportingTsExtensions`. One cohesive module beats a project-wide
// compiler-option change made to satisfy one import.

/**
 * Keys whose value arrives as a **proportion** (0.494) and is displayed
 * as a percentage (49.4%).
 */
const proportionKeys = new Set([
  "three_pct",
  "ft_pct",
  "wins_all_percentage",
  "winPct",
  "efg_pct",
  "tov_pct",
  "oreb_pct",
  "pythagoreanWinPct",
  "avgRedZonePct",
  "avgThirdDownPct",
  "pythagorean_win_pct",
  "avg_red_zone_pct",
  "avg_third_down_pct",
]);

/**
 * Keys whose value arrives **already expressed as a percentage** (25.6)
 * and needs the suffix but not the multiplication.
 *
 * This exists because MLB's two endpoints disagree. `mlb/team-stats`
 * sends `wins_all_percentage: 0.494`, a proportion; `mlb/team-stats/
 * advanced` sends `win_pct: 25.625`, already a percentage. Only the
 * first was handled, so the Teams tab read `62.0%` while the Advanced
 * tab read `59.5` for the same statistic, one tab apart (defect 55).
 *
 * `pythag_win_pct` and `pythagorean_win_pct` are NOT a typo for one
 * another. They are different keys from different feeds carrying
 * different scales: MLB advanced sends `pythag_win_pct: 25.04`, and the
 * NFL summary sends `pythagorean_win_pct: 0.2005`. Both must keep their
 * own entry, in their own set.
 */
const percentageKeys = new Set(["win_pct", "pythag_win_pct"]);

/** Displayed to one decimal place. */
const oneDecimalKeys = new Set([
  "points_for_avg_all",
  "points_against_avg_all",
  "runs_for_avg_all",
  "runs_against_avg_all",
  "pace",
  "off_rtg",
  "def_rtg",
  "run_differential_avg",
  "home_away_run_diff_avg_split",
  "avgYardsPerDrive",
  "avgTurnoversPerGame",
  "avg_yards_per_drive",
  "avg_turnovers_per_game",
  "srs",
  "sos",
]);

/** Displayed as a whole number. */
const zeroDecimalKeys = new Set([
  "games_played",
  "points",
  "rebounds",
  "assists",
  "minutes",
  "run_differential",
  "expected_wins",
  "luck_factor",
  "wins",
  "runs_for",
  "runs_against",
  "gp",
]);

/** Time of possession, stored as seconds and shown as `m:ss`. */
const possessionKeys = new Set([
  "avgTimeOfPossession",
  "possessionTimeAvgSec",
]);

/**
 * Format one cell.
 *
 * A missing statistic returns the **empty string**, not a dash. §3
 * principle 3 and §7.3: absence is silent, and a table cell can
 * genuinely be blank. The screen used to print `–` here, which is
 * precisely the placeholder those rules forbid.
 *
 * `-Infinity` is treated as missing because the sort comparators use it
 * as their null sentinel, and a sorted-then-formatted row would
 * otherwise render the sentinel.
 */
export function formatStat(value: unknown, key: string): string {
  if (value == null || value === "" || value === -Infinity) return "";

  if (possessionKeys.has(key)) {
    const secs = Number(value);
    if (!Number.isFinite(secs)) return "";
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  // A non-finite *number* is absence, not text. Collapsing these two
  // cases into one guard renders the literal string "NaN" into a cell,
  // which is a placeholder by another name.
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
  } else {
    return String(value);
  }

  if (proportionKeys.has(key)) return `${(value * 100).toFixed(1)}%`;
  if (percentageKeys.has(key)) return `${value.toFixed(1)}%`;
  if (zeroDecimalKeys.has(key)) return value.toFixed(0);
  if (oneDecimalKeys.has(key)) return value.toFixed(1);
  return value.toFixed(1);
}

/**
 * The numeric value behind a cell, for sorting and for the magnitude
 * bar. Returns `null` where there is no number — including for genuine
 * text columns such as a streak, which must not be given a bar.
 */
export function statValue(value: unknown, key: string): number | null {
  if (value == null || value === "") return null;
  if (possessionKeys.has(key)) {
    const secs = Number(value);
    return Number.isFinite(secs) ? secs : null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

export interface ColumnRange {
  min: number;
  max: number;
}

/**
 * The range of a column's real values, used to scale the magnitude bar.
 * Rows with no value for the key are skipped rather than counted as
 * zero, which would drag every other bar toward full width.
 */
export function columnRange(
  rows: ReadonlyArray<Record<string, unknown>>,
  key: string
): ColumnRange | null {
  let min = Infinity;
  let max = -Infinity;
  let seen = 0;

  for (const row of rows) {
    const v = statValue(row[key], key);
    if (v === null) continue;
    if (v < min) min = v;
    if (v > max) max = v;
    seen += 1;
  }

  if (seen === 0) return null;
  return { min, max };
}

/**
 * Bar width as a percentage of the cell, for a value in its column.
 *
 * Floors at 12% so the smallest value still reads as a bar rather than
 * as a missing one — the bar's job is to show where a value sits, and a
 * zero-width mark says "no data" instead. A column whose values are all
 * identical gets full width throughout, which is the honest picture:
 * there is no spread to show.
 */
export function barWidth(value: number, range: ColumnRange): number {
  const span = range.max - range.min;
  if (span <= 0) return 100;
  return 12 + 88 * ((value - range.min) / span);
}

/**
 * The season as the sport writes it. NBA seasons straddle two calendar
 * years and are named for both; MLB and NFL are named for one.
 */
export function seasonLabel(season: number, sport: string): string {
  return sport === "NBA"
    ? `${season}-${String(season + 1).slice(-2)}`
    : String(season);
}

/* ------------------------------------------------------------------ */
/*  Ordering                                                          */
/* ------------------------------------------------------------------ */

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDir;
}

type Row = Record<string, unknown>;

/** The keys a team or player name ships under, across the five feeds. */
const NAME_KEYS = ["team_name", "teamName", "player_name"] as const;

function nameOf(row: Row): string {
  for (const key of NAME_KEYS) {
    const v = row[key];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

function byName(a: Row, b: Row): number {
  return nameOf(a).localeCompare(nameOf(b));
}

/**
 * Order rows by one numeric column.
 *
 * **Absent values always sort last**, in both directions. The previous
 * comparator pushed them to the top: it returned `-1` for a null in
 * ascending order and `+1` in descending, then negated the whole result
 * for descending — so nulls led the table either way. Sorting a league
 * by SRS put every team with no SRS above the best team that had one.
 *
 * Ties break on the name, ascending, whatever the direction. Without it
 * two teams on the same win percentage swap places between renders.
 */
export function sortRows<T extends Row>(
  rows: ReadonlyArray<T>,
  { key, dir }: SortState
): T[] {
  const out = [...rows];

  out.sort((a, b) => {
    const av = statValue(a[key], key);
    const bv = statValue(b[key], key);

    // Absence is not a value: it leaves the ordering entirely rather
    // than being ranked as high or low.
    if (av === null && bv === null) return byName(a, b);
    if (av === null) return 1;
    if (bv === null) return -1;

    const diff = av - bv;
    if (diff === 0) return byName(a, b);
    return dir === "asc" ? diff : -diff;
  });

  return out;
}

/**
 * Order rows by a text column — a team name, a streak. `statValue`
 * returns `null` for these, so `sortRows` would read them all as absent
 * and fall straight through to the name tie-break.
 */
export function sortRowsByText<T extends Row>(
  rows: ReadonlyArray<T>,
  { key, dir }: SortState
): T[] {
  const out = [...rows];

  out.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const aMissing = av == null || av === "";
    const bMissing = bv == null || bv === "";
    if (aMissing && bMissing) return byName(a, b);
    if (aMissing) return 1;
    if (bMissing) return -1;

    const diff = String(av).localeCompare(String(bv));
    if (diff === 0) return byName(a, b);
    return dir === "asc" ? diff : -diff;
  });

  return out;
}

/**
 * Toggle a sort. Clicking a new column starts it **descending**, because
 * every column here is a ranking and a reader asking for one wants the
 * leaders first. The old toggle started ascending, so the first click on
 * "Points" showed the lowest scorers in the league.
 */
export function nextSort(current: SortState, key: string): SortState {
  if (current.key !== key) return { key, dir: "desc" };
  return { key, dir: current.dir === "asc" ? "desc" : "asc" };
}

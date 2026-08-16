// frontend/src/api/normalize.ts
import type { NflTeamSummary } from "@/types";

/** snake_case → camelCase (top-level only) */
export function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/** Parse TOP as seconds from either number or "mm:ss" string */
function toPossessionSeconds(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    // "mm:ss"
    const m = v.match(/^(\d{1,3}):([0-5]\d)$/);
    if (m) {
      const mins = parseInt(m[1], 10);
      const secs = parseInt(m[2], 10);
      return mins * 60 + secs;
    }
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Normalize a raw NFL summary row into canonical camelCase */
export function normalizeNflTeamSummaryRow(raw: Record<string, any>) {
  const out: Record<string, any> = {};

  // Camel-case everything
  Object.entries(raw).forEach(([k, v]) => {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  });

  // Required canonical fields
  if (out.team_id !== undefined && out.teamId === undefined)
    out.teamId = String(out.team_id);
  if (out.team_name !== undefined && out.teamName === undefined)
    out.teamName = out.team_name;
  if (out.season !== undefined) out.season = Number(out.season);

  // Aliases
  if (out.srsLite !== undefined && out.srs === undefined) out.srs = out.srsLite;
  if (
    out.pythagorean_win_pct !== undefined &&
    out.pythagoreanWinPct === undefined
  ) {
    out.pythagoreanWinPct = out.pythagorean_win_pct;
  }
  if (out.win_pct !== undefined && out.winPct === undefined)
    out.winPct = out.win_pct;

  // ► TOP: accept seconds or "mm:ss" from any source and normalize to seconds
  const poss =
    toPossessionSeconds(out.avgTimeOfPossession) ??
    toPossessionSeconds(out.possessionTimeAvgSec) ??
    toPossessionSeconds(out.avg_time_of_possession) ?? // legacy snake
    toPossessionSeconds(out.possession_time_avg_sec); // legacy snake

  if (poss != null) {
    out.possessionTimeAvgSec = poss; // keep a canonical numeric seconds field
    out.avgTimeOfPossession = poss; // the Teams table reads this key
  }

  return out as unknown as NflTeamSummary;
}

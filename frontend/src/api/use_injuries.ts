// frontend/src/api/use_injuries.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

/**
 * Status values, measured against the production NFL feed on
 * 2026-08-14 over 1000 rows rather than taken from the previous
 * declaration, which was fiction: it claimed
 * `"Out" | "Doubtful" | "Questionable" | "Probable" | "Day-to-Day"`
 * and **not one of those five is a value the feed sends**. What it
 * actually sends is lower-case `active`, `questionable` and `out`,
 * plus title-case `Injured Reserve` and `Suspension`.
 *
 * Left open rather than closed to a union, because a feed that has
 * already diverged once from what the type asserted will do it again,
 * and a wrong union is worse than an open one — it reads as verified.
 * Compare on the helpers below rather than on literals.
 */
export type InjuryStatus =
  | "active"
  | "questionable"
  | "out"
  | "Injured Reserve"
  | "Suspension"
  | (string & Record<never, never>);

export interface Injury {
  id: string;
  player: string;
  team_display_name: string;
  status: InjuryStatus;
  detail: string;
  updated: string;
  injury_type: string | null;
}

const norm = (s: string | null | undefined): string =>
  (s ?? "").trim().toLowerCase();

/**
 * Carries no injury. 807 of those 1000 rows were `active`, every one of
 * them with `injury_type: null` and an empty `detail` — a roster listing,
 * not a report. They are dropped here rather than in a component so all
 * four consumers agree on what an injury is, and so the "no injuries"
 * empty state means what it says.
 */
export const isReportable = (injury: Injury): boolean =>
  norm(injury.status) !== "active" && norm(injury.status) !== "";

/**
 * Definitely not playing, as opposed to the degrees of doubt. Drives the
 * filled badge in the report; see docs/design_system.md §6.9.
 */
export const isUnavailable = (status: InjuryStatus): boolean =>
  ["out", "injured reserve", "suspension"].includes(norm(status));

export function useInjuries(
  league: string,
  date: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  return useQuery<Injury[], Error>({
    queryKey: ["injuries", league, date],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/v1/${league.toLowerCase()}/injuries?date=${date}`
      );
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const json = (await res.json()) as { data: Injury[] };

      return (json.data ?? [])
        .map((i) => ({
          id: i.id,
          player: i.player,
          team_display_name: i.team_display_name,
          status: i.status,
          detail: i.detail,
          updated: i.updated,
          injury_type: i.injury_type ?? null,
        }))
        .filter(isReportable);
    },
    enabled: enabled && Boolean(date),
  });
}

// frontend/src/utils/venues.ts
import type { Sport } from "@/types";

/**
 * Venues played under a roof, so the client can skip the weather request
 * entirely rather than fetching, waiting, and discarding the answer.
 *
 * ⚠ This duplicates `is_indoor` in backend/data/stadium_data.json. The
 * duplication is deliberate — the alternative was adding the flag to the
 * schedule endpoint, which changes the API shape — but it means **a venue
 * gaining or losing a roof needs editing in both places.** If the two ever
 * disagree the backend wins at render time: the response still carries
 * `isIndoor`, so a venue missing from this set only costs a round-trip, it
 * does not display the wrong thing.
 *
 * Retractable roofs are treated as closed, matching how the backend data
 * has always classified them. Usually right, occasionally wrong on a fine
 * day — which is why the chip states "Roof closed" rather than making any
 * claim about outside conditions. See docs/design_system.md §8.1.
 */
const INDOOR_VENUES: Record<"MLB" | "NFL", ReadonlySet<string>> = {
  // 8 of 30 — Tropicana is a fixed dome, the rest retract.
  MLB: new Set([
    "Arizona Diamondbacks",
    "Houston Astros",
    "Miami Marlins",
    "Milwaukee Brewers",
    "Seattle Mariners",
    "Tampa Bay Rays",
    "Texas Rangers",
    "Toronto Blue Jays",
  ]),
  // 11 of 32. Both Los Angeles clubs share SoFi.
  NFL: new Set([
    "Arizona Cardinals",
    "Atlanta Falcons",
    "Dallas Cowboys",
    "Detroit Lions",
    "Houston Texans",
    "Indianapolis Colts",
    "Las Vegas Raiders",
    "Los Angeles Chargers",
    "Los Angeles Rams",
    "Minnesota Vikings",
    "New Orleans Saints",
  ]),
};

/**
 * True when the home venue is known to be covered.
 *
 * NBA is excluded on purpose: every game is indoors, so the answer carries
 * no information and the card renders no weather chip at all.
 */
export const isKnownIndoor = (
  sport: Sport,
  homeTeam?: string | null
): boolean => {
  if (sport !== "MLB" && sport !== "NFL") return false;
  return INDOOR_VENUES[sport].has((homeTeam ?? "").trim());
};

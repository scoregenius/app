// frontend/src/utils/team_abbr.ts
//
// Team name → short code, for the anchor chip at the start of each card row.
// Pure — no React, no fetching.
//
// This is the one hand-maintained artefact the redesign introduces. The API
// returns full names only; `UnifiedGame` has no abbreviation field, and the
// backend's partial NFL handling in nfl_features/map.py never reaches the
// client. See docs/design_system.md §4.3.

/**
 * Canonical names as the schedule feeds spell them, taken from
 * backend/data/stadium_data.json for MLB and NFL and from the league list in
 * game_card.tsx for NBA.
 *
 * Lookup is normalised (see `abbr`), so punctuation and casing differences do
 * not need separate entries — "St. Louis Cardinals" and "St.Louis Cardinals"
 * both resolve from the single key below. Genuinely different names, such as a
 * relocated franchise, do need their own entry.
 */
export const TEAM_ABBR: Record<string, string> = {
  /* ---------------- MLB ---------------- */
  "Arizona Diamondbacks": "ARI",
  "Atlanta Braves": "ATL",
  "Baltimore Orioles": "BAL",
  "Boston Red Sox": "BOS",
  "Chicago Cubs": "CHC",
  "Chicago White Sox": "CWS",
  "Cincinnati Reds": "CIN",
  "Cleveland Guardians": "CLE",
  "Colorado Rockies": "COL",
  "Detroit Tigers": "DET",
  "Houston Astros": "HOU",
  "Kansas City Royals": "KC",
  "Los Angeles Angels": "LAA",
  "Los Angeles Dodgers": "LAD",
  "Miami Marlins": "MIA",
  "Milwaukee Brewers": "MIL",
  "Minnesota Twins": "MIN",
  "New York Mets": "NYM",
  "New York Yankees": "NYY",
  Athletics: "ATH",
  "Oakland Athletics": "ATH", // pre-relocation spelling, still in historical rows
  "Philadelphia Phillies": "PHI",
  "Pittsburgh Pirates": "PIT",
  "San Diego Padres": "SD",
  "San Francisco Giants": "SF",
  "Seattle Mariners": "SEA",
  "St. Louis Cardinals": "STL",
  "Tampa Bay Rays": "TB",
  "Texas Rangers": "TEX",
  "Toronto Blue Jays": "TOR",
  "Washington Nationals": "WSH",

  /* ---------------- NFL ---------------- */
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WSH",

  /* ---------------- NBA ---------------- */
  "Atlanta Hawks": "ATL",
  "Boston Celtics": "BOS",
  "Brooklyn Nets": "BKN",
  "Charlotte Hornets": "CHA",
  "Chicago Bulls": "CHI",
  "Cleveland Cavaliers": "CLE",
  "Dallas Mavericks": "DAL",
  "Denver Nuggets": "DEN",
  "Detroit Pistons": "DET",
  "Golden State Warriors": "GSW",
  "Houston Rockets": "HOU",
  "Indiana Pacers": "IND",
  "Los Angeles Clippers": "LAC",
  "Los Angeles Lakers": "LAL",
  "Memphis Grizzlies": "MEM",
  "Miami Heat": "MIA",
  "Milwaukee Bucks": "MIL",
  "Minnesota Timberwolves": "MIN",
  "New Orleans Pelicans": "NOP",
  "New York Knicks": "NYK",
  "Oklahoma City Thunder": "OKC",
  "Orlando Magic": "ORL",
  "Philadelphia 76ers": "PHI",
  "Phoenix Suns": "PHX",
  "Portland Trail Blazers": "POR",
  "Sacramento Kings": "SAC",
  "San Antonio Spurs": "SAS",
  "Toronto Raptors": "TOR",
  "Utah Jazz": "UTA",
  "Washington Wizards": "WAS",
};

/** Lowercase, alphanumerics only. Collapses spacing and punctuation variants. */
const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const INDEX: Record<string, string> = Object.create(null);
const CANONICAL: Record<string, string> = Object.create(null);
for (const [name, code] of Object.entries(TEAM_ABBR)) {
  INDEX[normalize(name)] = code;
  CANONICAL[normalize(name)] = name;
}

/**
 * Derived fallback for anything not in the map — exhibition sides, national
 * teams, All-Star rosters. Initials of the first three words, so
 * "EuroLeague Select" gives ES and "USA Select" gives US. Not correct in the
 * league sense, but it keeps the row's anchor column filled instead of
 * collapsing the layout.
 *
 * Deliberately not the primary mechanism: initials cannot distinguish
 * "New York Yankees" from "New York Mets", which is exactly why the map above
 * exists.
 */
const derive = (name: string): string => {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "—";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
};

export const abbr = (name?: string | null): string => {
  const raw = String(name ?? "").trim();
  if (!raw) return "—";
  return INDEX[normalize(raw)] ?? derive(raw);
};

/**
 * The club's name as this file spells it, for anything that will be *displayed*.
 *
 * The schedule feed sends `St.Louis Cardinals` with no space after the period.
 * `abbr` and `isLeagueTeam` both normalise punctuation away, so the chip and the
 * league table were always right — but the rendered name is the feed's string,
 * printed as received, which is what the reader actually sees. See defect 33.
 *
 * Unknown names are returned unchanged rather than guessed at: an exhibition
 * side or a national team has no canonical form here, and mangling it would be
 * worse than passing it through. The map's spellings match
 * `backend/data/stadium_data.json`, so canonicalising on the way in also aligns
 * the venue and weather lookups with the file they query.
 */
export const canonicalName = (name?: string | null): string => {
  const raw = String(name ?? "").trim();
  if (!raw) return raw;
  return CANONICAL[normalize(raw)] ?? raw;
};

/**
 * Is this the name of a real club in one of the three leagues?
 *
 * The same 92-name map, asked the other question. `abbr` deliberately never
 * fails — it derives initials for anything unknown so a card row keeps its
 * anchor. That is right for a game card and wrong for a league table, where an
 * unknown name is not a club at all and should not occupy a rank.
 *
 * The Stats screen uses this to keep aggregates and exhibition sides out of
 * team rankings: MLB's advanced feed ships `American League` and
 * `National League` rows during a live season, so a thirty-club league renders
 * thirty-two. See docs/design_system.md §4.3 and defect 60.
 *
 * Normalised the same way as the lookup, so `St.Louis Cardinals` from the
 * schedule feed and `St. Louis Cardinals` from the stadium file both pass.
 */
export const isLeagueTeam = (name?: string | null): boolean => {
  const raw = String(name ?? "").trim();
  return raw.length > 0 && normalize(raw) in INDEX;
};

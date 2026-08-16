// frontend/src/utils/stats_format.test.mjs
//
// Covers the rules docs/design_system.md states for the Stats screen,
// not the implementation:
//
//   §7.3 / §3 principle 3  absence is silent — never a dash
//   §8.2                   the magnitude bar reports spread
//   defect 55              MLB's two endpoints disagree on scale
//
// Every fixture value below is a real figure taken from the production
// API on 2026-08-14, not an invented one.
//
//   npm run test:utils

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  formatStat,
  statValue,
  columnRange,
  barWidth,
  seasonLabel,
  sortRows,
  sortRowsByText,
  nextSort,
} from "./stats_format.ts";

describe("formatStat — absence is silent", () => {
  test("null renders as nothing, not a dash", () => {
    assert.equal(formatStat(null, "srs"), "");
  });

  test("undefined renders as nothing", () => {
    assert.equal(formatStat(undefined, "srs"), "");
  });

  test("the empty string stays empty", () => {
    assert.equal(formatStat("", "srs"), "");
  });

  test("the sort comparators' -Infinity sentinel never reaches the cell", () => {
    assert.equal(formatStat(-Infinity, "points"), "");
  });

  test("NaN does not render as NaN", () => {
    assert.equal(formatStat(NaN, "srs"), "");
  });

  test("zero is a real value and still renders", () => {
    assert.equal(formatStat(0, "run_differential"), "0");
  });
});

describe("formatStat — MLB's two scales (defect 55)", () => {
  // The headline defect: the same statistic, one tab apart, rendered
  // two ways. mlb/team-stats sends a proportion; mlb/team-stats/advanced
  // sends a percentage.
  test("teams tab: wins_all_percentage is a proportion", () => {
    assert.equal(formatStat(0.494, "wins_all_percentage"), "49.4%");
  });

  test("advanced tab: win_pct is already a percentage", () => {
    assert.equal(formatStat(25.625, "win_pct"), "25.6%");
  });

  test("both tabs now agree on the suffix", () => {
    const teams = formatStat(0.595, "wins_all_percentage");
    const advanced = formatStat(59.5, "win_pct");
    assert.equal(teams, "59.5%");
    assert.equal(advanced, "59.5%");
    assert.equal(teams, advanced);
  });

  test("pythag_win_pct and pythagorean_win_pct are different keys, not a typo", () => {
    // MLB advanced sends the first as a percentage; the NFL summary
    // sends the second as a proportion. Conflating them would render
    // 2504% on one screen or 0.2% on the other.
    assert.equal(formatStat(25.036, "pythag_win_pct"), "25.0%");
    assert.equal(formatStat(0.2005, "pythagorean_win_pct"), "20.1%");
  });
});

describe("formatStat — the scales each feed actually sends", () => {
  test("NBA advanced percentages arrive as proportions", () => {
    assert.equal(formatStat(0.5389864864864865, "efg_pct"), "53.9%");
    assert.equal(formatStat(0.14692607150245426, "tov_pct"), "14.7%");
    assert.equal(formatStat(0.2601470988831381, "oreb_pct"), "26.0%");
  });

  test("NFL summary percentages arrive as proportions", () => {
    assert.equal(formatStat(0.17647058823529413, "winPct"), "17.6%");
    assert.equal(formatStat(0.3380281690140845, "avg_third_down_pct"), "33.8%");
  });

  test("ratings take one decimal, and keep their sign", () => {
    assert.equal(formatStat(105.03308641975309, "pace"), "105.0");
    assert.equal(formatStat(111.41697854174112, "off_rtg"), "111.4");
    assert.equal(formatStat(-11.235294117647058, "srs"), "-11.2");
    assert.equal(formatStat(-2.675, "run_differential_avg"), "-2.7");
  });

  test("counts take no decimals", () => {
    assert.equal(formatStat(160, "gp"), "160");
    assert.equal(formatStat(81, "games_played"), "81");
    assert.equal(formatStat(-428, "run_differential"), "-428");
    assert.equal(formatStat(2212, "points"), "2212");
  });

  test("an unrecognised numeric key falls back to one decimal", () => {
    assert.equal(formatStat(12.345, "some_future_metric"), "12.3");
  });
});

describe("formatStat — time of possession", () => {
  test("seconds become m:ss", () => {
    assert.equal(formatStat(1682.8823529411766, "possessionTimeAvgSec"), "28:03");
  });

  test("the seconds field is zero-padded", () => {
    assert.equal(formatStat(1805, "avgTimeOfPossession"), "30:05");
  });

  test("a whole minute does not lose its seconds", () => {
    assert.equal(formatStat(1800, "possessionTimeAvgSec"), "30:00");
  });

  test("a non-numeric possession value is treated as absent", () => {
    assert.equal(formatStat("28:2.88", "possessionTimeAvgSec"), "");
  });
});

describe("formatStat — text columns", () => {
  test("a streak passes through unchanged", () => {
    assert.equal(formatStat("WWWWW", "streak"), "WWWWW");
    assert.equal(formatStat("LLLWW", "current_form"), "LLLWW");
  });

  test("a team name passes through unchanged", () => {
    assert.equal(formatStat("Oklahoma City Thunder", "team_name"), "Oklahoma City Thunder");
  });
});

describe("statValue", () => {
  test("returns the number behind a numeric cell", () => {
    assert.equal(statValue(0.494, "wins_all_percentage"), 0.494);
  });

  test("parses possession seconds so the column can be ranged", () => {
    assert.equal(statValue(1682.88, "possessionTimeAvgSec"), 1682.88);
  });

  test("returns null for a text column, so it gets no bar", () => {
    assert.equal(statValue("WWWWW", "streak"), null);
    assert.equal(statValue("Seattle Seahawks", "team_name"), null);
  });

  test("returns null for absence", () => {
    assert.equal(statValue(null, "srs"), null);
    assert.equal(statValue(undefined, "srs"), null);
  });
});

describe("columnRange", () => {
  const rows = [
    { team_name: "Seattle Seahawks", winPct: 0.85 },
    { team_name: "New England Patriots", winPct: 0.81 },
    { team_name: "Denver Broncos", winPct: 0.789 },
  ];

  test("finds the spread of a column", () => {
    assert.deepEqual(columnRange(rows, "winPct"), { min: 0.789, max: 0.85 });
  });

  test("skips rows with no value rather than counting them as zero", () => {
    // Counting a missing row as 0 would drag every real bar to full width.
    const sparse = [...rows, { team_name: "Expansion Club", winPct: null }];
    assert.deepEqual(columnRange(sparse, "winPct"), { min: 0.789, max: 0.85 });
  });

  test("returns null when a column has no values at all", () => {
    assert.equal(columnRange(rows, "srs"), null);
    assert.equal(columnRange([], "winPct"), null);
  });

  test("ignores a text column", () => {
    assert.equal(columnRange(rows, "team_name"), null);
  });
});

describe("barWidth", () => {
  const range = { min: 0, max: 100 };

  test("the column leader fills the cell", () => {
    assert.equal(barWidth(100, range), 100);
  });

  test("the smallest value still reads as a bar, not as missing data", () => {
    assert.equal(barWidth(0, range), 12);
  });

  test("a midpoint sits between the two", () => {
    assert.equal(barWidth(50, range), 56);
  });

  test("a column with no spread is full throughout, which is the honest picture", () => {
    assert.equal(barWidth(7, { min: 7, max: 7 }), 100);
  });

  test("negative ranges scale the same way — SRS runs either side of zero", () => {
    assert.equal(barWidth(-11.2, { min: -11.2, max: 11.2 }), 12);
    assert.equal(barWidth(11.2, { min: -11.2, max: 11.2 }), 100);
  });
});

describe("seasonLabel", () => {
  test("NBA seasons straddle two years and are named for both", () => {
    assert.equal(seasonLabel(2025, "NBA"), "2025-26");
    assert.equal(seasonLabel(2019, "NBA"), "2019-20");
  });

  test("the turn of a century still gives two digits", () => {
    assert.equal(seasonLabel(2099, "NBA"), "2099-00");
  });

  test("MLB and NFL are named for one year", () => {
    assert.equal(seasonLabel(2025, "MLB"), "2025");
    assert.equal(seasonLabel(2025, "NFL"), "2025");
  });
});

/** Real NFL 2025 summary rows, trimmed to the fields under test. */
const nfl = [
  { team_name: "Seattle Seahawks", winPct: 0.85, srs: 8.1, streak: "WWWWW" },
  { team_name: "Los Angeles Rams", winPct: 0.7, srs: 7.4, streak: "WLLWW" },
  { team_name: "New England Patriots", winPct: 0.81, srs: 6.9, streak: "WWWLW" },
];

const names = (rows) => rows.map((r) => r.team_name);

describe("sortRows — direction", () => {
  test("descending puts the leader first", () => {
    assert.deepEqual(names(sortRows(nfl, { key: "winPct", dir: "desc" })), [
      "Seattle Seahawks",
      "New England Patriots",
      "Los Angeles Rams",
    ]);
  });

  test("ascending reverses it", () => {
    assert.deepEqual(names(sortRows(nfl, { key: "winPct", dir: "asc" })), [
      "Los Angeles Rams",
      "New England Patriots",
      "Seattle Seahawks",
    ]);
  });

  test("does not mutate the input", () => {
    const before = names(nfl);
    sortRows(nfl, { key: "winPct", dir: "asc" });
    assert.deepEqual(names(nfl), before);
  });
});

describe("sortRows — absence sorts last in both directions", () => {
  // The old comparator returned -1 for a null ascending and +1
  // descending, then negated the lot for descending, so nulls led the
  // table either way. Sorting a league by SRS put every team without one
  // above the best team that had one.
  const sparse = [
    { team_name: "Seattle Seahawks", srs: 8.1 },
    { team_name: "Expansion Club", srs: null },
    { team_name: "Los Angeles Rams", srs: 7.4 },
  ];

  test("descending: the team with no value is last", () => {
    assert.deepEqual(names(sortRows(sparse, { key: "srs", dir: "desc" })), [
      "Seattle Seahawks",
      "Los Angeles Rams",
      "Expansion Club",
    ]);
  });

  test("ascending: the team with no value is still last", () => {
    assert.deepEqual(names(sortRows(sparse, { key: "srs", dir: "asc" })), [
      "Los Angeles Rams",
      "Seattle Seahawks",
      "Expansion Club",
    ]);
  });

  test("a column that is absent throughout falls back to name order", () => {
    const rows = sortRows(nfl, { key: "not_in_this_feed", dir: "desc" });
    assert.deepEqual(names(rows), [
      "Los Angeles Rams",
      "New England Patriots",
      "Seattle Seahawks",
    ]);
  });
});

describe("sortRows — stability", () => {
  const tied = [
    { team_name: "Houston Texans", winPct: 0.684 },
    { team_name: "Buffalo Bills", winPct: 0.684 },
    { team_name: "San Francisco 49ers", winPct: 0.684 },
  ];

  test("ties break on the name, ascending", () => {
    assert.deepEqual(names(sortRows(tied, { key: "winPct", dir: "desc" })), [
      "Buffalo Bills",
      "Houston Texans",
      "San Francisco 49ers",
    ]);
  });

  test("the tie-break does not flip with the direction", () => {
    const desc = names(sortRows(tied, { key: "winPct", dir: "desc" }));
    const asc = names(sortRows(tied, { key: "winPct", dir: "asc" }));
    assert.deepEqual(desc, asc);
  });
});

describe("sortRows — possession time", () => {
  // Stored as seconds, displayed as m:ss. It must sort as a number, not
  // as the string "30:29".
  const rows = [
    { team_name: "Buffalo Bills", possessionTimeAvgSec: 2015 },
    { team_name: "Pittsburgh Steelers", possessionTimeAvgSec: 1703 },
    { team_name: "Seattle Seahawks", possessionTimeAvgSec: 1829 },
  ];

  test("orders by the underlying seconds", () => {
    assert.deepEqual(
      names(sortRows(rows, { key: "possessionTimeAvgSec", dir: "desc" })),
      ["Buffalo Bills", "Seattle Seahawks", "Pittsburgh Steelers"]
    );
  });
});

describe("sortRowsByText", () => {
  test("orders a streak alphabetically", () => {
    assert.deepEqual(names(sortRowsByText(nfl, { key: "streak", dir: "asc" })), [
      "Los Angeles Rams",
      "New England Patriots",
      "Seattle Seahawks",
    ]);
  });

  test("orders team names", () => {
    assert.deepEqual(
      names(sortRowsByText(nfl, { key: "team_name", dir: "asc" })),
      ["Los Angeles Rams", "New England Patriots", "Seattle Seahawks"]
    );
  });

  test("a missing string sorts last, like a missing number", () => {
    const rows = [
      { team_name: "Seattle Seahawks", streak: "WWWWW" },
      { team_name: "Expansion Club", streak: null },
      { team_name: "Los Angeles Rams", streak: "LLLLL" },
    ];
    assert.deepEqual(names(sortRowsByText(rows, { key: "streak", dir: "asc" })), [
      "Los Angeles Rams",
      "Seattle Seahawks",
      "Expansion Club",
    ]);
  });
});

describe("nextSort", () => {
  test("a new column starts descending, so the leaders show first", () => {
    // The old toggle started ascending, so the first click on "Points"
    // showed the lowest scorers in the league.
    assert.deepEqual(nextSort({ key: "winPct", dir: "desc" }, "points"), {
      key: "points",
      dir: "desc",
    });
  });

  test("clicking the active column reverses it", () => {
    assert.deepEqual(nextSort({ key: "points", dir: "desc" }, "points"), {
      key: "points",
      dir: "asc",
    });
    assert.deepEqual(nextSort({ key: "points", dir: "asc" }, "points"), {
      key: "points",
      dir: "desc",
    });
  });
});

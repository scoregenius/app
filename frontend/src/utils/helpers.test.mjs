// frontend/src/utils/helpers.test.mjs
//
// Covers the presentation rules in docs/design_system.md §8.1 — the odds
// fallbacks, pitcher normalisation and team abbreviations.
//
//   npm run test:utils
//
// Uses node:test and Node's native type stripping, so there is no test
// framework dependency. Requires Node 22+.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  marketSegments,
  fmtAmerican,
  fmtSigned,
  leanFraction,
  isPresent,
} from "./market.ts";
import { normalizeHand, cleanPitcher, formatPitcher } from "./pitchers.ts";
import { abbr, isLeagueTeam, TEAM_ABBR } from "./team_abbr.ts";

const strip = (segments) => segments.map((s) => `${s.key} ${s.value}`).join(" · ");

describe("marketSegments", () => {
  test("renders a full line", () => {
    assert.equal(
      strip(marketSegments({ moneylineAway: 114, moneylineHome: -119, spreadLine: -1.5, totalLine: 8 })),
      "ML +114 / −119 · SPR −1.5 · O/U 8"
    );
  });

  test("closes up when the spread is missing", () => {
    assert.equal(
      strip(marketSegments({ moneylineAway: 114, moneylineHome: -119, spreadLine: null, totalLine: 8 })),
      "ML +114 / −119 · O/U 8"
    );
  });

  test("keeps spread and total when the moneyline is missing", () => {
    assert.equal(
      strip(marketSegments({ moneylineAway: null, moneylineHome: null, spreadLine: -1.5, totalLine: 8 })),
      "SPR −1.5 · O/U 8"
    );
  });

  test("drops the whole pair when only one moneyline side is present", () => {
    assert.equal(
      strip(marketSegments({ moneylineAway: 114, moneylineHome: null, totalLine: 8 })),
      "O/U 8"
    );
  });

  test("treats the preseason all-zero payload as absent", () => {
    // The NFL preseason feed sends 0 rather than omitting fields. This is the
    // case that currently renders as "Spread: 0 / O/U: 0".
    assert.equal(
      strip(marketSegments({ moneylineAway: 0, moneylineHome: 0, spreadLine: 0, totalLine: 0 })),
      ""
    );
  });

  test("keeps a genuine pick'em, where a zero spread has a real total beside it", () => {
    assert.equal(
      strip(marketSegments({ moneylineAway: -110, moneylineHome: -110, spreadLine: 0, totalLine: 44.5 })),
      "ML −110 / −110 · SPR PK · O/U 44.5"
    );
  });

  test("returns nothing when everything is absent", () => {
    assert.deepEqual(marketSegments({}), []);
  });
});

describe("odds formatting", () => {
  test("signs american odds", () => {
    assert.equal(fmtAmerican(114), "+114");
    assert.equal(fmtAmerican("+265"), "+265");
  });

  test("uses a real minus sign, not a hyphen", () => {
    assert.equal(fmtAmerican(-119), "−119"); // U+2212
    assert.equal(fmtSigned(-7.5), "−7.5");
  });

  test("treats zero odds as absent", () => {
    assert.equal(fmtAmerican(0), "");
  });

  test("renders a zero spread as pick'em", () => {
    assert.equal(fmtSigned(0), "PK");
  });

  test("isPresent rejects zero, empty and non-numeric", () => {
    assert.equal(isPresent(0), false);
    assert.equal(isPresent(""), false);
    assert.equal(isPresent(null), false);
    assert.equal(isPresent("abc"), false);
    assert.equal(isPresent(-119), true);
  });
});

describe("leanFraction", () => {
  test("scales per sport", () => {
    assert.equal(+leanFraction(0.8, "MLB").toFixed(4), 0.1333);
    assert.equal(+leanFraction(10.4, "NFL").toFixed(4), 0.3714);
  });

  test("clamps at half width and ignores sign", () => {
    assert.equal(leanFraction(999, "NBA"), 0.5);
    assert.equal(leanFraction(-3, "MLB"), 0.5);
  });

  test("is zero for a tie", () => {
    assert.equal(leanFraction(0, "MLB"), 0);
  });
});

describe("pitchers", () => {
  test("normalises the handedness spellings feeds actually send", () => {
    for (const v of ["R", "rh", "RHP", "Right", "Right-Handed"]) {
      assert.equal(normalizeHand(v), "R", `expected R from ${v}`);
    }
    for (const v of ["L", "lhp", "left"]) {
      assert.equal(normalizeHand(v), "L", `expected L from ${v}`);
    }
  });

  test("drops handedness it does not recognise rather than printing it raw", () => {
    assert.equal(normalizeHand("Switch"), null);
    assert.equal(normalizeHand(null), null);
  });

  test("treats TBD and whitespace as no pitcher", () => {
    assert.equal(cleanPitcher("TBD"), null);
    assert.equal(cleanPitcher("   "), null);
    assert.equal(cleanPitcher("  Tarik Skubal "), "Tarik Skubal");
  });

  test("formats with handedness only when known", () => {
    assert.equal(formatPitcher("Tarik Skubal", "L"), "Tarik Skubal (L)");
    assert.equal(formatPitcher("Tarik Skubal", null), "Tarik Skubal");
    assert.equal(formatPitcher("TBD", "L"), null);
  });
});

describe("team abbreviations", () => {
  test("maps each league", () => {
    assert.equal(abbr("Cleveland Guardians"), "CLE");
    assert.equal(abbr("Green Bay Packers"), "GB");
    assert.equal(abbr("Golden State Warriors"), "GSW");
  });

  test("distinguishes same-city clubs, which initials cannot", () => {
    assert.equal(abbr("New York Yankees"), "NYY");
    assert.equal(abbr("New York Mets"), "NYM");
    assert.equal(abbr("Los Angeles Lakers"), "LAL");
    assert.equal(abbr("Los Angeles Clippers"), "LAC");
  });

  test("survives punctuation and casing variants between feeds", () => {
    // The schedule feed renders "St.Louis Cardinals"; the stadium file uses
    // "St. Louis Cardinals". Both must resolve.
    assert.equal(abbr("St.Louis Cardinals"), "STL");
    assert.equal(abbr("St. Louis Cardinals"), "STL");
    assert.equal(abbr("cleveland guardians"), "CLE");
  });

  test("handles the Athletics relocation spellings", () => {
    assert.equal(abbr("Athletics"), "ATH");
    assert.equal(abbr("Oakland Athletics"), "ATH");
  });

  test("falls back rather than collapsing on unknown sides", () => {
    assert.equal(abbr("EuroLeague Select"), "ES");
    assert.equal(abbr("National League"), "NL");
    assert.equal(abbr(""), "—");
    assert.equal(abbr(null), "—");
  });

  test("covers all 92 clubs", () => {
    // 30 MLB + 32 NFL + 30 NBA, plus one alias for the relocated Athletics.
    assert.equal(Object.keys(TEAM_ABBR).length, 93);
  });
});

describe("isLeagueTeam — keeping aggregates out of league tables", () => {
  // The Stats screen filters team rows through this. A false negative
  // deletes a real club from the rankings, so the cases that matter most
  // are the ones that must pass, not the ones that must fail.

  test("rejects the aggregate rows MLB ships during a live season", () => {
    // The 2026 advanced feed carries both, so a 30-club league rendered 32.
    assert.equal(isLeagueTeam("American League"), false);
    assert.equal(isLeagueTeam("National League"), false);
  });

  test("rejects exhibition and national sides", () => {
    assert.equal(isLeagueTeam("Team World"), false);
    assert.equal(isLeagueTeam("Team USA"), false);
    assert.equal(isLeagueTeam("EuroLeague Select"), false);
  });

  test("accepts a club from each league", () => {
    assert.equal(isLeagueTeam("Cleveland Guardians"), true);
    assert.equal(isLeagueTeam("Green Bay Packers"), true);
    assert.equal(isLeagueTeam("Golden State Warriors"), true);
  });

  test("accepts both Athletics spellings — the relocation must not delete a club", () => {
    // The 2026 feed says "Athletics"; historical rows say "Oakland Athletics".
    assert.equal(isLeagueTeam("Athletics"), true);
    assert.equal(isLeagueTeam("Oakland Athletics"), true);
  });

  test("survives the punctuation variants the feeds disagree on", () => {
    assert.equal(isLeagueTeam("St.Louis Cardinals"), true);
    assert.equal(isLeagueTeam("St. Louis Cardinals"), true);
    assert.equal(isLeagueTeam("cleveland guardians"), true);
  });

  test("treats absence as not-a-team rather than throwing", () => {
    assert.equal(isLeagueTeam(""), false);
    assert.equal(isLeagueTeam("   "), false);
    assert.equal(isLeagueTeam(null), false);
    assert.equal(isLeagueTeam(undefined), false);
  });

  test("every name in the map is accepted by its own predicate", () => {
    // Guards the normaliser against a change that would silently start
    // rejecting clubs — the failure mode that costs a row rather than a chip.
    for (const name of Object.keys(TEAM_ABBR)) {
      assert.equal(isLeagueTeam(name), true, `${name} was rejected`);
    }
  });
});

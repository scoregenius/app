// frontend/src/game.test.mjs
//
// Pins the rule that decides what drops off today's slate.
//
//   npm run test:utils

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { isGameStale } from "./game.ts";

const HOUR = 60 * 60 * 1000;

/** A fixed "now" so these never depend on when they run. */
const NOW = new Date("2026-08-14T23:00:00Z").getTime();

/** Build a game starting `hoursAgo` before NOW, on the same local day. */
const game = (hoursAgo, { result = false } = {}) => {
  const start = new Date(NOW - hoursAgo * HOUR);
  return {
    gameTimeUTC: start.toISOString(),
    game_date: start.toISOString().slice(0, 10),
    home_final_score: result ? 4 : null,
    away_final_score: result ? 2 : null,
  };
};

describe("isGameStale — today's slate", () => {
  test("keeps a game that has not started", () => {
    assert.equal(isGameStale(game(-2), NOW), false);
  });

  test("keeps a game inside the 3.5h window", () => {
    assert.equal(isGameStale(game(1), NOW), false);
    assert.equal(isGameStale(game(3.4), NOW), false);
  });

  test("drops a game past the window with no reported result", () => {
    // The feed often never posts one — this is the placeholder case.
    assert.equal(isGameStale(game(4), NOW), true);
    assert.equal(isGameStale(game(11.5), NOW), true);
  });

  test("keeps a finished game once its result is reported", () => {
    // The point of the rule: the card renders it as Final rather than
    // vanishing, so "how did tonight go?" has an answer.
    assert.equal(isGameStale(game(4, { result: true }), NOW), false);
    assert.equal(isGameStale(game(11.5, { result: true }), NOW), false);
  });

  test("a result keeps a game regardless of how long ago it started", () => {
    assert.equal(isGameStale(game(23, { result: true }), NOW), false);
  });
});

describe("isGameStale — other days and bad data", () => {
  test("never prunes a game from another day", () => {
    const yesterday = {
      gameTimeUTC: new Date(NOW - 30 * HOUR).toISOString(),
      game_date: "2026-08-13",
      home_final_score: null,
      away_final_score: null,
    };
    assert.equal(isGameStale(yesterday, NOW), false);
  });

  test("keeps a game whose start time cannot be parsed", () => {
    assert.equal(
      isGameStale({ gameTimeUTC: null, game_date: "2026-08-14" }, NOW),
      false
    );
    assert.equal(
      isGameStale({ gameTimeUTC: "not a date", game_date: "2026-08-14" }, NOW),
      false
    );
  });

  test("treats a half-reported score as no result", () => {
    // One side populated is not a usable final.
    const half = { ...game(5), home_final_score: 4, away_final_score: null };
    assert.equal(isGameStale(half, NOW), true);
  });

  test("counts a nil-nil result as a result", () => {
    // 0 is falsy; the check must be against null, not truthiness.
    const nilNil = { ...game(5), home_final_score: 0, away_final_score: 0 };
    assert.equal(isGameStale(nilNil, NOW), false);
  });
});

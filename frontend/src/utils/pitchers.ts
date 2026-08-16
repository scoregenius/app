// frontend/src/utils/pitchers.ts
//
// MLB probable-pitcher presentation. Pure — no React, no fetching.
// Rules: docs/design_system.md §8.1 "Fallback — MLB pitchers".

/**
 * Feeds send R, RH, RHP, Right and "Right-Handed" for the same thing, and
 * null when they don't know. Anything unrecognised is dropped rather than
 * printed raw, so a card never shows "(Right-Handed Pitcher)".
 */
const HAND: Record<string, "R" | "L"> = {
  r: "R",
  rh: "R",
  rhp: "R",
  right: "R",
  righthanded: "R",
  l: "L",
  lh: "L",
  lhp: "L",
  left: "L",
  lefthanded: "L",
};

export const normalizeHand = (raw?: string | null): "R" | "L" | null => {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return HAND[key] ?? null;
};

/**
 * Probables are announced on a rolling basis, so a slate routinely mixes
 * known and unknown starters. Whitespace and the literal string "TBD" both
 * mean the same thing as an empty field.
 *
 * Returns the trimmed name, or null when there isn't one.
 */
export const cleanPitcher = (name?: string | null): string | null => {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.toUpperCase() === "TBD") return null;
  return trimmed;
};

/** "Tarik Skubal (L)", or "Tarik Skubal" when handedness is unknown. */
export const formatPitcher = (
  name?: string | null,
  hand?: string | null
): string | null => {
  const cleaned = cleanPitcher(name);
  if (!cleaned) return null;
  const h = normalizeHand(hand);
  return h ? `${cleaned} (${h})` : cleaned;
};

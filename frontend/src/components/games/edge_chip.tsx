// frontend/src/components/games/edge_chip.tsx
import React from "react";
import clsx from "clsx";
import type { EdgeTier } from "@/types";

export interface EdgeChipProps {
  tier: EdgeTier;
  /** Short code for the side the edge favours — a fan thinks in teams. */
  teamAbbr: string;
}

const TIER_LABEL: Record<EdgeTier, string> = {
  HIGH: "High",
  MED: "Medium",
  LOW: "Low",
};

const TIER_CLASS: Record<EdgeTier, string> = {
  HIGH: "gc-edge--high",
  MED: "gc-edge--med",
  LOW: "gc-edge--low",
};

/**
 * The card's loudest signal, because it is the rarest — roughly two cards in
 * fifteen carry one. See docs/design_system.md §8.1.
 *
 * The tier ladder is carried by background, border and glow rather than by
 * three different greens, and the tier is also named in the text, so the
 * meaning never rests on colour alone.
 *
 * Deliberately not interactive, and deliberately without the tooltip the old
 * badge carried: the model and market percentages behind it are tiering
 * heuristics, not calibrated probabilities, and are not shown anywhere
 * (§4.2).
 */
const EdgeChip: React.FC<EdgeChipProps> = ({ tier, teamAbbr }) => (
  <span className={clsx("gc-edge", TIER_CLASS[tier])}>
    {tier === "HIGH" && <span className="gc-edge-dot" aria-hidden="true" />}
    {`${TIER_LABEL[tier]} edge · ${teamAbbr}`}
  </span>
);

export default EdgeChip;

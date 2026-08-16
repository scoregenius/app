// frontend/src/components/games/market_strip.tsx
import React from "react";
import clsx from "clsx";
import type { MarketSegment } from "@/utils/market";

export interface MarketStripProps {
  /** From utils/market.marketSegments — already filtered to present values. */
  segments: MarketSegment[];
  /**
   * Shown when nothing is present. "Odds not yet posted" before a game
   * starts; empty once it has, where "not yet" would be untrue.
   */
  emptyLabel?: string;
}

/**
 * Market data as one monospaced line. Reference, not headline — deliberately
 * quieter than the model's output above it.
 *
 * Missing values are omitted rather than rendered as placeholders, so the
 * strip simply gets shorter. See docs/design_system.md §7.3.
 */
const MarketStrip: React.FC<MarketStripProps> = ({ segments, emptyLabel }) => {
  if (segments.length === 0) {
    return (
      <span className={clsx("gc-mkt", emptyLabel && "gc-mkt--none")}>
        {emptyLabel ?? ""}
      </span>
    );
  }

  return (
    <span className="gc-mkt">
      {segments.map((segment, i) => (
        <React.Fragment key={segment.key}>
          {i > 0 && (
            <span className="gc-mkt-sep" aria-hidden="true">
              ·
            </span>
          )}
          <span className="gc-mkt-key">{segment.key}</span> {segment.value}
        </React.Fragment>
      ))}
    </span>
  );
};

export default MarketStrip;

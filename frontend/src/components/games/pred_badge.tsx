// frontend/src/components/games/pred_badge.tsx
import React from "react";

interface PredBadgeProps {
  away: number;
  home: number;
}

const PredBadge: React.FC<PredBadgeProps> = ({ away, home }) => {
  const label = `${away.toFixed(1)} to ${home.toFixed(1)}, predicted score`;

  return (
    <span className="pred-badge" aria-label={label}>
      <span className="score">
        {away.toFixed(1)} – {home.toFixed(1)}
      </span>
      <span className="label">predicted score</span>
    </span>
  );
};

export default PredBadge;

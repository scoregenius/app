// frontend/src/components/games/weather_badge.tsx
import React, { CSSProperties } from "react";
import clsx from "clsx";
import { Home } from "lucide-react";
import type { WeatherData } from "@/types";

export interface WeatherBadgeProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  isError: boolean;
  data?: WeatherData;
  isIndoor?: boolean;
}

/**
 * Conditions at the venue. Rules in docs/design_system.md §8.1.
 *
 * Four outcomes, and the order they are checked in matters: indoor is
 * decided before failure, so a covered venue whose request failed still
 * says "Roof closed" rather than vanishing.
 */
const WeatherBadge: React.FC<WeatherBadgeProps> = ({
  className,
  isLoading,
  isError,
  data,
  isIndoor,
  onClick,
  ...rest
}) => {
  const base = clsx("gc-chip", className);

  /* Covered venue. A statement, not a measurement — and not a button,
   * because there is no weather detail to open. */
  if (isIndoor) {
    return (
      <span className={clsx(base, "gc-chip--static")} {...rest}>
        <Home size={13} strokeWidth={1.8} aria-hidden="true" />
        Roof closed
      </span>
    );
  }

  /* Outdoor, request in flight. A skeleton at chip dimensions so the row
   * does not reflow when it resolves. Never the word "Loading". */
  if (isLoading) {
    return (
      <span
        className={clsx(base, "gc-chip--skeleton")}
        aria-hidden="true"
        {...rest}
      />
    );
  }

  /* Failed, or the service reported it has no venue for this fixture.
   * Absence is silent: the chip is omitted and the row closes up. The old
   * behaviour was a disabled chip reading "N/A", which told the reader
   * nothing and was actively wrong for a dome. */
  if (isError || !data || data.unavailable) return null;

  const { temperature, windSpeed, ballparkWindAngle } = data;
  if (temperature == null) return null;

  const angle = typeof ballparkWindAngle === "number" ? ballparkWindAngle : 0;
  const arrowStyle: CSSProperties = { transform: `rotate(${angle}deg)` };

  return (
    <button type="button" className={base} onClick={onClick} {...rest}>
      <span className="inline-block leading-none" style={arrowStyle} aria-hidden="true">
        ↑
      </span>
      <span className="whitespace-nowrap">
        {temperature}°F · {windSpeed}mph
      </span>
    </button>
  );
};

export default WeatherBadge;

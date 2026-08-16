// frontend/src/components/games/weather_modal.tsx

import React from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Cloudy,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import Modal from "@/components/ui/modal";
import EmptyState from "@/components/ui/empty_state";
import type { WeatherData } from "@/types";

export interface WeatherModalProps {
  onClose: () => void;
  weatherData: WeatherData | undefined;
}

/**
 * Conditions at the venue. See docs/design_system.md §6.7 and §8.1.
 *
 * The remote `openweathermap.org` PNG this used to load is replaced by a
 * lucide glyph mapped from the same icon code: one fewer external
 * request per open, it inherits currentColor so it themes, and it
 * survives a strict CSP. The map is exhaustive over OpenWeather's
 * documented set.
 */
const WEATHER_GLYPH: Record<string, LucideIcon> = {
  "01d": Sun,
  "01n": Moon,
  "02d": CloudSun,
  "02n": CloudMoon,
  "03d": Cloud,
  "03n": Cloud,
  "04d": Cloudy,
  "04n": Cloudy,
  "09d": CloudDrizzle,
  "09n": CloudDrizzle,
  "10d": CloudRain,
  "10n": CloudRain,
  "11d": CloudLightning,
  "11n": CloudLightning,
  "13d": CloudSnow,
  "13n": CloudSnow,
  "50d": CloudFog,
  "50n": CloudFog,
};

/**
 * Wind relative to the venue's orientation, not to compass north — the
 * service resolves it against the stadium's bearing, which is the
 * reading a fan actually wants and the one figure here they cannot get
 * from a generic forecast.
 */
const WindDial: React.FC<{ angle: number; label: string }> = ({
  angle,
  label,
}) => (
  <svg
    className="sgm-wx-dial"
    width="46"
    height="46"
    viewBox="0 0 48 48"
    fill="none"
    role="img"
    aria-label={label}
  >
    <circle cx="24" cy="24" r="20" stroke="var(--line)" strokeWidth="1.5" />
    <circle cx="24" cy="24" r="1.6" fill="var(--ink-3)" />
    <g transform={`rotate(${angle} 24 24)`}>
      <path
        d="M24 8 L24 34"
        stroke="var(--ink-2)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19 13 L24 7 L29 13"
        stroke="var(--ink)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const WeatherModal: React.FC<WeatherModalProps> = ({
  onClose,
  weatherData,
}) => {
  /* `stadium` is deliberately not used for the title. The service
   * returns it on the no-venue, indoor and upstream-error paths but
   * *omits* it from the successful outdoor response — the only one this
   * modal opens on — so it is never present when it would be shown. */
  const city = weatherData?.city?.trim();
  const title = city || "Conditions";

  const temperature = weatherData?.temperature;
  const hasReading =
    !!weatherData && !weatherData.unavailable && temperature != null;

  /* The service calls OpenWeather's `weather` endpoint, which reports
   * conditions now rather than a forecast for kickoff. The subtitle says
   * so, because a reader would otherwise reasonably assume the latter. */
  return (
    <Modal
      onClose={onClose}
      title={title}
      subtitle={hasReading ? "Current conditions" : undefined}
    >
      {!hasReading ? (
        <EmptyState
          icon={Cloud}
          title="Conditions unavailable"
          description="No reading for this venue right now."
        />
      ) : (
        <>
          <div className="sgm-wx-hero">
            {(() => {
              const Glyph =
                (weatherData.icon && WEATHER_GLYPH[weatherData.icon]) || Cloud;
              return (
                <Glyph
                  className="sgm-wx-glyph"
                  size={42}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
              );
            })()}
            <div>
              <div className="sgm-wx-temp">{temperature}°F</div>
              {weatherData.description && (
                <div className="sgm-wx-desc">{weatherData.description}</div>
              )}
            </div>
          </div>

          <div className="sgm-wx-grid">
            {weatherData.feels_like != null && (
              <div className="sgm-wx-cell">
                <div className="sgm-wx-k">Feels like</div>
                <div className="sgm-wx-v">{weatherData.feels_like}°F</div>
              </div>
            )}
            {weatherData.humidity != null && (
              <div className="sgm-wx-cell">
                <div className="sgm-wx-k">Humidity</div>
                <div className="sgm-wx-v">{weatherData.humidity}%</div>
              </div>
            )}
          </div>

          {weatherData.windSpeed != null && (
            <div className="sgm-wx-wind">
              <WindDial
                angle={weatherData.ballparkWindAngle ?? 0}
                label={weatherData.ballparkWindText || "Wind direction"}
              />
              <div>
                <div className="sgm-wx-k">Wind</div>
                <div className="sgm-wx-v">{weatherData.windSpeed} mph</div>
                {weatherData.ballparkWindText &&
                  weatherData.ballparkWindText !== "N/A" && (
                    <div className="sgm-wx-rel">
                      {weatherData.ballparkWindText}
                    </div>
                  )}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default WeatherModal;

// frontend/src/components/games/charts/radar_chart_component.tsx

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "@/contexts/theme_context";
import { RadarChartData } from "@/types";
import { chartPalette, type ChartPalette } from "@/utils/chart_theme";
import { hasPlottableData } from "@/utils/chart_data";

interface RadarChartComponentProps {
  data?: RadarChartData[];
}

interface RadarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: Record<string, number> }>;
  label?: string;
  palette: ChartPalette;
}

/**
 * Rendered rather than left to Recharts' default because the radar plots
 * an index, and the index on its own is not the number a reader wants —
 * the raw figure behind it is.
 *
 * The wrapper previously carried `border-border-muted`, which is not a
 * Tailwind key in this project, so it had no border at all.
 */
const RadarTooltip: React.FC<RadarTooltipProps> = ({
  active,
  payload,
  label,
  palette,
}) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  const rows = [
    { name: "Home", raw: p.home_raw, idx: p.home_idx, color: palette.series1 },
    { name: "Away", raw: p.away_raw, idx: p.away_idx, color: palette.series2 },
  ];

  return (
    <div
      className="rounded-lg p-2 text-xs"
      style={{
        backgroundColor: palette.surface,
        border: `1px solid ${palette.grid}`,
        color: palette.ink,
      }}
    >
      <div className="mb-1 font-medium">{label}</div>
      <div className="flex flex-col gap-1" style={{ color: palette.axis }}>
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-sm"
              style={{ background: r.color }}
            />
            {r.name}
            <span className="font-medium" style={{ color: palette.ink }}>
              {r.raw}
            </span>
            {typeof r.idx === "number" && (
              <span className="opacity-70">(idx {r.idx.toFixed(1)})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Colours come from utils/chart_theme. See docs/design_system.md §6.11.
 *
 * Renders nothing when it has nothing to plot; the modal omits the
 * section rather than drawing an empty web.
 */
const RadarChartComponent: React.FC<RadarChartComponentProps> = ({
  data = [],
}) => {
  const { theme } = useTheme();
  const c = chartPalette(theme === "dark" ? "dark" : "light");

  if (!hasPlottableData(data)) return null;

  return (
    <div className="h-[248px] w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%">
          <PolarGrid stroke={c.grid} radialLines={false} />
          <PolarAngleAxis
            dataKey="metric"
            stroke={c.axis}
            tick={{ fill: c.ink, fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tickCount={5}
            tick={{ fill: c.axis, fontSize: 8 }}
            axisLine={false}
          />
          <Radar
            name="Home"
            dataKey="home_idx"
            stroke={c.series1}
            strokeWidth={2}
            fill={c.series1}
            fillOpacity={0.22}
            dot={false}
            isAnimationActive={false}
          />
          <Radar
            name="Away"
            dataKey="away_idx"
            stroke={c.series2}
            strokeWidth={2}
            fill={c.series2}
            fillOpacity={0.22}
            dot={false}
            isAnimationActive={false}
          />
          <Tooltip content={<RadarTooltip palette={c} />} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ color: c.axis, fontSize: 11 }}
            iconSize={9}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartComponent;

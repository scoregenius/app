// frontend/src/components/games/charts/bar_chart_component.tsx

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "@/contexts/theme_context";
import { Sport, BarChartData } from "@/types";
import { chartPalette } from "@/utils/chart_theme";
import { hasPlottableData } from "@/utils/chart_data";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

interface BarChartComponentProps {
  data?: BarChartData[];
  /**
   * Unused — the chart's colours no longer vary by sport. Kept on the
   * interface only so the existing snapshot call sites stay valid until
   * they are rewritten; remove it with them.
   */
  sport?: Sport;
}

/**
 * Colours come from utils/chart_theme rather than from literals here.
 * See that file for why they are values rather than var() references,
 * and docs/design_system.md §6.11 for the palette itself.
 *
 * Renders nothing when it has nothing to plot. The modal omits the whole
 * section in that case rather than drawing a heading and a legend over
 * an empty axis frame, which is what shipped before — absence is silent
 * (§3, principle 3).
 */
const BarChartComponent: React.FC<BarChartComponentProps> = ({ data = [] }) => {
  const { theme } = useTheme();
  const c = chartPalette(theme === "dark" ? "dark" : "light");

  if (!hasPlottableData(data)) return null;

  const isMultiSeries = data.some(
    (d: BarChartData) => d.Home !== undefined && d.Away !== undefined
  );

  return (
    <div className="h-[220px] w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -22, bottom: 0 }}
          barCategoryGap="22%"
        >
          {/* Horizontal rules only. Verticals add a second grid the eye
              has to filter out of a four-category chart. */}
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="category"
            stroke={c.axis}
            tick={{ fill: c.axis, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={c.axis}
            tick={{ fill: c.axis, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: c.axis, fillOpacity: 0.08 }}
            contentStyle={{
              backgroundColor: c.surface,
              border: `1px solid ${c.grid}`,
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: c.ink }}
            itemStyle={{ color: c.axis }}
            formatter={(value: ValueType, name: NameType) =>
              typeof value === "number" ? [value.toFixed(1), name] : [value, name]
            }
          />
          {isMultiSeries ? (
            <>
              <Legend wrapperStyle={{ color: c.axis, fontSize: 11 }} iconSize={9} />
              {/* Home first, matching the order all three snapshot
                  generators write their payloads in. */}
              <Bar
                dataKey="Home"
                fill={c.series1}
                name="Home"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="Away"
                fill={c.series2}
                name="Away"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </>
          ) : (
            <Bar
              dataKey="value"
              fill={c.series1}
              name="Points"
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;

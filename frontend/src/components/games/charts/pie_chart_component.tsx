// frontend/src/components/games/charts/pie_chart_component.tsx

import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { useTheme } from "@/contexts/theme_context";
import { PieChartDataItem, Sport } from "@/types";
import { chartPalette, seriesColor, type ChartPalette } from "@/utils/chart_theme";
import { hasPieData } from "@/utils/chart_data";

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string | number; value?: string | number }>;
  palette: ChartPalette;
}

const PieTooltip: React.FC<PieTooltipProps> = ({ active, payload, palette }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];

  return (
    <div
      className="rounded-lg p-2 text-xs"
      style={{
        backgroundColor: palette.surface,
        border: `1px solid ${palette.grid}`,
        color: palette.ink,
        maxWidth: "240px",
        whiteSpace: "normal",
      }}
    >
      {/* Every generator bakes the rounded figure into the category
          string already, so repeating the raw value beside it prints the
          same number twice at different precisions. */}
      {name ?? value}
    </div>
  );
};

interface PieChartComponentProps {
  data?: PieChartDataItem[];
  /**
   * Unused — the tooltip no longer varies by sport. Kept on the
   * interface only so the existing snapshot call sites stay valid until
   * they are rewritten; remove it with them.
   */
  sport?: Sport;
}

/**
 * Colours come from utils/chart_theme, assigned by series rather than
 * read from the payload. See docs/design_system.md §6.11.
 *
 * The backend writes a `color` into every slice — and MLB assigns the
 * two the opposite way round from NFL and NBA, so honouring it makes
 * "Home" a different colour depending on the sport. The field is
 * deliberately ignored.
 *
 * Renders nothing when there is nothing to plot, which now includes the
 * all-zero case: a two-slice pie of 0.0 and 0.0 drew no sectors at all
 * but still printed a heading and a legend reading "Home (0.0)".
 */
const PieChartComponent: React.FC<PieChartComponentProps> = ({ data = [] }) => {
  const { theme } = useTheme();
  const c = chartPalette(theme === "dark" ? "dark" : "light");

  if (!hasPieData(data)) return null;

  const chartData = data.map((item, index) => ({
    ...item,
    color: seriesColor(item.category, index, c),
  }));

  return (
    <div className="flex flex-col items-center">
      <PieChart width={150} height={150}>
        <Tooltip
          cursor={{ fill: c.axis, fillOpacity: 0.08 }}
          content={<PieTooltip palette={c} />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={70}
          innerRadius={0}
          labelLine={false}
          label={false}
          /* A hairline in the surface colour separates adjacent slices,
             so two similar values do not read as one wedge. */
          stroke={c.surface}
          strokeWidth={2}
          /* Recharts animates in JavaScript, so unlike the CSS in this
             project it does not honour prefers-reduced-motion — §5.6
             requires that it does. The modal's own entrance already
             confirms the change; a second, longer sweep on each chart
             is decoration. Off on every series for both reasons. */
          isAnimationActive={false}
        >
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.category}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>

      {/* Direct labels rather than colour alone — §9, colour independence. */}
      <div className="mt-2 flex w-full flex-col items-center gap-1 text-xs">
        {chartData.map((entry) => (
          <div key={entry.category} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span style={{ color: c.axis }}>{entry.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChartComponent;

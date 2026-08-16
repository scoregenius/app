// frontend/src/utils/chart_theme.ts

/**
 * Chart colours for the snapshot modal. See docs/design_system.md §5.1
 * and §6.11.
 *
 * These are plain values rather than `var(--token)` because Recharts
 * writes colours as SVG *presentation attributes* (`fill="…"`), and a
 * CSS custom property is not resolved in that position. Reading the
 * computed value at render time was the alternative and was rejected:
 * the theme context sets the `.dark` class in an effect, so a render
 * triggered by a theme flip can run before the class lands and would
 * paint the chart in the theme it just left.
 *
 * The neutrals therefore duplicate the tokens in `index.css`, which is a
 * real hazard — the same one `venues.ts` carries against
 * `stadium_data.json` (§4.4). It is closed the same way: the two are
 * asserted equal by `chart_theme.test.mjs`, which parses the stylesheet.
 * If you change a token, that test fails until you change it here too.
 */

export type ChartTheme = "light" | "dark";

export interface ChartPalette {
  /** Home series. Categorical slot 1. */
  series1: string;
  /** Away series. Categorical slot 2. */
  series2: string;
  /** Axis labels and tick text. */
  axis: string;
  /** Grid lines and chart borders. */
  grid: string;
  /** Tooltip and surface background. */
  surface: string;
  /** Primary text on that surface. */
  ink: string;
}

/**
 * Series colours are the validated two-slot categorical pair, not the
 * brand palette. Green is deliberately absent: in this system green
 * means the model's output (§5.1), so painting "Home" green implies the
 * model favours the home side, which is a claim the chart is not making.
 * Orange is likewise reserved for the live state.
 *
 * Measured on both app surfaces with the categorical validator — worst
 * colour-vision separation ΔE 13.4 light / 15.9 dark against a floor of
 * 8, worst normal-vision separation ΔE 27.0 / 26.5 against a floor of
 * 15, and both slots clear 3:1 against the surface in both themes.
 * Blue with violet fails the dark surface at ΔE 1.9, and aqua collides
 * with brand green, so neither is a substitute.
 */
const SERIES_1_LIGHT = "#2a78d6";
const SERIES_1_DARK = "#3987e5";
/** Clears 3:1 on both surfaces, so it does not vary by theme. */
const SERIES_2 = "#d55181";

export const chartPalette = (theme: ChartTheme): ChartPalette =>
  theme === "dark"
    ? {
        series1: SERIES_1_DARK,
        series2: SERIES_2,
        axis: "#8fa0ae", // --ink-2
        grid: "#232e38", // --line
        surface: "#151c24", // --panel
        ink: "#eaf0f4", // --ink
      }
    : {
        series1: SERIES_1_LIGHT,
        series2: SERIES_2,
        axis: "#56655d", // --ink-2
        grid: "#dfe7e3", // --line
        surface: "#ffffff", // --panel
        ink: "#0d1117", // --ink
      };

/**
 * Which series slot a label belongs to.
 *
 * Keyed on the label rather than the array index because the backend
 * writes its own `color` into `pie_chart_data` and assigns the two the
 * *opposite* way round on MLB from NFL and NBA — so honouring the
 * payload makes "Home" a different colour depending on the sport. Every
 * category string across all three generators is prefixed "Home" or
 * "Away"; anything unrecognised falls back to the index so a new shape
 * still gets distinct colours rather than one repeated one.
 */
export const seriesColor = (
  label: string | undefined,
  index: number,
  palette: ChartPalette
): string => {
  const name = (label ?? "").trim().toLowerCase();
  if (name.startsWith("home")) return palette.series1;
  if (name.startsWith("away")) return palette.series2;
  return index % 2 === 0 ? palette.series1 : palette.series2;
};

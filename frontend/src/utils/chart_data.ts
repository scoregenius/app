// frontend/src/utils/chart_data.ts

/**
 * Whether a chart has anything worth drawing.
 *
 * Shared by the chart components, which return null, and by the
 * snapshot modal, which omits the surrounding heading. Both have to
 * agree or the modal prints a heading over nothing — which is the state
 * that shipped: an NFL preseason snapshot drew "Scoring Averages" above
 * a pie with zero sectors, and "Key Offensive Metrics (Per Game)" above
 * an empty axis frame.
 *
 * Absence is silent (docs/design_system.md §3, principle 3).
 */

/** Present and non-zero. A row of zeros is a shape, not a measurement. */
const isMeaningful = (v: unknown): boolean => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0;
};

/**
 * True when any numeric field on any row carries a value. Reads every
 * numeric property rather than named ones, so the three sports' payload
 * shapes — Home/Away, a bare `value`, home_idx/away_idx — are all
 * covered without listing them.
 */
export const hasPlottableData = (
  /* Deliberately `unknown` rather than Record<string, unknown>: the
   * payload types are interfaces, and an interface has no index
   * signature, so it does not satisfy that constraint. */
  rows: readonly unknown[] | null | undefined
): boolean => {
  if (!Array.isArray(rows) || rows.length === 0) return false;

  return rows.some((row) =>
    Object.entries((row ?? {}) as Record<string, unknown>).some(
      ([key, value]) =>
        key !== "color" && typeof value !== "string" && isMeaningful(value)
    )
  );
};

/**
 * The NBA generator emits this literal rather than omitting the block
 * when it has no distribution to report.
 */
export const PIE_PLACEHOLDER = "Pregame Distribution N/A";

export const hasPieData = (
  rows:
    | ReadonlyArray<{ category?: string; value?: number }>
    | null
    | undefined
): boolean => {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  if (rows.length === 1 && rows[0]?.category === PIE_PLACEHOLDER) return false;
  /* A pie is drawn from magnitudes, so it needs a positive total rather
   * than merely a non-zero field — two slices of 0.0 render no sectors
   * at all but still produced a legend reading "Home (0.0)". */
  const total = rows.reduce((sum, r) => {
    const n = Number(r?.value);
    return sum + (Number.isFinite(n) ? Math.abs(n) : 0);
  }, 0);
  return total > 0;
};

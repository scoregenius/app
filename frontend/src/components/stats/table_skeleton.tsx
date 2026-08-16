// frontend/src/components/stats/table_skeleton.tsx
import React from "react";

export interface TableSkeletonProps {
  /** How many rows the real table is about to show. */
  rows: number;
  /** How many numeric columns follow the name. */
  numericColumns: number;
}

/**
 * The loading state for the Stats table — see docs/design_system.md §6.8.
 *
 * Mirrors the row anatomy rather than standing in for it: a rank gutter,
 * an elastic name and one bar per numeric column, at the real 33px row
 * height, so nothing reflows when the data lands. The screen used to
 * show generic 32px bars in a padded box, which changed height and
 * column rhythm the moment rows arrived.
 *
 * Still not built on `SkeletonBox`, but no longer for the reason recorded
 * here before: that component was `bg-slate-700/50` with no light variant
 * (defect 59, since fixed — it now draws the same panel-2/line shimmer as
 * `.st-skel`). This stays separate because it mirrors the table's row
 * anatomy, which a general-purpose box cannot do.
 *
 * The shimmer stops under `prefers-reduced-motion` via the app-wide rule
 * near the top of index.css.
 */
const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows, numericColumns }) => (
  <div className="st-wrap" aria-hidden="true">
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="st-skel-row">
        <span className="st-skel" style={{ width: 14 }} />
        <span className="st-skel" style={{ width: 132, marginRight: "auto" }} />
        {Array.from({ length: numericColumns }).map((__, col) => (
          <span key={col} className="st-skel" style={{ width: 46 }} />
        ))}
      </div>
    ))}
  </div>
);

export default TableSkeleton;

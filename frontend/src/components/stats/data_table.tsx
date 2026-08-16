// frontend/src/components/stats/data_table.tsx
import React, { useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import {
  formatStat,
  statValue,
  columnRange,
  barWidth,
} from "@/utils/stats_format";
import type { SortDir } from "@/utils/stats_format";

export type { SortDir };

/**
 * A row of any of the five datasets. Deliberately loose: the five feeds
 * share no common interface, and the alternative in the old screen was
 * eighteen `any`s and a cast at every cell.
 */
export type StatRow = Record<string, unknown>;

export interface Column {
  /** Key on the row. */
  key: string;
  label: string;
  /**
   * `num` is mono, tabular and right-aligned; `text` is the elastic
   * name column; `sub` is secondary text, left-aligned but not elastic.
   * See docs/design_system.md §6.5.
   */
  type?: "num" | "text" | "sub";
  /** Guided-tour anchor for this header cell — §6.10 calls these contracts. */
  tourId?: string;
}

export interface DataTableProps {
  /** Screen-reader caption. Never shown. */
  caption: string;
  columns: ReadonlyArray<Column>;
  rows: ReadonlyArray<StatRow>;
  sortKey: string;
  sortDir: SortDir;
  onSort: (key: string) => void;
  rowKey: (row: StatRow, index: number) => string;
}

/**
 * A sortable header cell.
 *
 * The control is a **button filling the cell**, so the whole cell is the
 * target (§6.5) and it is operable from the keyboard. The previous
 * implementation put `onClick` on a bare `<th>` with `tabIndex: -1` and
 * no key handler, while still setting `aria-sort` — so a screen reader
 * announced a sortable column that no keyboard could sort (defect 53).
 *
 * `aria-sort` belongs on the `<th>`, not on the button: it describes the
 * column, and the button is the control that changes it.
 *
 * There is no `title` attribute. The old one read "Click to sort" and
 * never appeared on touch, which is most of this app's traffic — the
 * same reason it was removed from the game card.
 */
const SortableHeader: React.FC<{
  column: Column;
  active: boolean;
  dir: SortDir;
  onSort: (key: string) => void;
}> = ({ column, active, dir, onSort }) => {
  const isText = column.type === "text";
  const Caret = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;

  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={[
        "st-th",
        isText ? "st-th--txt st-pin" : "",
        column.type === "sub" ? "st-th--txt" : "",
        active ? "st-th--on" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        data-tour={column.tourId}
        className="st-sort"
      >
        {column.label}
        <Caret className="st-caret" size={10} strokeWidth={2.6} aria-hidden="true" />
      </button>
    </th>
  );
};

/**
 * The Stats table — see docs/design_system.md §6.5, and §8.2 for how the
 * screen configures it.
 *
 * One configured component replaces the five near-identical tables that
 * used to be declared inside the screen's render body, where React saw a
 * new component type on every render and remounted the whole subtree
 * (defect 57).
 *
 * **The sorted column is the subject.** It holds full `ink` while the
 * other numeric columns recede, and carries a magnitude bar whose width
 * is the value's place in that column's range. The bar reports how big a
 * number is; it never claims that is good. The app does not know which
 * direction is good for `def_rtg`, `tov_pct`, `sos` or `pace`.
 */
const DataTable: React.FC<DataTableProps> = ({
  caption,
  columns,
  rows,
  sortKey,
  sortDir,
  onSort,
  rowKey,
}) => {
  const sortedColumn = columns.find((c) => c.key === sortKey);
  const barsApply = !!sortedColumn && (sortedColumn.type ?? "num") === "num";

  // Ranged once per render rather than once per cell.
  const range = useMemo(
    () => (barsApply ? columnRange(rows, sortKey) : null),
    [barsApply, rows, sortKey]
  );

  return (
    <div className="st-wrap">
      <table className="st-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="st-th st-th--rank st-pin">
              <span className="sr-only">Rank</span>
            </th>
            {columns.map((column) => (
              <SortableHeader
                key={column.key}
                column={column}
                active={column.key === sortKey}
                dir={sortDir}
                onSort={onSort}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="st-row">
              {/* Numbers the current sort. The heading has always said
                  "Rankings" while the table numbered nothing. */}
              <td className="st-td st-td--rank st-pin">{index + 1}</td>

              {columns.map((column) => {
                const type = column.type ?? "num";
                const active = column.key === sortKey;
                const text = formatStat(row[column.key], column.key);

                const value = active && barsApply ? statValue(row[column.key], column.key) : null;
                const width = value !== null && range ? barWidth(value, range) : null;

                return (
                  <td
                    key={column.key}
                    className={[
                      "st-td",
                      type === "text" ? "st-td--txt st-pin" : "",
                      type === "sub" ? "st-td--sub" : "",
                      active ? "st-td--on" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {width !== null && (
                      <span className="st-bar" style={{ width: `${width}%` }} aria-hidden="true" />
                    )}
                    <span className="st-val">{text}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

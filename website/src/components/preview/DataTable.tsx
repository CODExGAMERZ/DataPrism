import { useState, useMemo } from "react";
import type { PreviewData } from "../../types";

interface Props {
  data: PreviewData;
}

type SortDir = "asc" | "desc" | null;

export default function DataTable({ data }: Props) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortCol || !sortDir) return data.rows;

    return [...data.rows].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];

      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;

      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }

      const sa = String(va);
      const sb = String(vb);
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data.rows, sortCol, sortDir]);

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 40, color: "var(--text-muted)" }}>#</th>
            {data.columns.map((col) => (
              <th key={col.name} onClick={() => handleSort(col.name)}>
                {col.name}
                <span className={`sort-icon ${sortCol === col.name ? "active" : ""}`}>
                  {sortCol === col.name ? (sortDir === "asc" ? " ↑" : sortDir === "desc" ? " ↓" : "") : ""}
                </span>
                <span className="type-badge">{col.type}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr key={i}>
              <td style={{ color: "var(--text-muted)", fontSize: 10 }}>{i + 1}</td>
              {data.columns.map((col) => {
                const val = row[col.name];
                const isNull = val === null || val === undefined;
                return (
                  <td key={col.name} className={isNull ? "null-value" : ""}>
                    {isNull ? "null" : String(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type { TabName } from "../types";

const TABS: { id: TabName; label: string; icon: string }[] = [
  { id: "preview", label: "Preview", icon: "📋" },
  { id: "summary", label: "Summary", icon: "📊" },
  { id: "correlations", label: "Correlations", icon: "🔗" },
  { id: "quality", label: "Quality", icon: "✅" },
  { id: "columns", label: "Columns", icon: "📐" },
];

interface Props {
  active: TabName;
  onChange: (tab: TabName) => void;
}

export default function TabBar({ active, onChange }: Props) {
  return (
    <div className="tab-bar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

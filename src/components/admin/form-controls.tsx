"use client";

export function FormSection({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{
        backgroundColor: "var(--tm-surface)",
        border: "1px solid var(--tm-border-i)",
      }}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <div
          className="rounded-lg flex items-center justify-center shrink-0"
          style={{ width: 26, height: 26, backgroundColor: `${accent}1F` }}
        >
          <Icon size={14} color={accent} />
        </div>
        <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>
          {title}
        </span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export function SegmentedButtons({
  options,
  selected,
  onSelect,
  accent,
  deselectable = false,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  accent: string;
  deselectable?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const sel = selected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(sel && deselectable ? "" : option.value)}
            className="flex-1 text-xs font-semibold py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: sel ? accent : "var(--tm-subtle)",
              color: sel ? "white" : "var(--tm-text-2)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ChipPicker({
  options,
  isSelected,
  onToggle,
  accent,
  display,
}: {
  options: string[];
  isSelected: (value: string) => boolean;
  onToggle: (value: string) => void;
  accent: string;
  display: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((value) => {
        const sel = isSelected(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              backgroundColor: sel ? accent : "var(--tm-subtle)",
              color: sel ? "white" : "var(--tm-text-2)",
              borderColor: "transparent",
            }}
          >
            {display(value)}
          </button>
        );
      })}
    </div>
  );
}

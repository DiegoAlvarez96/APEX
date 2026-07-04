export function SegmentedControl<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid rounded-xl bg-[rgb(var(--surface-strong))] p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-8 rounded-[10px] text-xs font-semibold transition ${
            value === option.value ? "bg-[rgb(var(--text))] text-[rgb(var(--bg))] shadow-sm" : "text-[rgb(var(--muted))]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

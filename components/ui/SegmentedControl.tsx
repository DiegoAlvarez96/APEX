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
    <div className="grid rounded-2xl bg-[rgb(var(--surface-strong))] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-10 rounded-xl text-sm font-medium transition ${
            value === option.value ? "bg-[rgb(var(--text))] text-[rgb(var(--bg))] shadow-sm" : "text-[rgb(var(--muted))]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

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
    <div className="grid rounded-[18px] border border-white/10 bg-white/[0.055] p-1 shadow-soft backdrop-blur-xl" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-8 rounded-[14px] text-[11px] font-semibold transition ${
            value === option.value ? "apex-action shadow-sm" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

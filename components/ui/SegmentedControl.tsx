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
    <div className="grid rounded-2xl bg-white/8 p-1 light:bg-black/5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-10 rounded-xl text-sm font-medium transition ${
            value === option.value ? "bg-white text-black shadow-sm light:bg-black light:text-white" : "text-white/60 light:text-black/55"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressRing({ value, label }: { value: number; label: string }) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="relative flex size-32 shrink-0 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(rgb(var(--module-accent)) ${normalized * 3.6}deg, rgba(255,255,255,0.12) 0deg)` }}
      />
      <div className="absolute inset-2 rounded-full bg-[#101114] light:bg-white" />
      <div className="relative text-center">
        <div className="text-2xl font-semibold">{normalized}%</div>
        <div className="mx-auto max-w-24 text-[11px] leading-3 text-white/45 light:text-black/45">{label}</div>
      </div>
    </div>
  );
}

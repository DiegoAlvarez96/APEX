import type { CSSProperties, ReactNode } from "react";

export function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <section className={`apex-card rounded-[22px] p-4 ${className}`} style={style}>{children}</section>;
}

export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-3 min-w-0">
      {eyebrow ? <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{eyebrow}</p> : null}
      <h2 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h2>
    </div>
  );
}

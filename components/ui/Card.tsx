import type { CSSProperties, ReactNode } from "react";

export function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <section className={`rounded-[18px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft ${className}`} style={style}>{children}</section>;
}

export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-3">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{eyebrow}</p> : null}
      <h2 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h2>
    </div>
  );
}

import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft ${className}`}>{children}</section>;
}

export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-4">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{eyebrow}</p> : null}
      <h2 className="text-xl font-semibold text-[rgb(var(--text))]">{title}</h2>
    </div>
  );
}

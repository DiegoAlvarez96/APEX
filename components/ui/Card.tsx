import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glass rounded-[28px] p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-4">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45 light:text-black/45">{eyebrow}</p> : null}
      <h2 className="text-xl font-semibold text-white light:text-black">{title}</h2>
    </div>
  );
}

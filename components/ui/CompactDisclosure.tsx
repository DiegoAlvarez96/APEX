"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function CompactDisclosure({
  title,
  eyebrow,
  children,
  defaultOpen = false
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group rounded-[16px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2.5 shadow-soft" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="min-w-0">
          {eyebrow ? <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{eyebrow}</span> : null}
          <span className="block truncate text-sm font-semibold">{title}</span>
        </span>
        <ChevronDown className="shrink-0 transition group-open:rotate-180" size={14} />
      </summary>
      <div className="mt-2.5">{children}</div>
    </details>
  );
}

"use client";

import { Plus } from "lucide-react";
import { pinnedModules } from "@/lib/modules";

export type ViewKey = "home" | "dashboard" | "calendar" | "finance" | "nutrition" | "training" | "physical" | "health" | "products" | "shopping" | "alerts" | "timeline" | "ai" | "chat" | "stats" | "settings" | "sleep";

export function BottomNav({ active, onChange }: { active: ViewKey; onChange: (view: ViewKey) => void }) {
  const items = pinnedModules();
  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2, 4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 safe-bottom px-3 pb-2">
      <div className="mx-auto grid h-16 max-w-xl grid-cols-[1fr_1fr_60px_1fr_1fr] items-center rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-strong))]/92 px-2 shadow-soft backdrop-blur-2xl">
        {leftItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[9px] font-semibold transition ${
                isActive ? "text-[rgb(var(--text))]" : "text-[rgb(var(--muted))]"
              }`}
              aria-label={item.label}
            >
              <Icon size={17} strokeWidth={isActive ? 2.6 : 2} />
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange("home")}
          className="-mt-6 grid size-[60px] place-items-center rounded-full bg-[rgb(var(--accent))] text-black shadow-action transition active:scale-95 nav-action"
          aria-label="Abrir inicio"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
        {rightItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[9px] font-semibold transition ${
                isActive ? "text-[rgb(var(--text))]" : "text-[rgb(var(--muted))]"
              }`}
              aria-label={item.label}
            >
              <Icon size={17} strokeWidth={isActive ? 2.6 : 2} />
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

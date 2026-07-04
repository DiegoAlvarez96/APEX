"use client";

import { Plus } from "lucide-react";
import { pinnedModules } from "@/lib/modules";

export type ViewKey = "home" | "dashboard" | "calendar" | "nutrition" | "training" | "physical" | "health" | "products" | "shopping" | "alerts" | "timeline" | "ai" | "chat" | "stats" | "settings" | "sleep";

export function BottomNav({ active, onChange }: { active: ViewKey; onChange: (view: ViewKey) => void }) {
  const items = pinnedModules();
  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2, 4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 safe-bottom px-4 pb-3">
      <div className="mx-auto grid h-20 max-w-xl grid-cols-[1fr_1fr_72px_1fr_1fr] items-center rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-strong))]/92 px-3 shadow-soft backdrop-blur-2xl">
        {leftItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition ${
                isActive ? "text-[rgb(var(--text))]" : "text-[rgb(var(--muted))]"
              }`}
              aria-label={item.label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange("home")}
          className="-mt-8 grid size-[72px] place-items-center rounded-full bg-[rgb(var(--accent))] text-black shadow-action transition active:scale-95"
          aria-label="Abrir inicio"
        >
          <Plus size={30} strokeWidth={2.5} />
        </button>
        {rightItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition ${
                isActive ? "text-[rgb(var(--text))]" : "text-[rgb(var(--muted))]"
              }`}
              aria-label={item.label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

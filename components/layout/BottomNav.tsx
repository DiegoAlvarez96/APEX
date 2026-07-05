"use client";

import { ChevronUp } from "lucide-react";
import { getModuleIdentity, pinnedModules } from "@/lib/modules";

export type ViewKey = "home" | "dashboard" | "calendar" | "finance" | "nutrition" | "training" | "physical" | "health" | "products" | "shopping" | "alerts" | "timeline" | "ai" | "chat" | "stats" | "settings" | "sleep";

export function BottomNav({ active, onChange, onHomeAction }: { active: ViewKey; onChange: (view: ViewKey) => void; onHomeAction?: () => void }) {
  const items = pinnedModules();
  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2, 4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 safe-bottom px-3 pb-2">
      <div className="mx-auto grid h-16 max-w-xl grid-cols-[1fr_1fr_60px_1fr_1fr] items-center rounded-[28px] border border-white/10 bg-[rgb(var(--surface-strong))]/74 px-2 shadow-[0_18px_58px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        {leftItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const moduleTheme = getModuleIdentity(item.key);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[9px] font-semibold transition ${
                isActive ? "text-[rgb(var(--text))]" : "text-[rgb(var(--muted))]"
              }`}
              style={isActive ? { background: moduleTheme.tint, color: moduleTheme.accent } : undefined}
              aria-label={item.label}
            >
              <Icon size={17} strokeWidth={isActive ? 2.6 : 2} style={isActive ? { color: moduleTheme.accent } : undefined} />
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onHomeAction ?? (() => onChange("home"))}
          className="-mt-6 grid size-[62px] place-items-center rounded-full border border-white/30 text-white shadow-[0_16px_42px_rgba(177,156,217,0.24)] transition active:scale-95"
          style={{
            background:
              "radial-gradient(circle at 34% 26%, rgba(255,255,255,0.44), transparent 25%), linear-gradient(135deg, #c8b8ff 0%, #f8b9dc 50%, #ffd3a6 100%)",
            boxShadow: "0 0 0 4px rgba(200,184,255,0.13), 0 0 0 8px rgba(248,185,220,0.07), 0 18px 42px rgba(177,156,217,0.24)"
          }}
          aria-label="Abrir menu de modulos"
        >
          <ChevronUp style={{ width: 34, height: 34 }} strokeWidth={2.8} />
        </button>
        {rightItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const moduleTheme = getModuleIdentity(item.key);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[9px] font-semibold transition ${
                isActive ? "text-[rgb(var(--text))]" : "text-[rgb(var(--muted))]"
              }`}
              style={isActive ? { background: moduleTheme.tint, color: moduleTheme.accent } : undefined}
              aria-label={item.label}
            >
              <Icon size={17} strokeWidth={isActive ? 2.6 : 2} style={isActive ? { color: moduleTheme.accent } : undefined} />
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

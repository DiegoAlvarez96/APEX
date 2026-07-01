"use client";

import { BarChart3, CalendarDays, Home, Package, Settings, Sparkles } from "lucide-react";

export type ViewKey = "dashboard" | "calendar" | "care" | "products" | "stats" | "settings";

const items = [
  { key: "dashboard", label: "Hoy", icon: Home },
  { key: "calendar", label: "Agenda", icon: CalendarDays },
  { key: "care", label: "Care", icon: Sparkles },
  { key: "products", label: "Stock", icon: Package },
  { key: "stats", label: "Stats", icon: BarChart3 },
  { key: "settings", label: "Config", icon: Settings }
] satisfies { key: ViewKey; label: string; icon: typeof Home }[];

export function BottomNav({ active, onChange }: { active: ViewKey; onChange: (view: ViewKey) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 safe-bottom px-3 pb-3">
      <div className="glass mx-auto grid max-w-xl grid-cols-6 rounded-[26px] p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition ${
                isActive ? "bg-white text-black light:bg-black light:text-white" : "text-white/55 light:text-black/50"
              }`}
              aria-label={item.label}
            >
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

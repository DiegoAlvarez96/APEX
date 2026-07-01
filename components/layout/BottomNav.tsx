"use client";

import { CalendarDays, Dumbbell, HeartPulse, Home, Package, UserRound, Utensils } from "lucide-react";

export type ViewKey = "home" | "dashboard" | "calendar" | "nutrition" | "training" | "physical" | "health" | "products" | "shopping" | "alerts" | "timeline" | "ai" | "chat" | "stats" | "settings" | "sleep";

const items = [
  { key: "home", label: "Inicio", icon: Home },
  { key: "calendar", label: "Agenda", icon: CalendarDays },
  { key: "nutrition", label: "Nutri", icon: Utensils },
  { key: "training", label: "Train", icon: Dumbbell },
  { key: "physical", label: "Fisico", icon: UserRound },
  { key: "health", label: "Salud", icon: HeartPulse },
  { key: "products", label: "Stock", icon: Package }
] satisfies { key: ViewKey; label: string; icon: typeof Home }[];

export function BottomNav({ active, onChange }: { active: ViewKey; onChange: (view: ViewKey) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 safe-bottom px-3 pb-3">
      <div className="glass no-scrollbar mx-auto flex max-w-xl gap-1 overflow-x-auto rounded-[26px] p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex h-14 w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition ${
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

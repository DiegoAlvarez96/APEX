"use client";

import { Bell, Bot, Settings } from "lucide-react";
import type { ViewKey } from "@/components/layout/BottomNav";

export function AppHeader({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-2 flex items-center justify-end gap-2 bg-[#07080a]/70 px-4 py-2 backdrop-blur-xl light:bg-white/70">
      <button className="grid size-10 place-items-center rounded-full glass" onClick={() => onNavigate("alerts")} aria-label="Alertas" type="button"><Bell size={18} /></button>
      <button className="grid size-10 place-items-center rounded-full glass" onClick={() => onNavigate("chat")} aria-label="Chat IA" type="button"><Bot size={18} /></button>
      <button className="grid size-10 place-items-center rounded-full glass" onClick={() => onNavigate("settings")} aria-label="Configuracion" type="button"><Settings size={18} /></button>
    </div>
  );
}

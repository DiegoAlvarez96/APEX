"use client";

import { Bell, Bot, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/Loading";
import { DateTimeService } from "@/lib/date";
import type { ViewKey } from "@/components/layout/BottomNav";
import { getModuleIdentity } from "@/lib/modules";

export function AppHeader({ active, onNavigate, onRefresh, onOpenTrainingSettings }: { active: ViewKey; onNavigate: (view: ViewKey) => void; onRefresh?: () => Promise<void> | void; onOpenTrainingSettings?: () => void }) {
  const [updateState, setUpdateState] = useState<"idle" | "checking" | "done" | "error">("idle");
  const moduleTheme = getModuleIdentity(active);

  async function updateApp() {
    setUpdateState("checking");
    try {
      if ("serviceWorker" in navigator) {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<ServiceWorkerRegistration | undefined>((resolve) => window.setTimeout(() => resolve(undefined), 2500))
        ]);
        await registration?.update();
        const worker = registration?.waiting ?? registration?.installing;
        if (worker) worker.postMessage({ type: "SKIP_WAITING" });
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      await onRefresh?.();
      setUpdateState("done");
      window.setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set("apexRefresh", DateTimeService.id("update"));
        window.location.replace(url.toString());
      }, 650);
    } catch {
      setUpdateState("error");
      window.setTimeout(() => window.location.reload(), 900);
    }
  }

  return (
    <div className="sticky top-0 z-40 -mx-3 mb-2 flex items-center justify-between gap-2 bg-[rgb(var(--bg))]/55 px-3 py-2 backdrop-blur-2xl">
      <button type="button" onClick={() => onNavigate("home")} className="flex min-h-9 items-center gap-2 rounded-full pr-2 text-left" aria-label="Ir al inicio">
        <span className="apex-icon size-8 rounded-full">
          <span className="text-[10px] font-black">A</span>
        </span>
        <span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: moduleTheme.accent }}>APEX</span>
          <span className="block text-sm font-semibold leading-4">{moduleTheme.label}</span>
        </span>
      </button>
      {updateState !== "idle" ? (
        <span className="flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-2 text-xs text-[rgb(var(--muted))]">
          {updateState === "checking" ? <Spinner /> : null}
          {updateState === "checking" ? "Actualizando..." : updateState === "done" ? "Aplicacion actualizada." : "No se pudo actualizar."}
        </span>
      ) : null}
      <div className="flex gap-2">
        {active === "training" ? (
          <button className="grid size-8 place-items-center rounded-full border border-[#d8ff64]/25 bg-[#d8ff64]/12 text-[#d8ff64]" onClick={onOpenTrainingSettings} aria-label="Configurar deportes" type="button"><Settings size={15} /></button>
        ) : null}
        <button className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.07]" style={{ color: moduleTheme.accent }} onClick={() => onNavigate("alerts")} aria-label="Alertas" type="button"><Bell size={15} /></button>
        <button className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.07] disabled:opacity-60" style={{ color: moduleTheme.accent }} onClick={() => void updateApp()} disabled={updateState === "checking"} aria-label="Actualizar aplicacion" type="button"><RefreshCw size={15} /></button>
        <button className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.07]" style={{ color: getModuleIdentity("chat").accent }} onClick={() => onNavigate("chat")} aria-label="Chat IA" type="button"><Bot size={15} /></button>
        <button className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.07]" style={{ color: getModuleIdentity("settings").accent }} onClick={() => onNavigate("settings")} aria-label="Configuracion" type="button"><Settings size={15} /></button>
      </div>
    </div>
  );
}

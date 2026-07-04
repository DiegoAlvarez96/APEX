"use client";

import { Bell, Bot, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/Loading";
import { DateTimeService } from "@/lib/date";
import type { ViewKey } from "@/components/layout/BottomNav";

export function AppHeader({ onNavigate, onRefresh }: { onNavigate: (view: ViewKey) => void; onRefresh?: () => Promise<void> | void }) {
  const [updateState, setUpdateState] = useState<"idle" | "checking" | "done" | "error">("idle");

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
    <div className="sticky top-0 z-40 -mx-4 mb-1 flex items-center justify-between gap-2 bg-[rgb(var(--bg))]/78 px-4 py-1.5 backdrop-blur-xl">
      <button type="button" onClick={() => onNavigate("home")} className="min-h-9 rounded-full px-1 text-left" aria-label="Ir al inicio">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">APEX</span>
        <span className="block text-sm font-semibold leading-4">Hoy</span>
      </button>
      {updateState !== "idle" ? (
        <span className="flex items-center gap-2 rounded-full bg-[rgb(var(--surface))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
          {updateState === "checking" ? <Spinner /> : null}
          {updateState === "checking" ? "Actualizando..." : updateState === "done" ? "Aplicacion actualizada." : "No se pudo actualizar."}
        </span>
      ) : null}
      <div className="flex gap-2">
        <button className="grid size-8 place-items-center rounded-full bg-[rgb(var(--surface))] text-[rgb(var(--text))]" onClick={() => onNavigate("alerts")} aria-label="Alertas" type="button"><Bell size={15} /></button>
        <button className="grid size-8 place-items-center rounded-full bg-[rgb(var(--surface))] text-[rgb(var(--text))] disabled:opacity-60" onClick={() => void updateApp()} disabled={updateState === "checking"} aria-label="Actualizar aplicacion" type="button"><RefreshCw size={15} /></button>
        <button className="grid size-8 place-items-center rounded-full bg-[rgb(var(--surface))] text-[rgb(var(--text))]" onClick={() => onNavigate("chat")} aria-label="Chat IA" type="button"><Bot size={15} /></button>
        <button className="grid size-8 place-items-center rounded-full bg-[rgb(var(--surface))] text-[rgb(var(--text))]" onClick={() => onNavigate("settings")} aria-label="Configuracion" type="button"><Settings size={15} /></button>
      </div>
    </div>
  );
}

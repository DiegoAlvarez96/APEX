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
    <div className="sticky top-0 z-40 -mx-4 mb-2 flex items-center justify-end gap-2 bg-[#07080a]/70 px-4 py-2 backdrop-blur-xl light:bg-white/70">
      {updateState !== "idle" ? (
        <span className="mr-auto flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs text-white/70 light:bg-black/[0.05] light:text-black/70">
          {updateState === "checking" ? <Spinner /> : null}
          {updateState === "checking" ? "Actualizando..." : updateState === "done" ? "Aplicacion actualizada." : "No se pudo actualizar."}
        </span>
      ) : null}
      <button className="grid size-10 place-items-center rounded-full glass" onClick={() => onNavigate("alerts")} aria-label="Alertas" type="button"><Bell size={18} /></button>
      <button className="grid size-10 place-items-center rounded-full glass disabled:opacity-60" onClick={() => void updateApp()} disabled={updateState === "checking"} aria-label="Actualizar aplicacion" type="button"><RefreshCw size={18} /></button>
      <button className="grid size-10 place-items-center rounded-full glass" onClick={() => onNavigate("chat")} aria-label="Chat IA" type="button"><Bot size={18} /></button>
      <button className="grid size-10 place-items-center rounded-full glass" onClick={() => onNavigate("settings")} aria-label="Configuracion" type="button"><Settings size={18} /></button>
    </div>
  );
}

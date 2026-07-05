"use client";

import { Moon, Save } from "lucide-react";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { InlineStatus, LoadingButton } from "@/components/ui/Loading";
import { calculateSleepDuration, formatSleepDuration } from "@/lib/sleep";
import type { SleepLog } from "@/types/apex";

export function SleepView({ sleep, onSave }: { sleep?: SleepLog; onSave: (sleepTime: string, wakeTime: string) => Promise<void> | void }) {
  const [sleepTime, setSleepTime] = useState(sleep?.sleepTime ?? "00:00");
  const [wakeTime, setWakeTime] = useState(sleep?.wakeTime ?? "08:30");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message?: string; tone?: "info" | "success" | "error" }>({});
  const duration = calculateSleepDuration(sleepTime, wakeTime);

  async function save() {
    setLoading(true);
    setStatus({ message: "Guardando sueno...", tone: "info" });
    try {
      await onSave(sleepTime, wakeTime);
      setStatus({ message: "Sueno guardado.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo guardar el sueno.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Recuperacion</p>
        <h1 className="text-3xl font-semibold">Sueno</h1>
      </header>
      <Card>
        <SectionTitle title={sleep ? "Sueno cargado" : "Cuantas horas dormiste?"} eyebrow="02:00 - 09:00" />
        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-3xl bg-white/[0.08] p-4 light:bg-black/[0.05]">
            <span className="text-xs text-white/45 light:text-black/45">Hora de dormir</span>
            <input className="mt-2 w-full bg-transparent text-3xl font-semibold outline-none" type="time" value={sleepTime} onChange={(event) => setSleepTime(event.target.value)} />
          </label>
          <label className="rounded-3xl bg-white/[0.08] p-4 light:bg-black/[0.05]">
            <span className="text-xs text-white/45 light:text-black/45">Hora de despertar</span>
            <input className="mt-2 w-full bg-transparent text-3xl font-semibold outline-none" type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-3xl bg-[rgba(var(--module-accent),0.15)] p-4">
          <Moon className="text-[rgb(var(--module-accent))]" />
          <div>
            <p className="text-sm text-white/50 light:text-black/50">Duracion calculada</p>
            <p className="text-2xl font-semibold">{formatSleepDuration(duration)}</p>
          </div>
        </div>
        <LoadingButton loading={loading} loadingLabel="Guardando..." className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--module-accent))] font-semibold text-[rgb(var(--bg))]" onClick={() => void save()}>
          <Save size={18} /> Guardar sueno
        </LoadingButton>
        <div className="mt-3"><InlineStatus message={status.message} tone={status.tone} /></div>
        {sleep ? <p className="mt-3 text-center text-sm text-white/45 light:text-black/45">Ya cargaste el sueno de este dia. No se vuelve a preguntar salvo que lo edites.</p> : null}
      </Card>
    </div>
  );
}

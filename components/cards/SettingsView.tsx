"use client";

import { Bell, Download, Moon, Sun } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { dateKey } from "@/lib/date";
import type { AppSettings } from "@/types/apex";

export function SettingsView({
  settings,
  onUpdateSettings,
  onExport
}: {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onExport: () => Promise<string>;
}) {
  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    onUpdateSettings({ notificationsEnabled: permission === "granted" });
    if (permission === "granted") {
      new Notification("APEX", { body: "Recordatorios locales activados." });
    }
  }

  async function exportBackup() {
    const json = await onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `apex-backup-${dateKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Preferencias</p>
        <h1 className="text-3xl font-semibold">Configuracion</h1>
      </header>

      <Card>
        <SectionTitle title="Apariencia" />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: "dark" })}
            className={`flex h-20 items-center justify-center gap-2 rounded-3xl ${settings.theme === "dark" ? "bg-limeglass text-black" : "bg-white/[0.06] light:bg-black/[0.04]"}`}
          >
            <Moon size={18} /> Oscuro
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: "light" })}
            className={`flex h-20 items-center justify-center gap-2 rounded-3xl ${settings.theme === "light" ? "bg-black text-white" : "bg-white/[0.06] light:bg-black/[0.04]"}`}
          >
            <Sun size={18} /> Claro
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Recordatorios" />
        <div className="space-y-3">
          <TimeRow label="Rutina manana" value={settings.morningReminder} onChange={(morningReminder) => onUpdateSettings({ morningReminder })} />
          <TimeRow label="Rutina noche" value={settings.nightReminder} onChange={(nightReminder) => onUpdateSettings({ nightReminder })} />
          <label className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-4 light:bg-black/[0.04]">
            <span>Dermaroller jueves</span>
            <input
              className="size-5 accent-limeglass"
              type="checkbox"
              checked={settings.dermarollerReminder}
              onChange={(event) => onUpdateSettings({ dermarollerReminder: event.target.checked })}
            />
          </label>
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-black" onClick={() => void enableNotifications()} type="button">
            <Bell size={18} /> {settings.notificationsEnabled ? "Notificaciones activas" : "Activar notificaciones"}
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Backup local" />
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-limeglass font-semibold text-black" onClick={() => void exportBackup()} type="button">
          <Download size={18} /> Exportar datos
        </button>
      </Card>

      <Card>
        <SectionTitle title="IA y objetivos" eyebrow="Preparado para OpenAI" />
        <div className="space-y-3">
          <label className="block rounded-2xl bg-white/[0.06] p-4 light:bg-black/[0.04]">
            <span className="text-xs text-white/45 light:text-black/45">OpenAI API key</span>
            <input
              className="mt-1 w-full bg-transparent text-sm outline-none"
              type="password"
              value={settings.openAiApiKey ?? ""}
              onChange={(event) => onUpdateSettings({ openAiApiKey: event.target.value || undefined })}
              placeholder="sk-..."
            />
          </label>
          <label className="block rounded-2xl bg-white/[0.06] p-4 light:bg-black/[0.04]">
            <span className="text-xs text-white/45 light:text-black/45">Objetivo nutricion</span>
            <textarea
              className="mt-1 min-h-20 w-full bg-transparent text-sm outline-none"
              value={settings.nutritionGoal ?? ""}
              onChange={(event) => onUpdateSettings({ nutritionGoal: event.target.value })}
            />
          </label>
          <label className="block rounded-2xl bg-white/[0.06] p-4 light:bg-black/[0.04]">
            <span className="text-xs text-white/45 light:text-black/45">Objetivo entrenamiento</span>
            <textarea
              className="mt-1 min-h-20 w-full bg-transparent text-sm outline-none"
              value={settings.trainingGoal ?? ""}
              onChange={(event) => onUpdateSettings({ trainingGoal: event.target.value })}
            />
          </label>
        </div>
      </Card>
    </div>
  );
}

function TimeRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-4 light:bg-black/[0.04]">
      <span>{label}</span>
      <input className="rounded-xl bg-transparent text-right outline-none" type="time" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

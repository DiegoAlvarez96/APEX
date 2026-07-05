"use client";

import { Bell, Download, Dumbbell, Moon, Settings, Sun, type LucideIcon } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { dateKey } from "@/lib/date";
import { enabledModules } from "@/lib/modules";
import type { AppSettings } from "@/types/apex";

export function SettingsView({
  settings,
  onUpdateSettings,
  onExport,
  onOpenTrainingSettings
}: {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onExport: () => Promise<string>;
  onOpenTrainingSettings: () => void;
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

      <Card className="p-2">
        <SectionTitle title="Apariencia" />
        <SettingRow icon={Moon} label="Modo oscuro" value={settings.theme === "dark"} onToggle={() => onUpdateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })} />
        <SettingRow icon={Sun} label="Tema claro" value={settings.theme === "light"} onToggle={() => onUpdateSettings({ theme: settings.theme === "light" ? "dark" : "light" })} />
      </Card>

      <Card className="p-2">
        <SectionTitle title="Recordatorios" />
        <div className="space-y-3">
          <TimeRow label="Rutina manana" value={settings.morningReminder} onChange={(morningReminder) => onUpdateSettings({ morningReminder })} />
          <TimeRow label="Rutina noche" value={settings.nightReminder} onChange={(nightReminder) => onUpdateSettings({ nightReminder })} />
          <SettingRow icon={Bell} label="Dermaroller jueves" value={settings.dermarollerReminder} onToggle={() => onUpdateSettings({ dermarollerReminder: !settings.dermarollerReminder })} />
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-black" onClick={() => void enableNotifications()} type="button">
            <Bell size={18} /> {settings.notificationsEnabled ? "Notificaciones activas" : "Activar notificaciones"}
          </button>
        </div>
      </Card>

      <Card className="p-2">
        <SectionTitle title="Modulos" eyebrow="Orden y visibilidad" />
        <div className="space-y-1">
          {enabledModules().map((module) => {
            const Icon = module.icon;
            return <SettingRow key={module.key} icon={Icon} label={module.label} value={module.enabled} disabled />;
          })}
        </div>
      </Card>

      <Card className="p-2">
        <div className="flex min-h-14 items-center justify-between gap-3 px-3">
          <span className="flex items-center gap-3 text-sm font-medium">
            <Dumbbell size={18} className="text-[rgb(var(--module-accent))]" />
            Entrenamiento
          </span>
          <button type="button" onClick={onOpenTrainingSettings} className="grid size-9 place-items-center rounded-full bg-[rgb(var(--surface-strong))] text-[rgb(var(--module-accent))]" aria-label="Configurar entrenamiento">
            <Settings size={16} />
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Backup local" />
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--module-accent))] font-semibold text-[rgb(var(--bg))]" onClick={() => void exportBackup()} type="button">
          <Download size={18} /> Exportar datos
        </button>
      </Card>

      <Card>
        <SectionTitle title="IA y objetivos" eyebrow="Preparado para OpenAI" />
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/[0.06] p-4 text-sm text-white/55 light:bg-black/[0.04] light:text-black/55">
            La API key se toma desde la variable de entorno <span className="font-semibold">OPENAI_API_KEY</span>.
          </div>
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
    <label className="flex min-h-14 items-center justify-between rounded-2xl bg-[rgb(var(--surface-strong))] px-4">
      <span>{label}</span>
      <input className="rounded-xl bg-transparent text-right outline-none" type="time" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  disabled,
  onToggle
}: {
  icon: LucideIcon;
  label: string;
  value: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onToggle} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-3 text-left disabled:opacity-80">
      <span className="flex items-center gap-3">
        <Icon size={18} className="text-[rgb(var(--module-accent))]" />
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span className={`relative h-8 w-[52px] rounded-full transition ${value ? "bg-[rgb(var(--module-accent))]" : "bg-[rgb(var(--surface-strong))]"}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-white shadow-sm transition ${value ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

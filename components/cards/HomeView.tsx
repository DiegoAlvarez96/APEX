"use client";

import { ArrowRight, Bot, CalendarDays, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import type { ViewKey } from "@/components/layout/BottomNav";
import { enabledModules, getModuleIdentity } from "@/lib/modules";

export function HomeView({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  const modules = enabledModules().filter((module) => module.key !== "home");
  const primary = modules.filter((module) => ["calendar", "nutrition", "training", "dashboard", "finance", "ai"].includes(module.key)).slice(0, 6);
  const secondary = modules.filter((module) => !primary.some((item) => item.key === module.key));
  const todayItems = [
    { time: "08:30", title: "Desayuno", detail: "Nutricion", color: getModuleIdentity("nutrition").accent, view: "nutrition" as ViewKey },
    { time: "12:00", title: "Pagos y pendientes", detail: "Finanzas", color: getModuleIdentity("finance").accent, view: "finance" as ViewKey },
    { time: "18:00", title: "Entrenamiento", detail: "Rutina sugerida", color: getModuleIdentity("training").accent, view: "training" as ViewKey }
  ];

  return (
    <div className="space-y-3 pb-2">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[rgb(var(--surface-strong))]/70 p-4 shadow-panel backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_4%,rgba(var(--ai),0.24),transparent_30%),radial-gradient(circle_at_10%_92%,rgba(var(--agenda),0.18),transparent_28%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">APEX</p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight">Tu dia, compacto</h1>
            <p className="mt-2 max-w-[18rem] text-sm leading-5 text-white/58">Agenda, tareas, comida y entrenamiento conectados en una sola pantalla.</p>
          </div>
          <button type="button" onClick={() => onNavigate("chat")} className="apex-icon size-10 shrink-0 rounded-full" aria-label="Abrir IA">
            <Sparkles size={18} />
          </button>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {[
            ["Agenda", "3", "eventos", "calendar"],
            ["Tareas", "6/9", "hoy", "dashboard"],
            ["Nutri", "72%", "objetivo", "nutrition"]
          ].map(([label, value, detail, view]) => {
            const theme = getModuleIdentity(view);
            return (
              <button key={label} type="button" onClick={() => onNavigate(view as ViewKey)} className="rounded-[18px] border border-white/10 bg-white/[0.055] p-3 text-left">
                <p className="text-[10px] text-white/42">{label}</p>
                <p className="mt-1 text-xl font-bold" style={{ color: theme.accent }}>{value}</p>
                <p className="text-[10px] text-white/42">{detail}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="apex-card rounded-[24px] p-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Hoy</p>
            <h2 className="mt-1 text-base font-semibold">Proximas acciones</h2>
          </div>
          <button type="button" onClick={() => onNavigate("calendar")} className="flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-xs font-semibold text-[rgb(var(--muted))]">
            Ver <ArrowRight size={13} />
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {todayItems.map((item) => (
            <button key={item.time} type="button" onClick={() => onNavigate(item.view)} className="grid w-full grid-cols-[52px_1fr_24px] items-center gap-2 rounded-[16px] bg-white/[0.045] px-3 py-2 text-left">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/45"><Clock3 size={13} />{item.time}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{item.title}</span>
                <span className="block truncate text-xs text-white/42">{item.detail}</span>
              </span>
              <span className="size-2 rounded-full" style={{ background: item.color }} />
            </button>
          ))}
        </div>
      </section>

      <button type="button" onClick={() => onNavigate("chat")} className="apex-card flex min-h-12 w-full items-center justify-between gap-3 rounded-[22px] px-3 text-left">
        <span className="flex items-center gap-3">
          <span className="apex-icon size-9 rounded-2xl"><Bot size={17} /></span>
          <span>
            <span className="block text-sm font-semibold">Resumen IA</span>
            <span className="block text-xs text-[rgb(var(--muted))]">Prioridad y proxima accion</span>
          </span>
        </span>
        <ArrowRight size={16} className="text-[rgb(var(--muted))]" />
      </button>

      <section className="grid grid-cols-2 gap-2">
        {primary.map((item) => {
          const Icon = item.icon;
          const moduleTheme = getModuleIdentity(item.key);
          return (
            <button
              key={item.key}
              className="min-h-[86px] rounded-[22px] border border-white/10 p-3 text-left shadow-soft transition active:scale-[0.98]"
              style={{ background: moduleTheme.gradient }}
              onClick={() => onNavigate(item.key)}
              type="button"
            >
              <span className="grid size-9 place-items-center rounded-2xl" style={{ background: moduleTheme.strongTint, color: moduleTheme.accent }}>
                <Icon size={18} />
              </span>
              <p className="mt-3 text-sm font-semibold">{item.label}</p>
              <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-[rgb(var(--muted))]">{item.detail}</p>
            </button>
          );
        })}
      </section>

      <section className="apex-card rounded-[22px] p-2">
        <div className="mb-1 flex items-center gap-2 px-2 py-1">
          <CalendarDays size={14} className="text-[rgb(var(--module-accent))]" />
          <p className="text-xs font-semibold text-[rgb(var(--muted))]">Mas modulos</p>
        </div>
        {secondary.map((item) => {
          const Icon = item.icon;
          const moduleTheme = getModuleIdentity(item.key);
          return (
            <button key={item.key} type="button" onClick={() => onNavigate(item.key)} className="flex min-h-10 w-full items-center gap-2 rounded-2xl px-2 text-left transition hover:bg-white/[0.05]">
              <span className="grid size-7 shrink-0 place-items-center rounded-xl" style={{ background: moduleTheme.tint }}>
                <Icon size={15} style={{ color: moduleTheme.accent }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold">{item.label}</span>
                <span className="block truncate text-[11px] text-[rgb(var(--muted))]">{item.detail}</span>
              </span>
              <CheckCircle2 size={15} className="text-[rgb(var(--muted))]" />
            </button>
          );
        })}
      </section>
    </div>
  );
}

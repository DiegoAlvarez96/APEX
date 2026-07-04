"use client";

import { Bot, CheckCircle2, GripVertical, Sparkles } from "lucide-react";
import type { ViewKey } from "@/components/layout/BottomNav";
import { enabledModules } from "@/lib/modules";

export function HomeView({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  const modules = enabledModules().filter((module) => module.key !== "home");
  const primary = modules.slice(0, 4);
  const secondary = modules.slice(4);

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-[rgb(var(--muted))]">APEX</p>
        <h1 className="text-3xl font-semibold tracking-normal">Inicio</h1>
      </header>

      <section className="rounded-[28px] bg-[rgb(var(--surface-strong))] p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[rgb(var(--muted))]">Resumen inteligente</p>
            <h2 className="mt-1 text-2xl font-semibold">Tu día en una mano</h2>
            <p className="mt-3 max-w-[19rem] text-sm leading-6 text-[rgb(var(--muted))]">Agenda, hábitos, comida, entrenamiento y stock quedan a un toque, sin cambiar de contexto.</p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[rgb(var(--accent))] text-black">
            <Sparkles size={20} />
          </span>
        </div>
        <button type="button" onClick={() => onNavigate("chat")} className="mt-5 flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--surface))] px-4 text-left">
          <span className="flex items-center gap-3">
            <Bot size={18} className="text-[rgb(var(--accent-2))]" />
            <span>
              <span className="block text-sm font-semibold">Pedir ayuda a IA</span>
              <span className="block text-xs text-[rgb(var(--muted))]">Resumen, recomendación o próxima acción</span>
            </span>
          </span>
          <span className="text-sm text-[rgb(var(--muted))]">Abrir</span>
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {primary.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} className="min-h-32 rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 text-left shadow-soft transition active:scale-[0.98]" onClick={() => onNavigate(item.key)} type="button">
              <Icon className="mb-4 text-[rgb(var(--accent))]" size={22} />
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{item.detail}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-[22px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2 shadow-soft">
        {secondary.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} type="button" onClick={() => onNavigate(item.key)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition hover:bg-[rgb(var(--surface-strong))]">
              <GripVertical size={16} className="text-[rgb(var(--muted))]" />
              <Icon size={19} className="text-[rgb(var(--accent-2))]" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block truncate text-xs text-[rgb(var(--muted))]">{item.detail}</span>
              </span>
              <CheckCircle2 size={17} className="text-[rgb(var(--muted))]" />
            </button>
          );
        })}
      </section>
    </div>
  );
}

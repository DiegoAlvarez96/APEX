"use client";

import { Bot, CheckCircle2, GripVertical, Sparkles } from "lucide-react";
import type { ViewKey } from "@/components/layout/BottomNav";
import { enabledModules } from "@/lib/modules";

export function HomeView({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  const modules = enabledModules().filter((module) => module.key !== "home");
  const primary = modules.slice(0, 4);
  const secondary = modules.slice(4);

  return (
    <div className="space-y-3">
      <header className="px-1 pt-1">
        <p className="text-xs text-[rgb(var(--muted))]">APEX</p>
        <h1 className="text-2xl font-semibold tracking-normal">Inicio</h1>
      </header>

      <section className="rounded-[18px] bg-[rgb(var(--surface-strong))] p-3 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[rgb(var(--muted))]">Resumen inteligente</p>
            <h2 className="mt-1 text-xl font-semibold">Tu dia en una mano</h2>
            <p className="mt-2 max-w-[19rem] text-xs leading-5 text-[rgb(var(--muted))]">Agenda, habitos, comida, entrenamiento y stock a un toque.</p>
          </div>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[rgb(var(--ai))]/25 text-[rgb(var(--ai))]">
            <Sparkles size={17} />
          </span>
        </div>
        <button type="button" onClick={() => onNavigate("chat")} className="mt-2 flex min-h-9 w-full items-center justify-between gap-3 rounded-xl bg-[rgb(var(--surface))] px-3 text-left">
          <span className="flex items-center gap-3">
            <Bot size={17} className="text-[rgb(var(--accent-2))]" />
            <span>
              <span className="block text-sm font-semibold">Pedir ayuda a IA</span>
              <span className="block text-xs text-[rgb(var(--muted))]">Resumen o proxima accion</span>
            </span>
          </span>
          <span className="text-xs text-[rgb(var(--muted))]">Abrir</span>
        </button>
      </section>

      <section className="grid grid-cols-2 gap-1.5">
        {primary.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} className="min-h-[68px] rounded-[14px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2.5 text-left shadow-soft transition active:scale-[0.98]" onClick={() => onNavigate(item.key)} type="button">
              <Icon className="mb-1.5" style={{ color: moduleColor(item.key) }} size={17} />
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-0.5 line-clamp-1 text-[10px] leading-3 text-[rgb(var(--muted))]">{item.detail}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-[14px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1 shadow-soft">
        {secondary.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} type="button" onClick={() => onNavigate(item.key)} className="flex min-h-9 w-full items-center gap-2 rounded-xl px-2 text-left transition hover:bg-[rgb(var(--surface-strong))]">
              <GripVertical size={14} className="text-[rgb(var(--muted))]" />
              <Icon size={15} style={{ color: moduleColor(item.key) }} />
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

function moduleColor(key: ViewKey) {
  if (key === "nutrition") return "rgb(var(--nutrition))";
  if (key === "training") return "rgb(var(--training))";
  if (key === "calendar") return "rgb(var(--agenda))";
  if (key === "ai" || key === "chat") return "rgb(var(--ai))";
  if (key === "dashboard") return "rgb(var(--tasks))";
  if (key === "physical") return "rgb(var(--health))";
  if (key === "shopping" || key === "products") return "rgb(var(--finance))";
  return "rgb(var(--accent-2))";
}

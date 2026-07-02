"use client";

import { CalendarDays, Dumbbell, ListChecks, Package, ShoppingCart, Sparkles, UserRound, Utensils } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import type { ViewKey } from "@/components/layout/BottomNav";

const modules = [
  { view: "dashboard", title: "Skincare", detail: "Rutina actual del dia", icon: Sparkles },
  { view: "calendar", title: "Agenda", detail: "Rutinas, notas y correcciones", icon: CalendarDays },
  { view: "nutrition", title: "Nutricion", detail: "Plan, comidas y bebidas", icon: Utensils },
  { view: "training", title: "Entrenamiento", detail: "Diario de gimnasio", icon: Dumbbell },
  { view: "physical", title: "Mi fisico", detail: "Medidas y fotos", icon: UserRound },
  { view: "products", title: "Stock", detail: "Inventario inteligente", icon: Package },
  { view: "shopping", title: "Compras", detail: "Lista inteligente y sugerencias IA", icon: ShoppingCart },
  { view: "timeline", title: "Historial", detail: "Actividad diaria", icon: ListChecks }
] satisfies { view: ViewKey; title: string; detail: string; icon: typeof Sparkles }[];

export function HomeView({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  return (
    <div className="space-y-5">
      <header className="px-1 pt-2"><p className="text-sm text-white/45 light:text-black/45">APEX</p><h1 className="text-3xl font-semibold">Inicio</h1></header>
      <Card><SectionTitle title="Modulos principales" /><div className="grid grid-cols-2 gap-3">{modules.map((item) => { const Icon = item.icon; return <button key={item.view} className="rounded-3xl bg-white/[0.06] p-4 text-left light:bg-black/[0.04]" onClick={() => onNavigate(item.view)} type="button"><Icon className="mb-3 text-limeglass" size={21} /><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-white/45 light:text-black/45">{item.detail}</p></button>; })}</div></Card>
    </div>
  );
}

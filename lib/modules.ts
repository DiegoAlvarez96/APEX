import {
  Bot,
  CalendarDays,
  Dumbbell,
  Home,
  LineChart,
  ListChecks,
  Package,
  Settings,
  ShoppingCart,
  UserRound,
  Utensils,
  WalletCards
} from "lucide-react";
import type { ViewKey } from "@/components/layout/BottomNav";

export type ModuleKey = Exclude<ViewKey, "health" | "alerts" | "timeline" | "stats" | "sleep">;

export type ApexModule = {
  key: ModuleKey;
  label: string;
  shortLabel: string;
  detail: string;
  group: "core" | "body" | "logistics" | "system";
  position: number;
  enabled: boolean;
  pinned: boolean;
  icon: typeof Home;
};

export const apexModules = [
  { key: "home", label: "Inicio", shortLabel: "Inicio", detail: "Resumen y accesos rapidos", group: "core", position: 0, enabled: true, pinned: false, icon: Home },
  { key: "calendar", label: "Agenda", shortLabel: "Agenda", detail: "Dia, semana, mes y timeline", group: "core", position: 1, enabled: true, pinned: true, icon: CalendarDays },
  { key: "finance", label: "Finanzas", shortLabel: "Gastos", detail: "Registro rapido, categorias e IA", group: "core", position: 2, enabled: true, pinned: true, icon: WalletCards },
  { key: "dashboard", label: "Tareas", shortLabel: "Tareas", detail: "Rutina diaria y pendientes", group: "body", position: 3, enabled: true, pinned: true, icon: ListChecks },
  { key: "nutrition", label: "Nutricion", shortLabel: "Nutri", detail: "Comidas, agua y macros", group: "body", position: 4, enabled: true, pinned: true, icon: Utensils },
  { key: "training", label: "Entrenamiento", shortLabel: "Gym", detail: "Rutinas, series e IA", group: "body", position: 5, enabled: true, pinned: false, icon: Dumbbell },
  { key: "physical", label: "Fisico", shortLabel: "Fisico", detail: "Peso, medidas y evolucion", group: "body", position: 6, enabled: true, pinned: false, icon: UserRound },
  { key: "products", label: "Stock", shortLabel: "Stock", detail: "Inventario y consumo", group: "logistics", position: 7, enabled: true, pinned: false, icon: Package },
  { key: "shopping", label: "Compras", shortLabel: "Compras", detail: "Lista inteligente", group: "logistics", position: 8, enabled: true, pinned: false, icon: ShoppingCart },
  { key: "ai", label: "Insights", shortLabel: "IA", detail: "Alertas y recomendaciones", group: "core", position: 9, enabled: true, pinned: false, icon: LineChart },
  { key: "chat", label: "Chat IA", shortLabel: "Chat", detail: "Asistente integrado", group: "core", position: 10, enabled: true, pinned: false, icon: Bot },
  { key: "settings", label: "Configuracion", shortLabel: "Ajustes", detail: "Tema, modulos y backups", group: "system", position: 11, enabled: true, pinned: false, icon: Settings }
] satisfies ApexModule[];

export function enabledModules() {
  return [...apexModules].filter((module) => module.enabled).sort((a, b) => a.position - b.position);
}

export function pinnedModules() {
  return enabledModules().filter((module) => module.pinned);
}

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

export type ModuleIdentity = {
  token: string;
  label: string;
  mood: string;
  accent: string;
  tint: string;
  strongTint: string;
  border: string;
  gradient: string;
  pageBackground: string;
};

function identity(token: string, label: string, mood: string, secondary = "surface"): ModuleIdentity {
  return {
    token,
    label,
    mood,
    accent: `rgb(var(--${token}))`,
    tint: `rgba(var(--${token}), 0.13)`,
    strongTint: `rgba(var(--${token}), 0.24)`,
    border: `rgba(var(--${token}), 0.28)`,
    gradient: `radial-gradient(circle at 24% 12%, rgba(255,255,255,0.15), transparent 28%), linear-gradient(145deg, rgba(var(--${token}), 0.24), rgba(var(--${secondary}), 0.86) 58%, rgba(var(--surface), 0.92))`,
    pageBackground: `radial-gradient(circle at 50% -16%, rgba(var(--${token}), 0.22), transparent 35%), radial-gradient(circle at 88% 78%, rgba(var(--${token}), 0.09), transparent 28%), radial-gradient(circle at 8% 42%, rgba(var(--ai), 0.05), transparent 24%), rgb(var(--bg))`
  };
}

const moduleIdentities: Record<string, ModuleIdentity> = {
  home: identity("accent-2", "APEX", "ecosistema modular", "surface-strong"),
  calendar: identity("agenda", "Agenda", "planificacion inteligente"),
  dashboard: identity("tasks", "Tareas", "productividad liviana"),
  nutrition: identity("nutrition", "Nutricion", "salud y frescura"),
  training: identity("training", "Entrenamiento", "alto rendimiento", "surface-strong"),
  finance: identity("finance", "Finanzas", "control y confianza", "surface-strong"),
  physical: identity("health", "Salud", "precision y limpieza"),
  health: identity("health", "Salud", "precision y limpieza"),
  products: identity("finance", "Stock", "control operativo"),
  shopping: identity("finance", "Compras", "control operativo"),
  alerts: identity("habits", "Alertas", "prioridad y accion"),
  timeline: identity("routine", "Rutinas", "orden y continuidad"),
  ai: identity("ai", "IA", "inteligencia integrada"),
  chat: identity("ai", "Chat IA", "asistencia fluida"),
  stats: identity("habits", "Habitos", "constancia y progreso"),
  settings: identity("settings", "Configuracion", "sistema minimalista"),
  sleep: identity("sleep", "Sueno", "descanso y calma"),
  profile: identity("profile", "Perfil", "identidad personal")
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

export function getModuleIdentity(key: ViewKey | string) {
  return moduleIdentities[key] ?? moduleIdentities.home;
}

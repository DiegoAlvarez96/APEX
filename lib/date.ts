import type { RoutineSlot } from "@/types/apex";

export const DEFAULT_APP_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const APP_TIME_ZONE = resolveAppTimeZone();

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function resolveAppTimeZone() {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!detected || detected.toUpperCase() === "UTC") return DEFAULT_APP_TIME_ZONE;
  return detected;
}

function zonedParts(date = new Date()): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const get = (type: keyof ZonedParts) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second")
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export const DateTimeService = {
  timeZone: APP_TIME_ZONE,
  now() {
    return new Date();
  },
  nowIso() {
    const parts = zonedParts(new Date());
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
  },
  todayKey() {
    return dateKey(new Date());
  },
  todayDate() {
    return dateFromKey(dateKey(new Date()));
  },
  id(prefix = "id") {
    return `${prefix}-${this.nowIso().replace(/[^0-9]/g, "")}-${Math.random().toString(16).slice(2)}`;
  },
  fromKey(key: string) {
    return dateFromKey(key);
  },
  displayDateTime(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.replace("T", " ");
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: APP_TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }
};

export function dateKey(date = DateTimeService.now()) {
  const { year, month, day } = zonedParts(date);
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function prettyDate(date = DateTimeService.now()) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

export function fullDate(date = DateTimeService.now()) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function slotForHour(date = DateTimeService.now()): RoutineSlot {
  const { hour } = zonedParts(date);
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "night";
}

export function hourInAppTimeZone(date = DateTimeService.now()) {
  return zonedParts(date).hour;
}

export function slotLabel(slot: RoutineSlot) {
  return {
    morning: "Mañana",
    afternoon: "Tarde",
    night: "Noche"
  }[slot];
}

export function addDays(base: Date, days: number) {
  const { year, month, day } = zonedParts(base);
  return new Date(Date.UTC(year, month - 1, day + days, 12));
}

export function weekdayInAppTimeZone(date = DateTimeService.now()) {
  const { year, month, day } = zonedParts(date);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export function dayOfMonth(date: Date) {
  return zonedParts(date).day;
}

export function monthStart(date: Date) {
  const { year, month } = zonedParts(date);
  return new Date(Date.UTC(year, month - 1, 1, 12));
}

export function monthTitle(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: APP_TIME_ZONE,
    month: "long",
    year: "numeric"
  }).format(date);
}

export function shortWeekday(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: APP_TIME_ZONE,
    weekday: "short"
  }).format(date);
}

export function formatDate(date: Date | string): string {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return formatDateKey(date);
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function formatDateKey(key: string): string {
  return formatDate(dateFromKey(key));
}

export function fullDateKey(key: string) {
  return fullDate(dateFromKey(key));
}

import type { RoutineSlot } from "@/types/apex";

export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
};

function zonedParts(date = new Date()): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const get = (type: keyof ZonedParts) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour")
  };
}

export function dateKey(date = new Date()) {
  const { year, month, day } = zonedParts(date);
  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function prettyDate(date = new Date()) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

export function fullDate(date = new Date()) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function slotForHour(date = new Date()): RoutineSlot {
  const { hour } = zonedParts(date);
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "night";
}

export function hourInAppTimeZone(date = new Date()) {
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

export function weekdayInAppTimeZone(date = new Date()) {
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

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return formatDate(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function fullDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return fullDate(new Date(Date.UTC(year, month - 1, day, 12)));
}

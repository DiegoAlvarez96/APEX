import { DateTimeService } from "@/lib/date";
import type { SportCategory, SportProfile, SportSchedule } from "@/types/apex";

export const sportCategoryOptions: Array<{ category: SportCategory; label: string; accent: string; options: string[] }> = [
  { category: "strength", label: "Fuerza", accent: "#d8ff64", options: ["Musculacion", "Powerlifting", "Halterofilia", "CrossFit", "Strongman", "Calistenia", "Street Workout", "Entrenamiento funcional", "TRX", "Kettlebell", "Otro"] },
  { category: "running", label: "Running", accent: "#38bdf8", options: ["Caminata", "Running", "Trail Running", "Sprint", "Fondo", "Ultramaraton", "Cinta", "Otro"] },
  { category: "cycling", label: "Ciclismo", accent: "#60a5fa", options: ["Ruta", "MTB", "Gravel", "BMX", "Indoor Cycling / Spinning", "Triatlon", "Otro"] },
  { category: "swimming", label: "Natacion", accent: "#2dd4bf", options: ["Natacion", "Aguas abiertas", "Natacion master", "Triatlon", "Otro"] },
  { category: "snow", label: "Deportes de nieve", accent: "#93c5fd", options: ["Ski Alpino", "Snowboard", "Freestyle Ski", "Freeride", "Esqui de fondo", "Splitboard", "Otro"] },
  { category: "martial", label: "Artes marciales", accent: "#ef4444", options: ["Boxeo", "Kickboxing", "Muay Thai", "MMA", "Jiu Jitsu Brasileno", "Judo", "Karate", "Taekwondo", "Kung Fu", "Krav Maga", "Otro"] },
  { category: "team", label: "Deportes de equipo", accent: "#22c55e", options: ["Futbol", "Futsal", "Rugby", "Hockey", "Basquet", "Voley", "Handball", "Beisbol", "Softbol", "Cricket", "Lacrosse", "Otro"] },
  { category: "racket", label: "Raqueta", accent: "#38bdf8", options: ["Tenis", "Padel", "Squash", "Badminton", "Pickleball", "Tenis de mesa", "Otro"] },
  { category: "outdoor", label: "Outdoor", accent: "#4ade80", options: ["Trekking", "Senderismo", "Montanismo", "Escalada deportiva", "Boulder", "Escalada tradicional", "Via Ferrata", "Otro"] },
  { category: "water", label: "Deportes acuaticos", accent: "#22d3ee", options: ["Surf", "Windsurf", "Kitesurf", "Wakeboard", "SUP", "Kayak", "Canotaje", "Remo", "Vela", "Buceo", "Snorkel", "Otro"] },
  { category: "gymnastics", label: "Gimnasia", accent: "#f0abfc", options: ["Gimnasia artistica", "Gimnasia ritmica", "Acrobacia", "Parkour", "Otro"] },
  { category: "wellness", label: "Bienestar", accent: "#c4b5fd", options: ["Yoga", "Pilates", "Stretching", "Movilidad", "Respiracion", "Meditacion", "Otro"] },
  { category: "rhythm", label: "Ritmo", accent: "#fb7185", options: ["Baile", "Zumba", "Salsa", "Bachata", "Tango", "Hip Hop", "Otro"] },
  { category: "precision", label: "Precision", accent: "#facc15", options: ["Tiro con arco", "Tiro deportivo", "Dardos", "Otro"] },
  { category: "other", label: "Otros", accent: "#a3a3a3", options: ["Equitacion", "Golf", "Patinaje", "Roller", "Skateboard", "Longboard", "Scooter Freestyle", "Otro"] }
];

export const advancedSportNames = ["Musculacion", "Running", "Calistenia", "CrossFit", "Ciclismo", "Natacion", "Futbol", "Padel", "Tenis", "Ski", "Snowboard", "Yoga", "Boxeo", "MMA", "Trekking"];

export const weekDayLabels = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export function sportCategoryLabel(category: SportCategory) {
  return sportCategoryOptions.find((item) => item.category === category)?.label ?? "Otros";
}

export function sportAccentFor(category: SportCategory, specification?: string) {
  if (specification?.toLowerCase().includes("boxeo") || specification?.toLowerCase().includes("mma")) return "#ef4444";
  return sportCategoryOptions.find((item) => item.category === category)?.accent ?? "#d8ff64";
}

export function isAdvancedSport(specification: string) {
  const normalized = specification.toLowerCase();
  return advancedSportNames.some((sport) => normalized.includes(sport.toLowerCase()));
}

export function defaultSportProfile(): Omit<SportProfile, "id" | "createdAt" | "updatedAt"> {
  const schedule: SportSchedule[] = [{ id: DateTimeService.id("sport-schedule"), weekday: 1, startTime: "19:00", endTime: "20:30", type: "training" }];
  return {
    name: "Musculacion",
    category: "strength",
    specification: "Musculacion",
    schedules: schedule,
    hasFixedSchedule: true,
    goal: "amateur",
    mode: "custom_training",
    status: "active",
    accent: "#d8ff64"
  };
}

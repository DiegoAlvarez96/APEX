import { DateTimeService, weekdayInAppTimeZone } from "@/lib/date";
import type { RoutineDay, RoutineTask } from "@/types/apex";

const morningNormal: Omit<RoutineTask, "id">[] = [
  { label: "Effaclar Gel", slot: "morning", category: "skincare" },
  { label: "Niacinamida ACF", slot: "morning", category: "skincare" },
  { label: "Hydro Boost", slot: "morning", category: "skincare" },
  { label: "Protector Solar FPS50", slot: "morning", category: "skincare" },
  { label: "Minoxidil oral", slot: "morning", category: "medication" }
];

const mondayNight: Omit<RoutineTask, "id">[] = [
  { label: "Effaclar", slot: "night", category: "skincare" },
  { label: "Minoxidil barba", slot: "night", category: "beard" },
  { label: "Esperar 20 minutos", slot: "night", category: "habit" },
  { label: "Hydro Boost", slot: "night", category: "skincare" }
];

const tuesdayNight: Omit<RoutineTask, "id">[] = [
  { label: "Limpiador suave", slot: "night", category: "skincare" },
  { label: "Adapaleno", slot: "night", category: "skincare" },
  { label: "Hydro Boost", slot: "night", category: "skincare" }
];

const thursdayNight: Omit<RoutineTask, "id">[] = [
  { label: "Dermaroller 0.5 mm", slot: "night", category: "beard", note: "Nada mas despues." },
  { label: "Hydro Boost", slot: "night", category: "skincare" }
];

const sundayNight: Omit<RoutineTask, "id">[] = [
  { label: "Acido glicolico", slot: "night", category: "skincare" },
  { label: "Hydro Boost", slot: "night", category: "skincare" }
];

const afternoon: Omit<RoutineTask, "id">[] = [
  { label: "Agua y nutricion", slot: "afternoon", category: "habit" },
  { label: "Gimnasio o movilidad", slot: "afternoon", category: "gym" },
  { label: "Minoxidil topico", slot: "afternoon", category: "beard" }
];

function withIds(weekday: number, tasks: Omit<RoutineTask, "id">[]): RoutineTask[] {
  return tasks.map((task, index) => ({
    ...task,
    id: `${weekday}-${task.slot}-${index}-${task.label.toLowerCase().replace(/\s+/g, "-")}`
  }));
}

export const routineDays: RoutineDay[] = [
  { weekday: 1, label: "Lunes", tasks: withIds(1, [...morningNormal, ...afternoon, ...mondayNight]) },
  { weekday: 2, label: "Martes", tasks: withIds(2, [...morningNormal, ...afternoon, ...tuesdayNight]) },
  { weekday: 3, label: "Miercoles", tasks: withIds(3, [...morningNormal, ...afternoon, ...mondayNight]) },
  { weekday: 4, label: "Jueves", tasks: withIds(4, [...morningNormal, ...afternoon, ...thursdayNight]) },
  { weekday: 5, label: "Viernes", tasks: withIds(5, [...morningNormal, ...afternoon, ...mondayNight]) },
  { weekday: 6, label: "Sabado", tasks: withIds(6, [...morningNormal, ...afternoon, ...tuesdayNight]) },
  { weekday: 0, label: "Domingo", tasks: withIds(0, [...morningNormal, ...afternoon, ...sundayNight]) }
];

export function getRoutineForDate(date = DateTimeService.todayDate()) {
  return routineDays.find((day) => day.weekday === weekdayInAppTimeZone(date)) ?? routineDays[0];
}

export const skincareProducts = [
  { id: "effaclar", name: "Effaclar Gel", order: 1, waitMinutes: 0, active: true },
  { id: "niacinamida", name: "Niacinamida ACF", order: 2, waitMinutes: 2, active: true },
  { id: "adapaleno", name: "Adapaleno", order: 3, waitMinutes: 10, active: true },
  { id: "glicolico", name: "Acido glicolico", order: 4, waitMinutes: 10, active: true },
  { id: "hydro", name: "Hydro Boost", order: 5, waitMinutes: 0, active: true },
  { id: "fps", name: "Protector Solar FPS50", order: 6, waitMinutes: 0, active: true }
];

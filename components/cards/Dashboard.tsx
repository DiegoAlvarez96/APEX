"use client";

import { motion } from "framer-motion";
import { Activity, CalendarCheck, Droplets, Flame, GlassWater, RollerCoaster, Scale, Utensils } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { ProgressRing } from "@/components/cards/ProgressRing";
import { TaskList } from "@/components/cards/TaskList";
import { prettyDate, slotForHour, slotLabel } from "@/lib/date";
import { getRoutineForDate } from "@/lib/routines";
import { formatSleepDuration } from "@/lib/sleep";
import type { NutritionLog, ProductStockSummary, SleepLog, Workout } from "@/types/apex";

export function Dashboard({
  selectedDate,
  isDone,
  onToggle,
  nutrition,
  workouts,
  stockSummaries,
  sleep
}: {
  selectedDate: Date;
  isDone: (taskId: string) => boolean;
  onToggle: (taskId: string) => void;
  nutrition?: NutritionLog;
  workouts: Workout[];
  stockSummaries: ProductStockSummary[];
  sleep?: SleepLog;
}) {
  const routine = getRoutineForDate(selectedDate);
  const currentSlot = slotForHour(new Date());
  const doneCount = routine.tasks.filter((task) => isDone(task.id)).length;
  const progress = routine.tasks.length ? (doneCount / routine.tasks.length) * 100 : 0;
  const oral = routine.tasks.find((task) => task.label.toLowerCase().includes("oral"));
  const criticalStock = stockSummaries.filter((summary) => summary.status !== "ok").length;
  const supplementsLeft = stockSummaries.filter((summary) => /prote|creatina|omega|minoxidil|suplement/i.test(`${summary.product.name} ${summary.product.category}`)).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm font-medium capitalize text-white/50 light:text-black/50">{prettyDate(selectedDate)}</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-normal text-white light:text-black">Buenos dias Diego</h1>
      </header>

      <Card className="flex items-center justify-between gap-5">
        <div>
          <p className="text-sm text-white/50 light:text-black/50">{routine.label}</p>
          <h2 className="mt-1 text-2xl font-semibold">Rutina {slotLabel(currentSlot).toLowerCase()}</h2>
          <p className="mt-3 max-w-[13rem] text-sm leading-6 text-white/55 light:text-black/55">
            {doneCount} de {routine.tasks.length} acciones completadas. El checklist cambia solo cada dia.
          </p>
        </div>
        <ProgressRing value={progress} label="Progreso" />
      </Card>

      {(["morning", "afternoon", "night"] as const).map((slot) => (
        <Card key={slot}>
          <SectionTitle eyebrow={slot === currentSlot ? "Ahora" : undefined} title={slotLabel(slot)} />
          <TaskList tasks={routine.tasks.filter((task) => task.slot === slot)} isDone={isDone} onToggle={onToggle} />
        </Card>
      ))}

      <Card className="flex items-center gap-3 p-4 text-sm text-white/60 light:text-black/60">
        <CalendarCheck className="shrink-0 text-limeglass" size={21} />
        Recordatorios activos: 08:00 rutina manana, 21:00 rutina noche y dermaroller los jueves.
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Metric icon={Scale} label="Peso actual" value={nutrition?.weightKg ? `${nutrition.weightKg} kg` : "-"} />
        <Metric icon={Flame} label="Calorias" value={nutrition ? `${Math.round(nutrition.calories)}` : "-"} />
        <Metric icon={Utensils} label="Proteinas" value={nutrition ? `${Math.round(nutrition.protein)} g` : "-"} />
        <Metric icon={Activity} label="Carbohidratos" value={nutrition ? `${Math.round(nutrition.carbs)} g` : "-"} />
        <Metric icon={Droplets} label="Grasas" value={nutrition ? `${Math.round(nutrition.fat)} g` : "-"} />
        <Metric icon={GlassWater} label="Agua" value={nutrition ? `${(nutrition.waterMl / 1000).toFixed(1)} L` : "-"} />
        <Metric icon={RollerCoaster} label="Entreno realizado" value={workouts.length ? "Si" : "No"} />
        <Metric icon={CalendarCheck} label="Stock critico" value={`${criticalStock}`} />
        <Metric icon={Droplets} label="Minoxidil oral" value={oral && isDone(oral.id) ? "Completo" : "Pendiente"} />
        <Metric icon={RollerCoaster} label="Suplementos" value={`${supplementsLeft}`} />
        <Metric icon={CalendarCheck} label="Sueno" value={sleep ? formatSleepDuration(sleep.durationMinutes) : "-"} />
      </div>
    </motion.div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Scale; label: string; value: string }) {
  return (
    <Card className="p-4">
      <Icon className="mb-3 text-limeglass" size={21} />
      <p className="text-xs text-white/45 light:text-black/45">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold">{value}</p>
    </Card>
  );
}

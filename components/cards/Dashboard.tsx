"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Droplets, RollerCoaster } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { ProgressRing } from "@/components/cards/ProgressRing";
import { TaskList } from "@/components/cards/TaskList";
import { prettyDate, slotForHour, slotLabel } from "@/lib/date";
import { getRoutineForDate } from "@/lib/routines";

export function Dashboard({
  selectedDate,
  isDone,
  onToggle
}: {
  selectedDate: Date;
  isDone: (taskId: string) => boolean;
  onToggle: (taskId: string) => void;
}) {
  const routine = getRoutineForDate(selectedDate);
  const currentSlot = slotForHour(new Date());
  const doneCount = routine.tasks.filter((task) => isDone(task.id)).length;
  const progress = routine.tasks.length ? (doneCount / routine.tasks.length) * 100 : 0;
  const oral = routine.tasks.find((task) => task.label.toLowerCase().includes("oral"));
  const dermaroller = routine.weekday === 4 ? "Hoy" : "Jueves";

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

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <Droplets className="mb-3 text-aqua" size={22} />
          <p className="text-xs text-white/45 light:text-black/45">Minoxidil oral</p>
          <p className="mt-1 text-lg font-semibold">{oral && isDone(oral.id) ? "Completo" : "Pendiente"}</p>
        </Card>
        <Card className="p-4">
          <RollerCoaster className="mb-3 text-coral" size={22} />
          <p className="text-xs text-white/45 light:text-black/45">Dermaroller</p>
          <p className="mt-1 text-lg font-semibold">{dermaroller}</p>
        </Card>
      </div>

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
    </motion.div>
  );
}

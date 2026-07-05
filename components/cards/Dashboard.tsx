"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, CalendarCheck, Check, Circle, Clock, CreditCard, Dumbbell, GlassWater, ListChecks, StickyNote, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Card } from "@/components/ui/Card";
import { DateNavigator } from "@/components/ui/DateNavigator";
import { DateTimeService, dateKey, slotForHour, slotLabel } from "@/lib/date";
import { getRoutineForDate } from "@/lib/routines";
import { sportCategoryLabel } from "@/lib/sports";
import { assignedWorkoutTemplateForDate } from "@/lib/trainingTemplates";
import type { FinanceScheduledPayment, NutritionLog, ProductStockSummary, RoutineTask, SleepLog, SportProfile, Workout, WorkoutTemplate } from "@/types/apex";

type TaskMeta = Record<string, { order?: number; time?: string; note?: string }>;
type TaskItem = {
  id: string;
  title: string;
  time: string;
  description: string;
  source: "routine" | "nutrition" | "training" | "finance" | "habit";
  module: "dashboard" | "nutrition" | "training" | "finance";
  done: boolean;
  routineTask?: RoutineTask;
  finance?: FinanceScheduledPayment;
};

export function Dashboard({
  selectedDate,
  onSelectDate,
  isDone,
  onToggle,
  nutrition,
  workouts,
  stockSummaries,
  sleep,
  workoutTemplates,
  sportProfiles,
  financeScheduledPayments,
  onOpenModule
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  isDone: (taskId: string) => boolean;
  onToggle: (taskId: string) => void;
  nutrition?: NutritionLog;
  workouts: Workout[];
  stockSummaries: ProductStockSummary[];
  sleep?: SleepLog;
  workoutTemplates: WorkoutTemplate[];
  sportProfiles: SportProfile[];
  financeScheduledPayments: FinanceScheduledPayment[];
  onOpenModule: (view: "dashboard" | "nutrition" | "training" | "finance") => void;
}) {
  const routine = getRoutineForDate(selectedDate);
  const selectedDateKey = dateKey(selectedDate);
  const storageKey = `apex-task-meta-${selectedDateKey}`;
  const [meta, setMeta] = useState<TaskMeta>({});
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const assignedWorkout = assignedWorkoutTemplateForDate(selectedDate, workoutTemplates);
  const currentSlot = slotForHour(DateTimeService.now());

  useEffect(() => {
    try {
      setMeta(JSON.parse(localStorage.getItem(storageKey) ?? "{}") as TaskMeta);
    } catch {
      setMeta({});
    }
  }, [storageKey]);

  const routineTasks = useMemo(() => {
    const items = routine.tasks.map((task, index): TaskItem => ({
      id: task.id,
      title: task.label,
      time: meta[task.id]?.time ?? defaultTimeForSlot(task.slot, index),
      description: task.note ?? `${slotLabel(task.slot)} · ${task.category}`,
      source: "routine",
      module: task.category === "gym" ? "training" : task.category === "habit" ? "dashboard" : "dashboard",
      done: isDone(task.id),
      routineTask: task
    }));
    return sortTasks(items, meta);
  }, [isDone, meta, routine.tasks]);

  const freeTasks = useMemo(() => {
    const financeTasks = financeScheduledPayments
      .filter((payment) => payment.dueDateKey === selectedDateKey)
      .map((payment, index): TaskItem => ({
        id: `finance-${payment.id ?? payment.title}`,
        title: payment.title,
        time: meta[`finance-${payment.id ?? payment.title}`]?.time ?? minuteTime(10, index * 10),
        description: payment.extraInfo ?? "Gasto pendiente",
        source: "finance",
        module: "finance",
        done: false,
        finance: payment
      }));
    const stockTasks = stockSummaries
      .filter((summary) => summary.status !== "ok")
      .slice(0, 3)
      .map((summary, index): TaskItem => ({
        id: `stock-${summary.product.id ?? summary.product.name}`,
        title: `Comprar ${summary.product.name}`,
        time: meta[`stock-${summary.product.id ?? summary.product.name}`]?.time ?? minuteTime(17, index * 10),
        description: `Stock ${summary.status} · ${Math.round(summary.percent)}%`,
        source: "habit",
        module: "dashboard",
        done: false
      }));
    const sportTasks = sportProfiles
      .filter((profile) => profile.status === "active")
      .flatMap((profile) => profile.schedules
        .filter((schedule) => schedule.weekday === selectedDate.getDay())
        .map((schedule): TaskItem => ({
          id: `sport-${profile.id ?? profile.name}-${schedule.id}`,
          title: profile.name,
          time: schedule.startTime,
          description: `${sportCategoryLabel(profile.category)} · ${schedule.endTime} · ${schedule.type === "competition" ? "Competicion" : profile.mode === "custom_training" ? "IA activa" : "Solo card"}`,
          source: "training",
          module: "training",
          done: false
        })));
    const generated: TaskItem[] = [
      {
        id: "free-water",
        title: "Agua",
        time: meta["free-water"]?.time ?? "12:00",
        description: nutrition ? `${(nutrition.waterMl / 1000).toFixed(1)} L registrados` : "Registrar agua",
        source: "nutrition",
        module: "nutrition",
        done: Boolean(nutrition && nutrition.waterMl >= 2000)
      },
      {
        id: "free-sleep",
        title: "Sueño",
        time: meta["free-sleep"]?.time ?? "22:30",
        description: sleep ? `${Math.round(sleep.durationMinutes / 60)} h registradas` : "Preparar descanso",
        source: "habit",
        module: "dashboard",
        done: Boolean(sleep)
      }
    ];
    return sortTasks([...financeTasks, ...stockTasks, ...sportTasks, ...generated], meta);
  }, [financeScheduledPayments, meta, nutrition, selectedDate, selectedDateKey, sleep, sportProfiles, stockSummaries]);

  function saveMeta(next: TaskMeta) {
    setMeta(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("apex-task-meta-updated", { detail: { dateKey: selectedDateKey } }));
  }

  function updateTaskMeta(taskId: string, patch: TaskMeta[string]) {
    saveMeta({ ...meta, [taskId]: { ...meta[taskId], ...patch } });
  }

  function moveTask(list: TaskItem[], taskId: string, direction: -1 | 1) {
    const index = list.findIndex((item) => item.id === taskId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= list.length) return;
    const next = [...list];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    const nextMeta = { ...meta };
    next.forEach((item, order) => {
      nextMeta[item.id] = { ...nextMeta[item.id], order };
    });
    saveMeta(nextMeta);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <DateNavigator title="Tareas" eyebrow="Rutina y tareas del dia" selectedDate={selectedDate} onSelectDate={onSelectDate} />

      <Card className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[rgb(var(--muted))]">{routine.label}</p>
            <h2 className="text-lg font-semibold">Rutina {slotLabel(currentSlot).toLowerCase()}</h2>
          </div>
          <div className="rounded-xl bg-[rgb(var(--tasks))]/16 px-3 py-2 text-right text-[rgb(var(--tasks))]">
            <p className="text-[10px] font-semibold">Progreso</p>
            <p className="text-sm font-bold">{routineTasks.filter((task) => task.done).length}/{routineTasks.length}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <TaskColumn
          title="Rutina"
          tone="rgb(var(--tasks))"
          items={routineTasks}
          onOpen={setSelectedTask}
          onMove={(id, direction) => moveTask(routineTasks, id, direction)}
        />
        <TaskColumn
          title="Tareas"
          tone="rgb(var(--habits))"
          items={freeTasks}
          onOpen={setSelectedTask}
          onMove={(id, direction) => moveTask(freeTasks, id, direction)}
        />
      </div>

      <BottomSheet open={Boolean(selectedTask)} title={selectedTask?.title ?? "Tarea"} eyebrow={selectedTask?.time} onClose={() => setSelectedTask(null)}>
        {selectedTask ? (
          <TaskDetail
            task={selectedTask}
            meta={meta[selectedTask.id]}
            nutrition={nutrition}
            assignedWorkout={assignedWorkout}
            onToggle={() => selectedTask.routineTask ? onToggle(selectedTask.routineTask.id) : undefined}
            onOpenModule={() => onOpenModule(selectedTask.module)}
            onChangeTime={(time) => updateTaskMeta(selectedTask.id, { time })}
            onChangeNote={(note) => updateTaskMeta(selectedTask.id, { note })}
          />
        ) : null}
      </BottomSheet>
    </motion.div>
  );
}

function TaskColumn({
  title,
  tone,
  items,
  onOpen,
  onMove
}: {
  title: string;
  tone: string;
  items: TaskItem[];
  onOpen: (task: TaskItem) => void;
  onMove: (taskId: string, direction: -1 | 1) => void;
}) {
  return (
    <section className="min-h-[54vh] rounded-[18px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2 shadow-soft">
      <div className="mb-2 rounded-xl px-2 py-1.5" style={{ backgroundColor: colorMix(tone, 0.16), color: tone }}>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-xl bg-[rgb(var(--surface-strong))] p-2">
            <button type="button" className="flex w-full items-start gap-2 text-left" onClick={() => onOpen(item)}>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full" style={{ color: item.done ? "black" : tone, backgroundColor: item.done ? tone : colorMix(tone, 0.14) }}>
                {item.done ? <Check size={11} /> : <Circle size={11} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{item.title}</span>
                <span className="block truncate text-[10px] text-[rgb(var(--muted))]">{item.time} · {item.description}</span>
              </span>
            </button>
            <div className="mt-1 flex justify-end gap-1">
              <button type="button" className="grid size-6 place-items-center rounded-lg bg-black/10 light:bg-white/70" onClick={() => onMove(item.id, -1)} disabled={index === 0} aria-label="Subir tarea"><ArrowUp size={11} /></button>
              <button type="button" className="grid size-6 place-items-center rounded-lg bg-black/10 light:bg-white/70" onClick={() => onMove(item.id, 1)} disabled={index === items.length - 1} aria-label="Bajar tarea"><ArrowDown size={11} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TaskDetail({
  task,
  meta,
  nutrition,
  assignedWorkout,
  onToggle,
  onOpenModule,
  onChangeTime,
  onChangeNote
}: {
  task: TaskItem;
  meta?: TaskMeta[string];
  nutrition?: NutritionLog;
  assignedWorkout: WorkoutTemplate;
  onToggle: () => void;
  onOpenModule: () => void;
  onChangeTime: (time: string) => void;
  onChangeNote: (note: string) => void;
}) {
  const note = meta?.note ?? "";
  return (
    <div className="space-y-3">
      <button type="button" className="w-full text-left" onClick={onOpenModule}>
        <h3 className="text-base font-semibold">{task.title}</h3>
        <p className="text-xs text-[rgb(var(--muted))]">Tocar titulo abre el modulo completo</p>
      </button>
      <div className="grid grid-cols-2 gap-2">
        <Info icon={Clock} label="Horario" value={task.time} />
        <Info icon={CalendarCheck} label="Estado" value={task.done ? "Completada" : "Pendiente"} />
      </div>
      <label className="block rounded-xl bg-[rgb(var(--surface))] p-3">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Cambiar hora</span>
        <input className="w-full bg-transparent text-sm outline-none" type="time" step={300} value={task.time} onChange={(event) => onChangeTime(event.target.value)} />
      </label>
      <label className="block rounded-xl bg-[rgb(var(--surface))] p-3">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Texto libre</span>
        <textarea className="min-h-20 w-full bg-transparent text-sm outline-none" value={note} onChange={(event) => onChangeNote(event.target.value)} placeholder="Agregar nota..." />
      </label>
      <RelatedInfo task={task} nutrition={nutrition} assignedWorkout={assignedWorkout} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="h-10 rounded-xl bg-[rgb(var(--module-accent))] text-sm font-semibold text-[rgb(var(--bg))]" onClick={onToggle}>Cambiar estado</button>
        <button type="button" className="h-10 rounded-xl bg-[rgb(var(--surface))] text-sm font-semibold" onClick={onOpenModule}>Abrir modulo</button>
      </div>
    </div>
  );
}

function RelatedInfo({ task, nutrition, assignedWorkout }: { task: TaskItem; nutrition?: NutritionLog; assignedWorkout: WorkoutTemplate }) {
  if (task.finance) {
    return (
      <div className="rounded-xl bg-[rgb(var(--surface))] p-3">
        <p className="mb-2 text-xs font-semibold">Gasto pendiente</p>
        <div className="grid grid-cols-2 gap-2">
          <Info icon={CreditCard} label="Monto" value={`${task.finance.currency} ${task.finance.amount}`} />
          <Info icon={StickyNote} label="Fecha" value={task.finance.dueDateKey} />
          <Info icon={ListChecks} label="Categoria" value="Pendiente" />
          <Info icon={Circle} label="Pago" value="No pagado" />
        </div>
      </div>
    );
  }
  if (task.source === "nutrition") {
    const items = nutrition?.planItems?.slice(0, 6) ?? [];
    return (
      <div className="rounded-xl bg-[rgb(var(--surface))] p-3">
        <p className="mb-2 text-xs font-semibold">Comidas sugeridas</p>
        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto">
          {items.length ? items.map((item) => (
            <div key={item.id} className="min-w-[132px] snap-center rounded-xl bg-[rgb(var(--nutrition))]/14 p-3">
              <p className="truncate text-xs font-semibold">{item.meal}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-[rgb(var(--muted))]">{item.name}</p>
              <p className="mt-2 text-[10px]">{item.done ? "Completada" : "Pendiente"}</p>
            </div>
          )) : <p className="text-xs text-[rgb(var(--muted))]">Sin plan cargado para este dia.</p>}
        </div>
      </div>
    );
  }
  if (task.source === "training" || task.routineTask?.category === "gym") {
    return (
      <div className="rounded-xl bg-[rgb(var(--surface))] p-3">
        <p className="mb-2 text-xs font-semibold">Rutina sugerida</p>
        <p className="text-sm font-semibold">{assignedWorkout.group}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{assignedWorkout.focus}</p>
        <div className="mt-2 space-y-1">
          {assignedWorkout.exercises.slice(0, 5).map((exercise) => (
            <div key={exercise.id} className="rounded-lg bg-[rgb(var(--training))]/14 px-2 py-1.5 text-xs">{exercise.name} · {exercise.sets.length} series</div>
          ))}
        </div>
      </div>
    );
  }
  return <p className="rounded-xl bg-[rgb(var(--surface))] p-3 text-xs text-[rgb(var(--muted))]">{task.description}</p>;
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[rgb(var(--surface))] p-2">
      <div className="flex items-center gap-1 text-[10px] text-[rgb(var(--muted))]"><Icon size={11} />{label}</div>
      <p className="mt-1 truncate text-xs font-semibold">{value}</p>
    </div>
  );
}

function sortTasks(items: TaskItem[], meta: TaskMeta) {
  return [...items].sort((a, b) => (meta[a.id]?.order ?? 999) - (meta[b.id]?.order ?? 999) || a.time.localeCompare(b.time));
}

function defaultTimeForSlot(slot: RoutineTask["slot"], index: number) {
  if (slot === "morning") return minuteTime(8, index * 5);
  if (slot === "afternoon") return minuteTime(13, index * 5);
  return minuteTime(21, index * 5);
}

function minuteTime(hour: number, offsetMinutes: number) {
  const total = hour * 60 + offsetMinutes;
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function colorMix(color: string, opacity: number) {
  return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
}

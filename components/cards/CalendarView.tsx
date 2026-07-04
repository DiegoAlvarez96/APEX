"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TaskList } from "@/components/cards/TaskList";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { addDays, dateKey, dayOfMonth, fullDate, monthStart, monthTitle, weekdayInAppTimeZone } from "@/lib/date";
import { buildAgendaDetail } from "@/lib/agenda";
import { getRoutineForDate } from "@/lib/routines";
import { formatSleepDuration } from "@/lib/sleep";
import { assignedWorkoutTemplateForDate } from "@/lib/trainingTemplates";
import type { BodyMeasurement, FinanceScheduledPayment, NutritionLog, ProductStockSummary, SleepLog, Workout, WorkoutTemplate } from "@/types/apex";
import type { ViewKey } from "@/components/layout/BottomNav";

export function CalendarView({
  selectedDate,
  onSelectDate,
  mode,
  onModeChange,
  workouts,
  stockSummaries,
  nutrition,
  bodyMeasurements,
  workoutTemplates,
  financeScheduledPayments,
  previousSleep,
  note,
  onSaveNote,
  onOpenModule,
  isDone,
  onToggle
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  mode: "week" | "month";
  onModeChange: (mode: "week" | "month") => void;
  workouts: Workout[];
  stockSummaries: ProductStockSummary[];
  nutrition?: NutritionLog;
  bodyMeasurements: BodyMeasurement[];
  workoutTemplates: WorkoutTemplate[];
  financeScheduledPayments: FinanceScheduledPayment[];
  previousSleep?: SleepLog;
  note?: string;
  onSaveNote: (note: string) => void;
  onOpenModule: (view: ViewKey) => void;
  isDone: (taskId: string) => boolean;
  onToggle: (taskId: string) => void;
}) {
  const [draftNote, setDraftNote] = useState(note ?? "");
  const [sheet, setSheet] = useState<"dashboard" | "nutrition" | "training" | "physical" | null>(null);
  const [displayMode, setDisplayMode] = useState<"day" | "week" | "month" | "timeline">(mode);
  const selectedDateKey = dateKey(selectedDate);
  const selectedDateLabel = fullDate(selectedDate);
  const previousDateLabel = fullDate(addDays(selectedDate, -1));
  const workoutsForDay = workouts.filter((workout) => workout.dateKey === selectedDateKey);
  const detail = buildAgendaDetail(selectedDate, workoutsForDay, stockSummaries);
  const routine = getRoutineForDate(selectedDate);
  const skincareTasks = routine.tasks.filter((task) => task.category === "skincare" || task.category === "beard" || task.category === "hair");
  const assignedWorkout = assignedWorkoutTemplateForDate(selectedDate, workoutTemplates);
  const bodyForDay = bodyMeasurements.find((measurement) => measurement.dateKey === selectedDateKey);
  const financePaymentsForDay = financeScheduledPayments.filter((payment) => payment.dueDateKey === selectedDateKey);
  const currentHour = new Date().getHours();
  const currentMinutes = currentHour * 60 + new Date().getMinutes();
  const dayProgressPct = Math.round((currentMinutes / 1440) * 100);
  const agendaBackground = agendaGradient(currentHour);
  const timelineItems = buildDayTimelineItems({
    skincareDone: skincareTasks.filter((task) => isDone(task.id)).length,
    skincareTotal: skincareTasks.length,
    nutrition,
    workoutsForDay,
    assignedWorkout,
    previousSleep,
    bodyForDay
  });

  useEffect(() => {
    setDraftNote(note ?? "");
  }, [note, selectedDate]);

  useEffect(() => {
    if (displayMode === "week" || displayMode === "month") onModeChange(displayMode);
  }, [displayMode, onModeChange]);

  const days =
    displayMode === "week" || displayMode === "day"
      ? Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - weekdayInAppTimeZone(selectedDate)))
      : Array.from({ length: 35 }, (_, index) => {
          const start = monthStart(selectedDate);
          return addDays(start, index - weekdayInAppTimeZone(start));
        });

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between px-1 pt-1">
        <div>
          <p className="text-xs text-[rgb(var(--muted))]">Calendario</p>
          <h1 className="text-2xl font-semibold">Agenda APEX</h1>
        </div>
        <div className="flex gap-2">
          <button className="grid size-8 place-items-center rounded-full glass" onClick={() => onSelectDate(addDays(selectedDate, -7))} aria-label="Semana anterior">
            <ChevronLeft size={16} />
          </button>
          <button className="grid size-8 place-items-center rounded-full glass" onClick={() => onSelectDate(addDays(selectedDate, 7))} aria-label="Semana siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <SegmentedControl value={displayMode} onChange={setDisplayMode} options={[{ value: "day", label: "Dia" }, { value: "week", label: "Semana" }, { value: "month", label: "Mes" }, { value: "timeline", label: "Timeline" }]} />

      {displayMode === "week" ? (
        <WeekTeamsView
          days={days}
          selectedDateKey={selectedDateKey}
          workouts={workouts}
          nutrition={nutrition}
          onSelectDate={onSelectDate}
          onOpen={setSheet}
        />
      ) : (
        <Card className="p-3" style={{ background: agendaBackground }}>
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Vista</p>
            <h2 className="text-base font-semibold text-white">{monthTitle(selectedDate)}</h2>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/55">
            {["D", "L", "M", "M", "J", "V", "S"].map((day, index) => (
              <div key={`${day}-${index}`}>{day}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const active = dateKey(day) === selectedDateKey;
              const routine = getRoutineForDate(day);
              return (
                <button
                  key={dateKey(day)}
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={`aspect-square rounded-xl p-1 text-center transition ${
                    active ? "bg-limeglass text-black" : "bg-[rgb(var(--surface-strong))] text-[rgb(var(--text))] hover:brightness-110"
                  }`}
                >
                  <span className="block text-xs font-semibold">{dayOfMonth(day)}</span>
                  <span className="mx-auto mt-1 block size-1.5 rounded-full bg-current opacity-40" aria-label={`${routine.tasks.length} items`} />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {displayMode === "day" || displayMode === "timeline" ? (
        <DayTimeline
          background={agendaBackground}
          dateLabel={selectedDateLabel}
          currentMinutes={currentMinutes}
          progress={dayProgressPct}
          items={timelineItems}
          onOpen={setSheet}
        />
      ) : null}

      <CompactDisclosure title="Resumen del dia" eyebrow={`${dayProgressPct}% consumido`}>
        <div className="grid grid-cols-2 gap-2">
          <button className="w-full text-left" type="button" onClick={() => setSheet("dashboard")}><AgendaMetric label="Tareas" value={`${skincareTasks.filter((task) => isDone(task.id)).length}/${skincareTasks.length}`} /></button>
          <button className="w-full text-left" type="button" onClick={() => setSheet("nutrition")}><AgendaMetric label="Nutricion" value={nutrition ? `${Math.round(nutrition.calories)} kcal` : "Sin cargar"} /></button>
          <button className="w-full text-left" type="button" onClick={() => setSheet("training")}><AgendaMetric label="Entreno" value={workoutsForDay.length ? `${workoutsForDay.length}` : assignedWorkout.group} /></button>
          <button className="w-full text-left" type="button" onClick={() => setSheet("physical")}><AgendaMetric label="Fisico" value={bodyForDay ? `${bodyForDay.weightKg} kg` : "Sin cargar"} /></button>
        </div>
        <div className="mt-2 space-y-2">
          <AgendaBlock title="Suplementos" items={detail.supplements} />
          <AgendaBlock title="Habitos" items={detail.habits} />
          <AgendaBlock title="Pagos" items={financePaymentsForDay.map((payment) => `${payment.title} - ${payment.currency} ${payment.amount}`)} />
          <AgendaBlock title="Notas" items={detail.notes} />
        </div>
      </CompactDisclosure>

      <div className="grid gap-2 md:grid-cols-2">
        <NutritionAgendaCard nutrition={nutrition} selectedDateLabel={selectedDateLabel} onOpen={() => onOpenModule("nutrition")} />

        <TrainingAgendaCard workouts={workoutsForDay} assigned={assignedWorkout} selectedDateLabel={selectedDateLabel} onOpen={() => onOpenModule("training")} />

        <BodyAgendaCard measurement={bodyForDay} selectedDateLabel={selectedDateLabel} onOpen={() => onOpenModule("physical")} />

        <SleepAgendaCard sleep={previousSleep} previousDateLabel={previousDateLabel} />
      </div>

      <CompactDisclosure title="Corregir dia" eyebrow="Editable historicamente">
        <TaskList tasks={routine.tasks} isDone={isDone} onToggle={onToggle} />
        <textarea className="mt-2 min-h-20 w-full rounded-xl bg-white/[0.08] px-3 py-2 text-xs outline-none light:bg-black/[0.05]" value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="Notas, correcciones, objetivos o actividades del dia" />
        <button className="mt-2 h-9 w-full rounded-xl bg-limeglass text-xs font-semibold text-black" type="button" onClick={() => onSaveNote(draftNote)}>Guardar nota</button>
      </CompactDisclosure>

      <BottomSheet open={sheet !== null} title={sheetTitle(sheet)} eyebrow={selectedDateLabel} onClose={() => setSheet(null)}>
        {sheet === "dashboard" ? (
          <div className="space-y-3">
            <button type="button" className="w-full text-left" onClick={() => onOpenModule("dashboard")}>
              <h3 className="text-sm font-semibold">Abrir Tareas completo</h3>
              <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">Toca el titulo para editar toda la rutina.</p>
            </button>
            <TaskList tasks={skincareTasks} isDone={isDone} onToggle={onToggle} />
          </div>
        ) : null}
        {sheet === "nutrition" ? (
          <SheetSummary onOpen={() => onOpenModule("nutrition")} title="Abrir Nutricion completa" rows={[
            ["Calorias", nutrition ? `${Math.round(nutrition.calories)} kcal` : "Sin cargar"],
            ["Proteina", nutrition ? `${Math.round(nutrition.protein)} g` : "-"],
            ["Agua", nutrition ? `${(nutrition.waterMl / 1000).toFixed(1)} L` : "-"]
          ]} />
        ) : null}
        {sheet === "training" ? (
          <SheetSummary onOpen={() => onOpenModule("training")} title="Abrir Entrenamiento completo" rows={[
            ["Plan", assignedWorkout.group],
            ["Foco", assignedWorkout.focus],
            ["Registrados", `${workoutsForDay.length}`]
          ]} />
        ) : null}
        {sheet === "physical" ? (
          <SheetSummary onOpen={() => onOpenModule("physical")} title="Abrir Fisico completo" rows={[
            ["Peso", bodyForDay ? `${bodyForDay.weightKg} kg` : "Sin cargar"],
            ["Cintura", bodyForDay?.waistCm ? `${bodyForDay.waistCm} cm` : "-"],
            ["Grasa", bodyForDay?.bodyFatPercent ? `${bodyForDay.bodyFatPercent}%` : "-"]
          ]} />
        ) : null}
      </BottomSheet>
    </div>
  );
}

function AgendaMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/18 p-2.5 ring-1 ring-white/8 light:bg-white/55">
      <p className="text-[11px] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function agendaGradient(hour: number) {
  if (hour >= 5 && hour < 11) return "linear-gradient(180deg, rgba(42, 68, 92, 0.92) 0%, rgba(29, 38, 48, 0.95) 48%, rgba(18, 20, 25, 0.98) 100%)";
  if (hour >= 11 && hour < 17) return "linear-gradient(180deg, rgba(52, 74, 86, 0.92) 0%, rgba(43, 55, 57, 0.95) 45%, rgba(19, 22, 26, 0.98) 100%)";
  if (hour >= 17 && hour < 21) return "linear-gradient(180deg, rgba(81, 54, 74, 0.95) 0%, rgba(58, 45, 63, 0.95) 48%, rgba(18, 20, 25, 0.98) 100%)";
  return "linear-gradient(180deg, rgba(22, 28, 50, 0.96) 0%, rgba(18, 22, 36, 0.98) 48%, rgba(9, 10, 12, 1) 100%)";
}

type TimelineModule = "dashboard" | "nutrition" | "training" | "physical";

type DayTimelineItem = {
  time: string;
  title: string;
  detail: string;
  color: string;
  module: TimelineModule;
  done?: boolean;
};

function DayTimeline({
  background,
  dateLabel,
  currentMinutes,
  progress,
  items,
  onOpen
}: {
  background: string;
  dateLabel: string;
  currentMinutes: number;
  progress: number;
  items: DayTimelineItem[];
  onOpen: (module: TimelineModule) => void;
}) {
  const startHour = 8;
  const endHour = 23;
  const currentTop = clamp(((currentMinutes - startHour * 60) / ((endHour - startHour) * 60)) * 100, 0, 100);
  const now = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date());

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/10 p-3 shadow-soft" style={{ background }}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Hoy</p>
          <h2 className="text-sm font-semibold text-white">{dateLabel}</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/55">Dia</p>
          <p className="text-xs font-semibold text-white">{progress}%</p>
        </div>
      </div>
      <div className="relative h-[360px] overflow-hidden rounded-2xl bg-black/18 ring-1 ring-white/8">
        <div className="absolute inset-x-0 top-0 bg-white/[0.075]" style={{ height: `${currentTop}%` }} />
        {[8, 10, 12, 14, 16, 18, 20, 22].map((hour) => (
          <div key={hour} className="absolute left-0 right-0 border-t border-white/[0.06]" style={{ top: `${((hour - startHour) / (endHour - startHour)) * 100}%` }}>
            <span className="absolute -top-2 left-2 text-[9px] font-semibold text-white/40">{`${hour}:00`}</span>
          </div>
        ))}
        {items.map((item) => {
          const top = clamp(((parseTime(item.time) - startHour * 60) / ((endHour - startHour) * 60)) * 100, 1, 92);
          return (
            <button key={`${item.time}-${item.title}`} type="button" onClick={() => onOpen(item.module)} className="absolute left-12 right-2 flex min-h-11 items-center gap-2 rounded-xl bg-black/20 px-2 py-1.5 text-left ring-1 ring-white/8 backdrop-blur" style={{ top: `${top}%` }}>
              <span className="grid size-5 shrink-0 place-items-center rounded-full" style={{ color: item.color, backgroundColor: "rgba(255,255,255,0.08)" }}>
                {item.done ? "✓" : "○"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-white">{item.title}</span>
                <span className="block truncate text-[10px] text-white/55">{item.detail}</span>
              </span>
              <span className="text-[10px] font-semibold" style={{ color: item.color }}>{item.time}</span>
            </button>
          );
        })}
        <div className="absolute left-0 right-0 z-10 border-t border-[#ff6f3d] shadow-[0_0_18px_rgba(255,111,61,0.65)]" style={{ top: `${currentTop}%` }}>
          <span className="absolute -top-2 left-1 rounded-full bg-[#ff6f3d] px-1.5 py-0.5 text-[9px] font-bold text-black">{now}</span>
        </div>
      </div>
    </section>
  );
}

function WeekTeamsView({
  days,
  selectedDateKey,
  workouts,
  nutrition,
  onSelectDate,
  onOpen
}: {
  days: Date[];
  selectedDateKey: string;
  workouts: Workout[];
  nutrition?: NutritionLog;
  onSelectDate: (date: Date) => void;
  onOpen: (module: TimelineModule) => void;
}) {
  const hours = [8, 10, 12, 14, 16, 18, 20, 22];
  const visibleDays = days.slice(0, 7);

  return (
    <section className="overflow-hidden rounded-[18px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-soft">
      <div className="grid grid-cols-[38px_repeat(7,minmax(42px,1fr))] border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-strong))]">
        <div className="p-1.5 text-[9px] text-[rgb(var(--muted))]">Hora</div>
        {visibleDays.map((day) => {
          const key = dateKey(day);
          const active = key === selectedDateKey;
          return (
            <button key={key} type="button" onClick={() => onSelectDate(day)} className={`p-1.5 text-center ${active ? "bg-limeglass text-black" : ""}`}>
              <span className="block text-[9px] font-semibold">{["D", "L", "M", "M", "J", "V", "S"][day.getUTCDay()]}</span>
              <span className="block text-xs font-bold">{dayOfMonth(day)}</span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-[38px_repeat(7,minmax(42px,1fr))]">
        {hours.map((hour) => (
          <WeekRow key={hour} hour={hour} days={visibleDays} workouts={workouts} nutrition={nutrition} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function WeekRow({
  hour,
  days,
  workouts,
  nutrition,
  onOpen
}: {
  hour: number;
  days: Date[];
  workouts: Workout[];
  nutrition?: NutritionLog;
  onOpen: (module: TimelineModule) => void;
}) {
  return (
    <>
      <div className="min-h-16 border-b border-r border-[rgb(var(--border))] px-1 py-2 text-[9px] font-semibold text-[rgb(var(--muted))]">{hour}:00</div>
      {days.map((day) => {
        const key = dateKey(day);
        const routine = getRoutineForDate(day);
        const dayWorkouts = workouts.filter((workout) => workout.dateKey === key);
        const blocks = weekBlocksForHour(hour, routine.tasks.length, dayWorkouts, nutrition && nutrition.dateKey === key ? nutrition : undefined);
        return (
          <div key={`${key}-${hour}`} className="min-h-16 border-b border-r border-[rgb(var(--border))] p-1">
            <div className="space-y-1">
              {blocks.map((block) => (
                <button key={`${block.title}-${hour}`} type="button" onClick={() => onOpen(block.module)} className="block w-full rounded-md px-1.5 py-1 text-left text-[9px] font-semibold leading-3 text-black" style={{ backgroundColor: block.color }}>
                  <span className="block truncate">{block.title}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function weekBlocksForHour(hour: number, routineCount: number, workouts: Workout[], nutrition?: NutritionLog) {
  const blocks: { title: string; color: string; module: TimelineModule }[] = [];
  if (hour === 8) blocks.push({ title: `Rutina ${routineCount}`, color: "#86efac", module: "dashboard" });
  if (hour === 12) blocks.push({ title: nutrition ? `${Math.round(nutrition.calories)} kcal` : "Comida", color: "#93c5fd", module: "nutrition" });
  if (hour === 18) blocks.push({ title: workouts[0]?.title ?? "Gym", color: "#c4b5fd", module: "training" });
  if (hour === 20) blocks.push({ title: "Tareas", color: "#fcd34d", module: "dashboard" });
  return blocks;
}

function CompactDisclosure({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <details className="group rounded-[16px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span>
          {eyebrow ? <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{eyebrow}</span> : null}
          <span className="block text-sm font-semibold">{title}</span>
        </span>
        <ChevronDown className="transition group-open:rotate-180" size={14} />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function buildDayTimelineItems({
  skincareDone,
  skincareTotal,
  nutrition,
  workoutsForDay,
  assignedWorkout,
  previousSleep,
  bodyForDay
}: {
  skincareDone: number;
  skincareTotal: number;
  nutrition?: NutritionLog;
  workoutsForDay: Workout[];
  assignedWorkout: WorkoutTemplate;
  previousSleep?: SleepLog;
  bodyForDay?: BodyMeasurement;
}): DayTimelineItem[] {
  return [
    {
      time: "09:00",
      title: "Tareas",
      detail: `${skincareDone}/${skincareTotal} pasos completados`,
      color: "#22c55e",
      module: "dashboard",
      done: skincareTotal > 0 && skincareDone === skincareTotal
    },
    {
      time: "10:30",
      title: "Nutricion",
      detail: nutrition ? `${Math.round(nutrition.calories)} kcal · ${Math.round(nutrition.protein)}g proteina` : "Registrar primera comida",
      color: "#60a5fa",
      module: "nutrition",
      done: Boolean(nutrition)
    },
    {
      time: "13:00",
      title: "Almuerzo",
      detail: nutrition?.meals?.[0]?.name ?? "Planificar comida",
      color: "#f59e0b",
      module: "nutrition",
      done: Boolean(nutrition?.meals?.length)
    },
    {
      time: "18:00",
      title: "Entrenamiento",
      detail: workoutsForDay[0]?.title ?? `${assignedWorkout.group} · ${assignedWorkout.focus}`,
      color: "#a78bfa",
      module: "training",
      done: workoutsForDay.some((workout) => workout.completed)
    },
    {
      time: "20:30",
      title: "Fisico",
      detail: bodyForDay ? `${bodyForDay.weightKg} kg registrado` : "Peso o medidas pendientes",
      color: "#14b8a6",
      module: "physical",
      done: Boolean(bodyForDay)
    },
    {
      time: "22:30",
      title: "Descanso",
      detail: previousSleep ? formatSleepDuration(previousSleep.durationMinutes) : "Preparar sueño",
      color: "#38bdf8",
      module: "dashboard",
      done: Boolean(previousSleep)
    }
  ];
}

function parseTime(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sheetTitle(sheet: "dashboard" | "nutrition" | "training" | "physical" | null) {
  if (sheet === "dashboard") return "Tareas";
  if (sheet === "nutrition") return "Nutricion";
  if (sheet === "training") return "Entrenamiento";
  if (sheet === "physical") return "Fisico";
  return "Detalle";
}

function SheetSummary({ title, rows, onOpen }: { title: string; rows: [string, string][]; onOpen: () => void }) {
  return (
    <div className="space-y-3">
      <button type="button" className="w-full text-left" onClick={onOpen}>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">Toca el titulo para ver o editar el modulo completo.</p>
      </button>
      <div className="grid grid-cols-2 gap-2">
        {rows.map(([label, value]) => <AgendaMetric key={label} label={label} value={value} />)}
      </div>
    </div>
  );
}

function NutritionAgendaCard({ nutrition, selectedDateLabel, onOpen }: { nutrition?: NutritionLog; selectedDateLabel: string; onOpen: () => void }) {
  const planTotal = nutrition?.planItems?.length ?? 0;
  const planDone = nutrition?.planItems?.filter((item) => item.done).length ?? 0;
  return (
    <CompactDisclosure title="Nutricion" eyebrow={nutrition ? `${Math.round(nutrition.calories)} kcal` : selectedDateLabel}>
      <button className="mb-2 w-full rounded-xl bg-[rgb(var(--surface-strong))] px-3 py-2 text-left text-xs font-semibold" type="button" onClick={onOpen}>
        Abrir modulo completo
      </button>
      {nutrition ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <AgendaMetric label="Calorias" value={`${Math.round(nutrition.calories)} kcal`} />
            <AgendaMetric label="Proteina" value={`${Math.round(nutrition.protein)} g`} />
            <AgendaMetric label="Carbos" value={`${Math.round(nutrition.carbs)} g`} />
            <AgendaMetric label="Grasas" value={`${Math.round(nutrition.fat)} g`} />
            <AgendaMetric label="Fibra" value={`${Math.round(nutrition.fiber ?? 0)} g`} />
            <AgendaMetric label="Agua" value={`${(nutrition.waterMl / 1000).toFixed(1)} L`} />
          </div>
          <p className="text-xs text-[rgb(var(--muted))]">Plan: {planDone}/{planTotal || "-"} items completados.</p>
          {nutrition.drinks?.slice(0, 4).map((drink) => (
            <div key={drink.id} className="rounded-xl bg-[rgb(var(--surface-strong))] px-3 py-2 text-xs">
              {drink.type} - {drink.label} - {drink.amountMl} ml
            </div>
          ))}
          {nutrition.meals?.slice(0, 5).map((meal) => (
            <div key={meal.id} className="rounded-xl bg-[rgb(var(--surface-strong))] px-3 py-2 text-xs">
              {meal.name} - {Math.round(meal.calories)} kcal
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[rgb(var(--muted))]">Todavia no hay nutricion guardada para este dia.</p>
      )}
    </CompactDisclosure>
  );
}

function TrainingAgendaCard({ workouts, assigned, selectedDateLabel, onOpen }: { workouts: Workout[]; assigned: WorkoutTemplate; selectedDateLabel: string; onOpen: () => void }) {
  return (
    <CompactDisclosure title="Entrenamiento" eyebrow={workouts.length ? `${workouts.length} registros` : assigned.group}>
      <button className="mb-2 w-full rounded-xl bg-[rgb(var(--surface-strong))] px-3 py-2 text-left text-xs font-semibold" type="button" onClick={onOpen}>
        Abrir modulo completo
      </button>
      {workouts.length ? (
        <div className="space-y-2">
          {workouts.map((workout) => (
            <div key={workout.id} className="rounded-xl bg-[rgb(var(--surface-strong))] p-3">
              <p className="text-sm font-semibold">{workout.title}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{workout.focus} - intensidad {workout.intensity} - {workout.exercises.length} ejercicios - {workout.completed ? "completado" : "pendiente"}</p>
              {workout.exercises.slice(0, 4).map((exercise) => (
                <p key={exercise.id} className="mt-2 text-xs text-white/55 light:text-black/55">
                  {exercise.name} - {exercise.sets.length} series
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[rgb(var(--surface-strong))] p-3">
          <p className="text-sm font-semibold">{assigned.group} - {assigned.focus}</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">Planificado automaticamente - pendiente.</p>
        </div>
      )}
    </CompactDisclosure>
  );
}

function BodyAgendaCard({ measurement, selectedDateLabel, onOpen }: { measurement?: BodyMeasurement; selectedDateLabel: string; onOpen: () => void }) {
  return (
    <CompactDisclosure title="Fisico" eyebrow={measurement ? `${measurement.weightKg} kg` : selectedDateLabel}>
      <button className="mb-2 w-full rounded-xl bg-[rgb(var(--surface-strong))] px-3 py-2 text-left text-xs font-semibold" type="button" onClick={onOpen}>
        Abrir modulo completo
      </button>
      {measurement ? (
        <div className="grid grid-cols-2 gap-2">
          <AgendaMetric label="Peso" value={`${measurement.weightKg} kg`} />
          <AgendaMetric label="Cintura" value={measurement.waistCm ? `${measurement.waistCm} cm` : "-"} />
          <AgendaMetric label="Grasa" value={measurement.bodyFatPercent ? `${measurement.bodyFatPercent}%` : "-"} />
          <AgendaMetric label="Notas" value={measurement.notes ? "Si" : "-"} />
        </div>
      ) : (
        <p className="text-xs text-[rgb(var(--muted))]">No hay medicion fisica registrada para este dia.</p>
      )}
    </CompactDisclosure>
  );
}

function SleepAgendaCard({ sleep, previousDateLabel }: { sleep?: SleepLog; previousDateLabel: string }) {
  return (
    <CompactDisclosure title="Sueno anterior" eyebrow={sleep ? formatSleepDuration(sleep.durationMinutes) : previousDateLabel}>
      {sleep ? (
        <div className="grid grid-cols-3 gap-2">
          <AgendaMetric label="Dormir" value={sleep.sleepTime} />
          <AgendaMetric label="Despertar" value={sleep.wakeTime} />
          <AgendaMetric label="Duracion" value={formatSleepDuration(sleep.durationMinutes)} />
        </div>
      ) : (
        <p className="text-xs text-[rgb(var(--muted))]">No hay sueno registrado para {previousDateLabel}.</p>
      )}
    </CompactDisclosure>
  );
}

function AgendaBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2 last:mb-0">
      <p className="mb-1.5 text-xs font-semibold text-white/80">{title}</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={`${title}-${item}`} className="rounded-xl bg-white/[0.08] px-3 py-2 text-xs text-white/80">{item}</div>
        ))}
      </div>
    </div>
  );
}

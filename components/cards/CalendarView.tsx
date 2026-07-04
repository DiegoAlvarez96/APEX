"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TaskList } from "@/components/cards/TaskList";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { addDays, dateKey, dayOfMonth, fullDate, monthStart, monthTitle, weekdayInAppTimeZone } from "@/lib/date";
import { buildAgendaDetail } from "@/lib/agenda";
import { getRoutineForDate } from "@/lib/routines";
import { formatSleepDuration } from "@/lib/sleep";
import { assignedWorkoutTemplateForDate } from "@/lib/trainingTemplates";
import type { BodyMeasurement, NutritionLog, ProductStockSummary, SleepLog, Workout, WorkoutTemplate } from "@/types/apex";
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
    <div className="space-y-5">
      <header className="flex items-center justify-between px-1 pt-2">
        <div>
          <p className="text-sm text-white/45 light:text-black/45">Calendario</p>
          <h1 className="text-3xl font-semibold">Agenda APEX</h1>
        </div>
        <div className="flex gap-2">
          <button className="grid size-10 place-items-center rounded-full glass" onClick={() => onSelectDate(addDays(selectedDate, -7))} aria-label="Semana anterior">
            <ChevronLeft size={19} />
          </button>
          <button className="grid size-10 place-items-center rounded-full glass" onClick={() => onSelectDate(addDays(selectedDate, 7))} aria-label="Semana siguiente">
            <ChevronRight size={19} />
          </button>
        </div>
      </header>

      <SegmentedControl value={displayMode} onChange={setDisplayMode} options={[{ value: "day", label: "Dia" }, { value: "week", label: "Semana" }, { value: "month", label: "Mes" }, { value: "timeline", label: "Timeline" }]} />

      <Card>
        <SectionTitle title={monthTitle(selectedDate)} />
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-white/40 light:text-black/40">
          {["D", "L", "M", "M", "J", "V", "S"].map((day, index) => (
            <div key={`${day}-${index}`}>{day}</div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {days.map((day) => {
            const active = dateKey(day) === selectedDateKey;
            const routine = getRoutineForDate(day);
            return (
              <button
                key={dateKey(day)}
                type="button"
                onClick={() => onSelectDate(day)}
                className={`aspect-square rounded-2xl p-1 text-center transition ${
                  active ? "bg-limeglass text-black" : "bg-white/[0.06] text-white hover:bg-white/[0.11] light:bg-black/[0.04] light:text-black"
                }`}
              >
                <span className="block text-sm font-semibold">{dayOfMonth(day)}</span>
                <span className="mt-1 block truncate text-[10px] opacity-60">{routine.tasks.length} items</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle title={`Dia ${selectedDateLabel}`} eyebrow="Detalle del dia" />
        <div className="grid grid-cols-2 gap-2">
          <button className="w-full text-left" type="button" onClick={() => setSheet("dashboard")}><AgendaMetric label="Skincare" value={`${skincareTasks.filter((task) => isDone(task.id)).length}/${skincareTasks.length}`} /></button>
          <button className="w-full text-left" type="button" onClick={() => setSheet("nutrition")}><AgendaMetric label="Nutricion" value={nutrition ? `${Math.round(nutrition.calories)} kcal` : "Sin cargar"} /></button>
          <button className="w-full text-left" type="button" onClick={() => setSheet("training")}><AgendaMetric label="Entreno" value={workoutsForDay.length ? `${workoutsForDay.length}` : assignedWorkout.group} /></button>
          <button className="w-full text-left" type="button" onClick={() => setSheet("physical")}><AgendaMetric label="Fisico" value={bodyForDay ? `${bodyForDay.weightKg} kg` : "Sin cargar"} /></button>
        </div>
        <div className="mt-4 space-y-3">
          <TimelineHour label="Ahora" title="Indicador de hora actual" detail={new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date())} active />
          <AgendaBlock title="Suplementos" items={detail.supplements} />
          <AgendaBlock title="Habitos" items={detail.habits} />
          <AgendaBlock title="Notas" items={detail.notes} />
        </div>
      </Card>

      <NutritionAgendaCard nutrition={nutrition} selectedDateLabel={selectedDateLabel} onOpen={() => onOpenModule("nutrition")} />

      <TrainingAgendaCard workouts={workoutsForDay} assigned={assignedWorkout} selectedDateLabel={selectedDateLabel} onOpen={() => onOpenModule("training")} />

      <BodyAgendaCard measurement={bodyForDay} selectedDateLabel={selectedDateLabel} onOpen={() => onOpenModule("physical")} />

      <SleepAgendaCard sleep={previousSleep} previousDateLabel={previousDateLabel} />

      <Card>
        <SectionTitle title="Corregir dia" eyebrow="Editable historicamente" />
        <TaskList tasks={routine.tasks} isDone={isDone} onToggle={onToggle} />
        <textarea className="mt-4 min-h-24 w-full rounded-3xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="Notas, correcciones, objetivos o actividades del dia" />
        <button className="mt-3 h-11 w-full rounded-2xl bg-limeglass font-semibold text-black" type="button" onClick={() => onSaveNote(draftNote)}>Guardar nota</button>
      </Card>

      <BottomSheet open={sheet !== null} title={sheetTitle(sheet)} eyebrow={selectedDateLabel} onClose={() => setSheet(null)}>
        {sheet === "dashboard" ? (
          <div className="space-y-4">
            <button type="button" className="w-full text-left" onClick={() => onOpenModule("dashboard")}>
              <h3 className="text-lg font-semibold">Abrir Skincare completo</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Toca el titulo para editar toda la rutina.</p>
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
    <div className="rounded-2xl bg-[rgb(var(--surface-strong))] p-3">
      <p className="text-[11px] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function sheetTitle(sheet: "dashboard" | "nutrition" | "training" | "physical" | null) {
  if (sheet === "dashboard") return "Skincare";
  if (sheet === "nutrition") return "Nutricion";
  if (sheet === "training") return "Entrenamiento";
  if (sheet === "physical") return "Fisico";
  return "Detalle";
}

function SheetSummary({ title, rows, onOpen }: { title: string; rows: [string, string][]; onOpen: () => void }) {
  return (
    <div className="space-y-4">
      <button type="button" className="w-full text-left" onClick={onOpen}>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">Toca el titulo para ver o editar el modulo completo.</p>
      </button>
      <div className="grid grid-cols-2 gap-2">
        {rows.map(([label, value]) => <AgendaMetric key={label} label={label} value={value} />)}
      </div>
    </div>
  );
}

function TimelineHour({ label, title, detail, active }: { label: string; title: string; detail: string; active?: boolean }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-[rgb(var(--surface-strong))] p-3">
      <div className="w-12 shrink-0 text-xs font-semibold text-[rgb(var(--muted))]">{label}</div>
      <div className={`mt-1 size-3 shrink-0 rounded-full ${active ? "bg-[rgb(var(--accent))]" : "bg-[rgb(var(--border))]"}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{detail}</p>
      </div>
    </div>
  );
}

function NutritionAgendaCard({ nutrition, selectedDateLabel, onOpen }: { nutrition?: NutritionLog; selectedDateLabel: string; onOpen: () => void }) {
  const planTotal = nutrition?.planItems?.length ?? 0;
  const planDone = nutrition?.planItems?.filter((item) => item.done).length ?? 0;
  return (
    <Card>
      <button className="mb-4 w-full text-left" type="button" onClick={onOpen}>
        <SectionTitle title="Nutricion" eyebrow={selectedDateLabel} />
      </button>
      {nutrition ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <AgendaMetric label="Calorias" value={`${Math.round(nutrition.calories)} kcal`} />
            <AgendaMetric label="Proteina" value={`${Math.round(nutrition.protein)} g`} />
            <AgendaMetric label="Carbos" value={`${Math.round(nutrition.carbs)} g`} />
            <AgendaMetric label="Grasas" value={`${Math.round(nutrition.fat)} g`} />
            <AgendaMetric label="Fibra" value={`${Math.round(nutrition.fiber ?? 0)} g`} />
            <AgendaMetric label="Agua" value={`${(nutrition.waterMl / 1000).toFixed(1)} L`} />
          </div>
          <p className="text-sm text-white/50 light:text-black/50">Plan: {planDone}/{planTotal || "-"} items completados.</p>
          {nutrition.drinks?.slice(0, 4).map((drink) => (
            <div key={drink.id} className="rounded-2xl bg-white/[0.06] px-3 py-2 text-sm light:bg-black/[0.04]">
              {drink.type} - {drink.label} - {drink.amountMl} ml
            </div>
          ))}
          {nutrition.meals?.slice(0, 5).map((meal) => (
            <div key={meal.id} className="rounded-2xl bg-white/[0.06] px-3 py-2 text-sm light:bg-black/[0.04]">
              {meal.name} - {Math.round(meal.calories)} kcal
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/45 light:text-black/45">Todavia no hay nutricion guardada para este dia.</p>
      )}
    </Card>
  );
}

function TrainingAgendaCard({ workouts, assigned, selectedDateLabel, onOpen }: { workouts: Workout[]; assigned: WorkoutTemplate; selectedDateLabel: string; onOpen: () => void }) {
  return (
    <Card>
      <button className="mb-4 w-full text-left" type="button" onClick={onOpen}>
        <SectionTitle title="Entrenamiento" eyebrow={selectedDateLabel} />
      </button>
      {workouts.length ? (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <div key={workout.id} className="rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]">
              <p className="text-sm font-semibold">{workout.title}</p>
              <p className="mt-1 text-xs text-white/45 light:text-black/45">{workout.focus} - intensidad {workout.intensity} - {workout.exercises.length} ejercicios - {workout.completed ? "completado" : "pendiente"}</p>
              {workout.exercises.slice(0, 4).map((exercise) => (
                <p key={exercise.id} className="mt-2 text-xs text-white/55 light:text-black/55">
                  {exercise.name} - {exercise.sets.length} series
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]">
          <p className="text-sm font-semibold">{assigned.group} - {assigned.focus}</p>
          <p className="mt-1 text-xs text-white/45 light:text-black/45">Planificado automaticamente - pendiente de registrar.</p>
        </div>
      )}
    </Card>
  );
}

function BodyAgendaCard({ measurement, selectedDateLabel, onOpen }: { measurement?: BodyMeasurement; selectedDateLabel: string; onOpen: () => void }) {
  return (
    <Card>
      <button className="mb-4 w-full text-left" type="button" onClick={onOpen}>
        <SectionTitle title="Fisico" eyebrow={selectedDateLabel} />
      </button>
      {measurement ? (
        <div className="grid grid-cols-2 gap-2">
          <AgendaMetric label="Peso" value={`${measurement.weightKg} kg`} />
          <AgendaMetric label="Cintura" value={measurement.waistCm ? `${measurement.waistCm} cm` : "-"} />
          <AgendaMetric label="Grasa" value={measurement.bodyFatPercent ? `${measurement.bodyFatPercent}%` : "-"} />
          <AgendaMetric label="Notas" value={measurement.notes ? "Si" : "-"} />
        </div>
      ) : (
        <p className="text-sm text-white/45 light:text-black/45">No hay medicion fisica registrada para este dia.</p>
      )}
    </Card>
  );
}

function SleepAgendaCard({ sleep, previousDateLabel }: { sleep?: SleepLog; previousDateLabel: string }) {
  return (
    <Card>
      <SectionTitle title="Sueno del dia anterior" eyebrow={previousDateLabel} />
      {sleep ? (
        <div className="grid grid-cols-3 gap-2">
          <AgendaMetric label="Dormir" value={sleep.sleepTime} />
          <AgendaMetric label="Despertar" value={sleep.wakeTime} />
          <AgendaMetric label="Duracion" value={formatSleepDuration(sleep.durationMinutes)} />
        </div>
      ) : (
        <p className="text-sm text-white/45 light:text-black/45">No hay sueno registrado para {previousDateLabel}.</p>
      )}
    </Card>
  );
}

function AgendaBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${title}-${item}`} className="rounded-2xl bg-white/[0.06] px-3 py-2 text-sm light:bg-black/[0.04]">{item}</div>
        ))}
      </div>
    </div>
  );
}

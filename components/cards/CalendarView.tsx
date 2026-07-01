"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { TaskList } from "@/components/cards/TaskList";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { addDays, dateKey, dayOfMonth, fullDate, monthStart, monthTitle, weekdayInAppTimeZone } from "@/lib/date";
import { buildAgendaDetail } from "@/lib/agenda";
import { getRoutineForDate } from "@/lib/routines";
import { formatSleepDuration } from "@/lib/sleep";
import type { NutritionLog, ProductStockSummary, SleepLog, Workout } from "@/types/apex";

export function CalendarView({
  selectedDate,
  onSelectDate,
  mode,
  onModeChange,
  workouts,
  stockSummaries,
  nutrition,
  previousSleep,
  note,
  onSaveNote,
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
  previousSleep?: SleepLog;
  note?: string;
  onSaveNote: (note: string) => void;
  isDone: (taskId: string) => boolean;
  onToggle: (taskId: string) => void;
}) {
  const [draftNote, setDraftNote] = useState(note ?? "");
  const selectedDateKey = dateKey(selectedDate);
  const selectedDateLabel = fullDate(selectedDate);
  const previousDateLabel = fullDate(addDays(selectedDate, -1));
  const workoutsForDay = workouts.filter((workout) => workout.dateKey === selectedDateKey);
  const detail = buildAgendaDetail(selectedDate, workoutsForDay, stockSummaries);
  const routine = getRoutineForDate(selectedDate);
  const skincareTasks = routine.tasks.filter((task) => task.category === "skincare" || task.category === "beard" || task.category === "hair");

  useEffect(() => {
    setDraftNote(note ?? "");
  }, [note, selectedDate]);
  const days =
    mode === "week"
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

      <SegmentedControl value={mode} onChange={onModeChange} options={[{ value: "week", label: "Semana" }, { value: "month", label: "Mes" }]} />

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
          <AgendaMetric label="Skincare" value={`${skincareTasks.filter((task) => isDone(task.id)).length}/${skincareTasks.length}`} />
          <AgendaMetric label="Nutricion" value={nutrition ? `${Math.round(nutrition.calories)} kcal` : "Sin cargar"} />
          <AgendaMetric label="Entreno" value={workoutsForDay.length ? `${workoutsForDay.length}` : "Sin cargar"} />
          <AgendaMetric label="Sueno ant." value={previousSleep ? formatSleepDuration(previousSleep.durationMinutes) : "Sin cargar"} />
        </div>
        <AgendaBlock title="Suplementos" items={detail.supplements} />
        <AgendaBlock title="Habitos" items={detail.habits} />
        <AgendaBlock title="Notas" items={detail.notes} />
      </Card>

      <NutritionAgendaCard nutrition={nutrition} selectedDateLabel={selectedDateLabel} />

      <TrainingAgendaCard workouts={workoutsForDay} selectedDateLabel={selectedDateLabel} />

      <SleepAgendaCard sleep={previousSleep} previousDateLabel={previousDateLabel} />

      <Card>
        <SectionTitle title="Corregir dia" eyebrow="Editable historicamente" />
        <TaskList tasks={routine.tasks} isDone={isDone} onToggle={onToggle} />
        <textarea className="mt-4 min-h-24 w-full rounded-3xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="Notas, correcciones, objetivos o actividades del dia" />
        <button className="mt-3 h-11 w-full rounded-2xl bg-limeglass font-semibold text-black" type="button" onClick={() => onSaveNote(draftNote)}>Guardar nota</button>
      </Card>
    </div>
  );
}

function AgendaMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]">
      <p className="text-[11px] text-white/40 light:text-black/40">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function NutritionAgendaCard({ nutrition, selectedDateLabel }: { nutrition?: NutritionLog; selectedDateLabel: string }) {
  const planTotal = nutrition?.planItems?.length ?? 0;
  const planDone = nutrition?.planItems?.filter((item) => item.done).length ?? 0;
  return (
    <Card>
      <SectionTitle title="Nutricion" eyebrow={selectedDateLabel} />
      {nutrition ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <AgendaMetric label="Calorias" value={`${Math.round(nutrition.calories)} kcal`} />
            <AgendaMetric label="Proteina" value={`${Math.round(nutrition.protein)} g`} />
            <AgendaMetric label="Carbos" value={`${Math.round(nutrition.carbs)} g`} />
            <AgendaMetric label="Agua" value={`${(nutrition.waterMl / 1000).toFixed(1)} L`} />
          </div>
          <p className="text-sm text-white/50 light:text-black/50">Plan: {planDone}/{planTotal || "-"} items completados.</p>
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

function TrainingAgendaCard({ workouts, selectedDateLabel }: { workouts: Workout[]; selectedDateLabel: string }) {
  return (
    <Card>
      <SectionTitle title="Entrenamiento" eyebrow={selectedDateLabel} />
      {workouts.length ? (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <div key={workout.id} className="rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]">
              <p className="text-sm font-semibold">{workout.title}</p>
              <p className="mt-1 text-xs text-white/45 light:text-black/45">{workout.focus} - intensidad {workout.intensity} - {workout.exercises.length} ejercicios</p>
              {workout.exercises.slice(0, 4).map((exercise) => (
                <p key={exercise.id} className="mt-2 text-xs text-white/55 light:text-black/55">
                  {exercise.name} - {exercise.sets.length} series
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/45 light:text-black/45">No hay entrenamiento registrado para este dia.</p>
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

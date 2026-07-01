"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { addDays, dateKey, dayOfMonth, monthStart, monthTitle, weekdayInAppTimeZone } from "@/lib/date";
import { getRoutineForDate } from "@/lib/routines";

export function CalendarView({
  selectedDate,
  onSelectDate,
  mode,
  onModeChange
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  mode: "week" | "month";
  onModeChange: (mode: "week" | "month") => void;
}) {
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
            const active = dateKey(day) === dateKey(selectedDate);
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
    </div>
  );
}

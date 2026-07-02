"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { DateTimeService, addDays, dateKey, formatDateKey, fullDate } from "@/lib/date";

export function DateNavigator({
  title,
  eyebrow,
  selectedDate,
  onSelectDate
}: {
  title: string;
  eyebrow?: string;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedKey = dateKey(selectedDate);
  const yesterday = addDays(selectedDate, -1);
  const tomorrow = addDays(selectedDate, 1);
  const todayKey = dateKey();
  const label = selectedKey === todayKey ? `${formatDateKey(selectedKey)} Hoy` : formatDateKey(selectedKey);

  return (
    <header className="px-1 pt-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-white/45 light:text-black/45">{eyebrow ?? fullDate(selectedDate)}</p>
          <h1 className="text-3xl font-semibold">{title}</h1>
        </div>
        <button className="grid size-10 shrink-0 place-items-center rounded-full glass" type="button" onClick={() => inputRef.current?.showPicker?.()} aria-label="Abrir calendario">
          <CalendarDays size={18} />
        </button>
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        <button className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-xs light:bg-black/[0.04]" type="button" onClick={() => onSelectDate(yesterday)}>
          <ChevronLeft size={15} /> {formatDateKey(dateKey(yesterday))}
        </button>
        <button className="h-10 shrink-0 rounded-full bg-limeglass px-4 text-sm font-semibold text-black" type="button" onClick={() => onSelectDate(selectedDate)}>
          {label}
        </button>
        <button className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-xs light:bg-black/[0.04]" type="button" onClick={() => onSelectDate(tomorrow)}>
          {formatDateKey(dateKey(tomorrow))} <ChevronRight size={15} />
        </button>
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="date"
        value={selectedKey}
        onChange={(event) => {
          onSelectDate(DateTimeService.fromKey(event.target.value));
        }}
      />
    </header>
  );
}

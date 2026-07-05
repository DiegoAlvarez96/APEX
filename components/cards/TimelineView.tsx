"use client";

import { CheckCircle2, CircleDot } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDateKey } from "@/lib/date";
import type { TimelineEvent } from "@/types/apex";

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  const grouped = events.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
    acc[event.dateKey] = [...(acc[event.dateKey] ?? []), event];
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Actividad</p>
        <h1 className="text-3xl font-semibold">Timeline</h1>
      </header>

      {Object.entries(grouped).map(([key, items]) => (
        <Card key={key}>
          <p className="mb-4 text-sm font-semibold">{key === events[0]?.dateKey ? "Hoy" : formatDateKey(key)}</p>
          <div className="space-y-3">
            {items.map((event) => (
              <div key={event.id} className="flex gap-3">
                {event.type === "training" ? <CheckCircle2 className="text-[rgb(var(--module-accent))]" size={20} /> : <CircleDot className="text-white/35 light:text-black/35" size={20} />}
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.detail ? <p className="text-xs text-white/45 light:text-black/45">{event.detail}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {events.length === 0 ? <p className="py-12 text-center text-sm text-white/45 light:text-black/45">Todavia no hay eventos.</p> : null}
    </div>
  );
}

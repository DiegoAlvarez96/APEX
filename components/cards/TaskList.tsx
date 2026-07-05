"use client";

import { Check, Circle } from "lucide-react";
import type { RoutineTask } from "@/types/apex";

export function TaskList({
  tasks,
  isDone,
  onToggle
}: {
  tasks: RoutineTask[];
  isDone: (taskId: string) => boolean;
  onToggle: (taskId: string) => void;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-white/45 light:text-black/45">Sin tareas para este bloque.</p>;
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task) => {
        const done = isDone(task.id);
        return (
          <button
            key={task.id}
            type="button"
            onClick={() => onToggle(task.id)}
            className="flex min-h-9 w-full items-center gap-2 rounded-xl bg-white/[0.06] px-2.5 text-left transition hover:bg-white/[0.1] light:bg-black/[0.04]"
          >
            <span className={`grid size-5 shrink-0 place-items-center rounded-full ${done ? "bg-[rgb(var(--module-accent))] text-[rgb(var(--bg))]" : "text-white/35 light:text-black/35"}`}>
              {done ? <Check size={12} /> : <Circle size={14} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-xs font-medium ${done ? "text-white/45 line-through light:text-black/45" : ""}`}>{task.label}</span>
              {task.note ? <span className="block truncate text-[11px] text-white/40 light:text-black/40">{task.note}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

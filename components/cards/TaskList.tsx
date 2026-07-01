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
    <div className="space-y-2">
      {tasks.map((task) => {
        const done = isDone(task.id);
        return (
          <button
            key={task.id}
            type="button"
            onClick={() => onToggle(task.id)}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/[0.06] px-3 text-left transition hover:bg-white/[0.1] light:bg-black/[0.04]"
          >
            <span className={`grid size-7 shrink-0 place-items-center rounded-full ${done ? "bg-limeglass text-black" : "text-white/35 light:text-black/35"}`}>
              {done ? <Check size={16} /> : <Circle size={19} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-medium ${done ? "text-white/45 line-through light:text-black/45" : ""}`}>{task.label}</span>
              {task.note ? <span className="block text-xs text-white/40 light:text-black/40">{task.note}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { Flame, LineChart, RollerCoaster, TrendingUp } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { addDays, dateKey, shortWeekday, weekdayInAppTimeZone } from "@/lib/date";
import { routineDays } from "@/lib/routines";
import type { TaskCompletion } from "@/types/apex";

export function StatsView({ completions }: { completions: TaskCompletion[] }) {
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const weeklyDone = completions.filter((item) => week.some((day) => dateKey(day) === item.dateKey) && item.done).length;
  const weeklyTotal = routineDays.reduce((sum, day) => sum + day.tasks.length, 0);
  const weeklyPercent = weeklyTotal ? Math.round((weeklyDone / weeklyTotal) * 100) : 0;
  const dermarollerSessions = completions.filter((item) => item.done && item.taskId.includes("dermaroller")).length;
  const minoxidilApps = completions.filter((item) => item.done && item.taskId.includes("minoxidil")).length;
  const streak = calculateStreak(completions);

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Metricas</p>
        <h1 className="text-3xl font-semibold">Estadisticas</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Metric icon={TrendingUp} label="Cumplimiento semanal" value={`${weeklyPercent}%`} />
        <Metric icon={Flame} label="Racha" value={`${streak} dias`} />
        <Metric icon={RollerCoaster} label="Dermaroller" value={`${dermarollerSessions}`} />
        <Metric icon={LineChart} label="Minoxidil" value={`${minoxidilApps}`} />
      </div>

      <Card>
        <SectionTitle title="Promedio semanal" />
        <div className="flex h-40 items-end gap-2">
          {week.map((day) => {
            const dayItems = completions.filter((item) => item.dateKey === dateKey(day) && item.done);
            const total = routineDays.find((routine) => routine.weekday === weekdayInAppTimeZone(day))?.tasks.length ?? 1;
            const height = Math.max(10, Math.round((dayItems.length / total) * 100));
            return (
              <div key={dateKey(day)} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end rounded-full bg-white/[0.06] p-1 light:bg-black/[0.04]">
                  <div className="w-full rounded-full bg-limeglass" style={{ height: `${height}%` }} />
                </div>
                <span className="text-[10px] text-white/45 light:text-black/45">{shortWeekday(day)}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <Card className="p-4">
      <Icon className="mb-4 text-limeglass" size={22} />
      <p className="text-xs text-white/45 light:text-black/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function calculateStreak(completions: TaskCompletion[]) {
  let streak = 0;
  let cursor = new Date();
  while (streak < 365) {
    const key = dateKey(cursor);
    const hasDone = completions.some((item) => item.dateKey === key && item.done);
    if (!hasDone) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

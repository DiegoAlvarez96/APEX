"use client";

import { AlertTriangle, Bell, Check, Clock, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ApexAlert } from "@/types/apex";

export function AlertsView({
  alerts,
  onSyncStockAlerts,
  onUpdateStatus
}: {
  alerts: ApexAlert[];
  onSyncStockAlerts: () => void;
  onUpdateStatus: (id: number, status: ApexAlert["status"]) => void;
}) {
  const active = alerts.filter((alert) => alert.status === "active");

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between px-1 pt-2">
        <div>
          <p className="text-sm text-white/45 light:text-black/45">Centro de alertas</p>
          <h1 className="text-3xl font-semibold">Alertas</h1>
        </div>
        <button className="grid size-11 place-items-center rounded-full bg-[rgb(var(--module-accent))] text-[rgb(var(--bg))]" onClick={onSyncStockAlerts} type="button" aria-label="Actualizar alertas">
          <Bell size={18} />
        </button>
      </header>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/45 light:text-black/45">Activas</p>
            <p className="text-3xl font-semibold">{active.length}</p>
          </div>
          <AlertTriangle className={active.some((alert) => alert.severity === "critical") ? "text-red-500" : "text-yellow-300"} size={28} />
        </div>
      </Card>

      <div className="space-y-3">
        {active.map((alert) => (
          <Card key={alert.id} className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className={alert.severity === "critical" ? "text-red-500" : "text-yellow-300"} size={20} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{alert.title}</p>
                {alert.detail ? <p className="mt-1 text-sm text-white/50 light:text-black/50">{alert.detail}</p> : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Action icon={Check} label="Comprar" onClick={() => alert.id && onUpdateStatus(alert.id, "buy")} />
              <Action icon={Clock} label="Posponer" onClick={() => alert.id && onUpdateStatus(alert.id, "snoozed")} />
              <Action icon={X} label="Ignorar" onClick={() => alert.id && onUpdateStatus(alert.id, "ignored")} />
            </div>
          </Card>
        ))}
        {active.length === 0 ? <p className="py-8 text-center text-sm text-white/45 light:text-black/45">Sin alertas activas.</p> : null}
      </div>
    </div>
  );
}

function Action({ icon: Icon, label, onClick }: { icon: typeof Check; label: string; onClick: () => void }) {
  return (
    <button className="flex h-10 items-center justify-center gap-1 rounded-2xl bg-white/[0.08] text-xs font-medium light:bg-black/[0.05]" onClick={onClick} type="button">
      <Icon size={14} /> {label}
    </button>
  );
}

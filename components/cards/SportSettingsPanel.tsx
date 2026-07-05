"use client";

import { CalendarDays, Copy, Dumbbell, Pause, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { DateTimeService } from "@/lib/date";
import { defaultSportProfile, isAdvancedSport, sportAccentFor, sportCategoryLabel, sportCategoryOptions, weekDayLabels } from "@/lib/sports";
import type { SportGoal, SportMode, SportProfile, SportSchedule } from "@/types/apex";

type DraftSport = Omit<SportProfile, "id" | "createdAt" | "updatedAt">;

export function SportSettingsPanel({
  sports,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onOpenAgenda
}: {
  sports: SportProfile[];
  onAdd: (profile: DraftSport) => Promise<void> | void;
  onUpdate: (id: number, profile: Partial<SportProfile>) => Promise<void> | void;
  onDelete: (id: number, mode: "future" | "all") => Promise<void> | void;
  onDuplicate: (profile: SportProfile) => Promise<void> | void;
  onOpenAgenda?: () => void;
}) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<SportProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SportProfile | null>(null);

  function openCreate() {
    setEditing(null);
    setWizardOpen(true);
  }

  function openEdit(profile: SportProfile) {
    setEditing(profile);
    setWizardOpen(true);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[rgb(var(--muted))]">Configuracion de deportes</p>
          <h2 className="text-xl font-semibold">Mis deportes y entrenamientos</h2>
        </div>
        <button type="button" onClick={openCreate} className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#d8ff64] px-4 text-sm font-bold text-black">
          <Plus size={17} /> Agregar
        </button>
      </div>

      {sports.length ? (
        <div className="space-y-2">
          {sports.map((profile) => (
            <SportCard
              key={profile.id ?? profile.name}
              profile={profile}
              onEdit={() => openEdit(profile)}
              onDelete={() => setDeleteTarget(profile)}
              onDuplicate={() => void onDuplicate(profile)}
              onPause={() => profile.id && void onUpdate(profile.id, { status: profile.status === "active" ? "paused" : "active" })}
              onAgenda={onOpenAgenda}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
          <p className="font-semibold">Todavia no configuraste deportes.</p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Agrega uno para que APEX construya agenda, cards y rutinas inteligentes.</p>
        </div>
      )}

      <AnimatePresence>
        {wizardOpen ? (
          <SportWizard
            key={editing?.id ?? "new"}
            initial={editing}
            onClose={() => setWizardOpen(false)}
            onSave={async (draft) => {
              if (editing?.id) await onUpdate(editing.id, draft);
              else await onAdd(draft);
              setWizardOpen(false);
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget ? (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 px-5 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} className="w-full max-w-sm rounded-[24px] border border-white/12 bg-[#17181c] p-5">
              <h3 className="text-lg font-bold">Eliminar configuracion</h3>
              <p className="mt-2 text-sm leading-6 text-white/58">Queres eliminar solo los proximos eventos o tambien el historial de {deleteTarget.name}?</p>
              <div className="mt-5 grid gap-2">
                <button type="button" onClick={() => deleteTarget.id && void Promise.resolve(onDelete(deleteTarget.id, "future")).then(() => setDeleteTarget(null))} className="h-12 rounded-2xl bg-white/8 font-semibold">Eliminar proximos eventos</button>
                <button type="button" onClick={() => deleteTarget.id && void Promise.resolve(onDelete(deleteTarget.id, "all")).then(() => setDeleteTarget(null))} className="h-12 rounded-2xl bg-red-500 font-bold text-white">Eliminar todo</button>
                <button type="button" onClick={() => setDeleteTarget(null)} className="h-12 rounded-2xl border border-white/10 font-semibold">Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function SportCard({ profile, onEdit, onDelete, onDuplicate, onPause, onAgenda }: { profile: SportProfile; onEdit: () => void; onDelete: () => void; onDuplicate: () => void; onPause: () => void; onAgenda?: () => void }) {
  const scheduleText = profile.schedules.length ? profile.schedules.map((item) => `${weekDayLabels[item.weekday]} ${item.startTime}-${item.endTime}`).join(" · ") : "Manual";
  const hasCompetition = profile.schedules.some((item) => item.type === "competition");

  return (
    <article className={`rounded-[22px] border p-3 ${hasCompetition ? "border-red-400/25 bg-red-500/20" : "border-white/10 bg-white/[0.045]"}`}>
      <div className="flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${profile.accent}24`, color: profile.accent }}>
          <Dumbbell size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{profile.name}</p>
              <p className="truncate text-xs text-white/45">{sportCategoryLabel(profile.category)} · {profile.specification}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${profile.status === "active" ? "bg-[#d8ff64]/15 text-[#d8ff64]" : "bg-white/8 text-white/55"}`}>{profile.status === "active" ? "Activo" : "Pausado"}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-white/55">{scheduleText}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            <Chip>{profile.mode === "custom_training" ? "Entrenamiento personalizado" : "Solo card"}</Chip>
            <Chip>{goalLabel(profile.goal)}</Chip>
            <Chip>{profile.schedules.some((item) => item.type === "competition") ? "Competicion" : "Entrenamiento"}</Chip>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        <IconAction icon={Pencil} label="Editar" onClick={onEdit} />
        <IconAction icon={profile.status === "active" ? Pause : Play} label={profile.status === "active" ? "Pausar" : "Activar"} onClick={onPause} />
        <IconAction icon={Copy} label="Duplicar" onClick={onDuplicate} />
        <IconAction icon={CalendarDays} label="Agenda" onClick={onAgenda} />
        <IconAction icon={Trash2} label="Eliminar" onClick={onDelete} danger />
      </div>
    </article>
  );
}

function SportWizard({ initial, onClose, onSave }: { initial: SportProfile | null; onClose: () => void; onSave: (draft: DraftSport) => Promise<void> | void }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<DraftSport>(() => initial ? stripSport(initial) : defaultSportProfile());
  const selectedCategory = sportCategoryOptions.find((item) => item.category === draft.category) ?? sportCategoryOptions[0];
  const specs = selectedCategory.options;
  const needsCustom = draft.category === "other" || draft.specification === "Otro";
  const canContinue = step !== 1 || Boolean(draft.specification && draft.name);

  function patch(next: Partial<DraftSport>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function addSchedule() {
    patch({ schedules: [...draft.schedules, { id: DateTimeService.id("sport-schedule"), weekday: 1, startTime: "19:00", endTime: "20:30", type: "training" }] });
  }

  function updateSchedule(id: string, next: Partial<SportSchedule>) {
    patch({ schedules: draft.schedules.map((item) => item.id === id ? { ...item, ...next } : item) });
  }

  return (
    <motion.div className="fixed inset-0 z-[80] overflow-y-auto bg-[#0d0d0d] px-3 pb-6 pt-[calc(env(safe-area-inset-top)+12px)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <header className="sticky top-0 z-10 -mx-3 mb-3 flex items-center justify-between bg-[#0d0d0d]/85 px-3 py-2 backdrop-blur-xl">
        <div>
          <p className="text-xs text-white/45">Paso {step} de 4</p>
          <h2 className="text-lg font-semibold">{initial ? "Editar deporte" : "Agregar deporte"}</h2>
        </div>
        <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-white/8"><X size={17} /></button>
      </header>

      <div className="space-y-3">
        {step === 1 ? (
          <WizardCard title="Que deporte queres agregar?">
            <div className="grid grid-cols-2 gap-2">
              {sportCategoryOptions.map((item) => (
                <button key={item.category} type="button" onClick={() => patch({ category: item.category, specification: item.options[0], name: item.options[0], accent: item.accent })} className={`min-h-12 rounded-2xl border px-3 text-left text-sm ${draft.category === item.category ? "border-[#d8ff64] bg-[#d8ff64]/12 text-[#d8ff64]" : "border-white/8 bg-white/[0.045]"}`}>
                  {item.label}
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-xs text-white/45">Especificacion</span>
              <select className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-[#17181c] px-3 outline-none" value={draft.specification} onChange={(event) => {
                const specification = event.target.value;
                patch({ specification, name: specification === "Otro" ? draft.customSpecification ?? "" : specification, mode: isAdvancedSport(specification) ? "custom_training" : draft.mode, accent: sportAccentFor(draft.category, specification) });
              }}>
                {specs.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            {needsCustom ? (
              <label className="mt-3 block">
                <span className="text-xs text-white/45">Escribir deporte o categoria</span>
                <input className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-3 outline-none" value={draft.customSpecification ?? ""} onChange={(event) => patch({ customSpecification: event.target.value, name: event.target.value, specification: event.target.value || "Otro" })} />
              </label>
            ) : null}
          </WizardCard>
        ) : null}

        {step === 2 ? (
          <WizardCard title="Tenes dias y horarios fijos?">
            <Segmented value={draft.hasFixedSchedule ? "yes" : "no"} options={[["yes", "Si, agregar horarios"], ["no", "No, manual"]]} onChange={(value) => patch({ hasFixedSchedule: value === "yes" })} />
            {draft.hasFixedSchedule ? (
              <div className="mt-4 space-y-3">
                {draft.schedules.map((schedule) => (
                  <ScheduleEditor key={schedule.id} schedule={schedule} onChange={(next) => updateSchedule(schedule.id, next)} />
                ))}
                <button type="button" onClick={addSchedule} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] font-semibold">+ Agregar otro horario</button>
              </div>
            ) : null}
          </WizardCard>
        ) : null}

        {step === 3 ? (
          <WizardCard title="Cual es tu objetivo?">
            {(["hobby", "amateur", "professional"] as SportGoal[]).map((goal) => (
              <button key={goal} type="button" onClick={() => patch({ goal })} className={`mb-2 w-full rounded-2xl border p-4 text-left ${draft.goal === goal ? "border-[#d8ff64] bg-[#d8ff64]/12" : "border-white/8 bg-white/[0.045]"}`}>
                <p className="font-semibold">{goalLabel(goal)}</p>
                <p className="mt-1 text-sm leading-6 text-white/52">{goalDescription(goal)}</p>
              </button>
            ))}
          </WizardCard>
        ) : null}

        {step === 4 ? (
          <WizardCard title="Como queres usar este deporte?">
            <ModeOption mode="card_only" active={draft.mode === "card_only"} onClick={() => patch({ mode: "card_only" })} title="Solo card" detail="Agenda y entrenamiento simple, marcar hecho/no hecho, intensidad y nota rapida. No activa IA ni rutinas internas." />
            <ModeOption mode="custom_training" active={draft.mode === "custom_training"} onClick={() => patch({ mode: "custom_training" })} title="Generar entrenamiento personalizado" detail="Activa IA para rutinas, ejercicios, series, progresion, descansos, fatiga y recomendaciones." />
          </WizardCard>
        ) : null}
      </div>

      <footer className="sticky bottom-0 -mx-3 mt-4 grid grid-cols-2 gap-2 bg-[#0d0d0d]/86 px-3 py-3 backdrop-blur-xl">
        <button type="button" onClick={() => step === 1 ? onClose() : setStep((value) => value - 1)} className="h-12 rounded-2xl border border-white/10 font-semibold">{step === 1 ? "Cancelar" : "Atras"}</button>
        <button type="button" disabled={!canContinue} onClick={() => step === 4 ? void onSave({ ...draft, accent: sportAccentFor(draft.category, draft.specification) }) : setStep((value) => value + 1)} className="h-12 rounded-2xl bg-[#d8ff64] font-bold text-black disabled:opacity-45">{step === 4 ? "Guardar" : "Continuar"}</button>
      </footer>
    </motion.div>
  );
}

function ScheduleEditor({ schedule, onChange }: { schedule: SportSchedule; onChange: (next: Partial<SportSchedule>) => void }) {
  return (
    <div className={`rounded-[20px] border p-3 ${schedule.type === "competition" ? "border-red-400/25 bg-red-500/20" : "border-white/8 bg-white/[0.045]"}`}>
      <div className="grid grid-cols-2 gap-2">
        <select className="h-11 rounded-2xl bg-[#17181c] px-3 outline-none" value={schedule.weekday} onChange={(event) => onChange({ weekday: Number(event.target.value) })}>
          {weekDayLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}
        </select>
        <select className="h-11 rounded-2xl bg-[#17181c] px-3 outline-none" value={schedule.type} onChange={(event) => onChange({ type: event.target.value as SportSchedule["type"] })}>
          <option value="training">Entrenamiento</option>
          <option value="competition">Competicion</option>
        </select>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <TimeWheel label="Inicio" value={schedule.startTime} onChange={(startTime) => onChange({ startTime })} />
        <TimeWheel label="Fin" value={schedule.endTime} onChange={(endTime) => onChange({ endTime })} />
      </div>
    </div>
  );
}

function TimeWheel({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-2xl bg-black/20 p-2">
      <span className="text-[10px] text-white/40">{label}</span>
      <input type="time" className="mt-1 h-10 w-full bg-transparent text-lg font-semibold outline-none" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function WizardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[#15161a] p-4 shadow-panel">
      <h3 className="mb-4 text-xl font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function ModeOption({ active, title, detail, onClick }: { mode: SportMode; active: boolean; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`mb-2 w-full rounded-2xl border p-4 text-left ${active ? "border-[#d8ff64] bg-[#d8ff64]/12" : "border-white/8 bg-white/[0.045]"}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-white/52">{detail}</p>
    </button>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return <div className="grid grid-cols-2 gap-2">{options.map(([id, label]) => <button key={id} type="button" onClick={() => onChange(id)} className={`min-h-12 rounded-2xl text-sm font-semibold ${value === id ? "bg-[#d8ff64] text-black" : "bg-white/[0.06]"}`}>{label}</button>)}</div>;
}

function IconAction({ icon: Icon, label, onClick, danger }: { icon: typeof Pencil; label: string; onClick?: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`grid min-h-10 place-items-center rounded-xl text-[10px] ${danger ? "bg-red-500/12 text-red-300" : "bg-white/[0.055] text-white/65"}`}><Icon size={15} /><span>{label}</span></button>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/8 px-2 py-1 text-white/60">{children}</span>;
}

function goalLabel(goal: SportGoal) {
  return { hobby: "Hobbie", amateur: "Amateur", professional: "Profesional" }[goal];
}

function goalDescription(goal: SportGoal) {
  return {
    hobby: "Salud, disfrute y constancia. APEX prioriza simplicidad y adherencia.",
    amateur: "Mejora de rendimiento, tecnica, volumen, tiempos y progresion.",
    professional: "Planificacion, carga, recuperacion, metricas avanzadas y rendimiento."
  }[goal];
}

function stripSport(profile: SportProfile): DraftSport {
  return {
    name: profile.name,
    category: profile.category,
    specification: profile.specification,
    customCategory: profile.customCategory,
    customSpecification: profile.customSpecification,
    hasFixedSchedule: profile.hasFixedSchedule,
    schedules: profile.schedules,
    goal: profile.goal,
    mode: profile.mode,
    status: profile.status,
    accent: profile.accent,
    notes: profile.notes
  };
}

"use client";

import {
  Activity,
  ArrowLeft,
  BarChart3,
  Check,
  Clock3,
  Copy,
  Droplets,
  Dumbbell,
  Edit3,
  Flame,
  GripVertical,
  HeartPulse,
  LineChart,
  MoreVertical,
  NotebookPen,
  Play,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  TimerReset,
  Trash2,
  Trophy,
  Video,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { DateNavigator } from "@/components/ui/DateNavigator";
import { DateTimeService } from "@/lib/date";
import { assignedWorkoutTemplateForDate, cloneTemplateExercises } from "@/lib/trainingTemplates";
import type { SportProfile, Workout, WorkoutExercise, WorkoutTemplate } from "@/types/apex";

type Screen = "dashboard" | "list" | "exercise" | "rest" | "summary" | "history";
type ModalKind = "set" | "save" | "delete" | "finish" | "added" | "up" | "down" | "injury" | "hydration" | "longRest" | "pr" | undefined;

const muscleImages: Record<string, string> = {
  espalda: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
  pecho: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80",
  piernas: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&w=900&q=80",
  hombros: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=80",
  brazos: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80"
};

export function TrainingSmartView({
  selectedDate,
  selectedDateKey,
  onSelectDate,
  workouts,
  onAddWorkout,
  onUpdateWorkout,
  templates,
  onAddTemplate,
  sportProfiles,
  onOpenSportSettings
}: {
  selectedDate: Date;
  selectedDateKey: string;
  onSelectDate: (date: Date) => void;
  workouts: Workout[];
  onAddWorkout: (workout: Omit<Workout, "id" | "createdAt">) => Promise<void> | void;
  onUpdateWorkout: (id: number, workout: Partial<Workout>) => Promise<void> | void;
  onDeleteWorkout: (id: number) => Promise<void> | void;
  onDuplicateWorkout: (workout: Workout) => Promise<void> | void;
  templates: WorkoutTemplate[];
  onAddTemplate: (template: Omit<WorkoutTemplate, "id" | "createdAt" | "updatedAt">) => Promise<void> | void;
  onDeleteTemplate: (id: number) => Promise<void> | void;
  onGenerateWorkout: (targetDateKey?: string) => Promise<Omit<Workout, "id">>;
  sportProfiles: SportProfile[];
  onOpenSportSettings: () => void;
}) {
  const assignedTemplate = useMemo(() => assignedWorkoutTemplateForDate(selectedDate, templates), [selectedDate, templates]);
  const savedWorkout = workouts[0];
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [activeExerciseId, setActiveExerciseId] = useState("");
  const [modal, setModal] = useState<ModalKind>();
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [restSeconds, setRestSeconds] = useState(105);
  const [draggedId, setDraggedId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [workoutDraft, setWorkoutDraft] = useState<Workout>(() => buildDraft(selectedDateKey, assignedTemplate, savedWorkout));

  useEffect(() => {
    const next = buildDraft(selectedDateKey, assignedTemplate, savedWorkout);
    setWorkoutDraft(next);
    setActiveExerciseId(next.exercises[0]?.id ?? "");
    setScreen("dashboard");
  }, [assignedTemplate, savedWorkout, selectedDateKey]);

  useEffect(() => {
    if (screen !== "rest") return;
    const timer = window.setInterval(() => setRestSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen === "rest" && restSeconds === 0) setModal("longRest");
  }, [restSeconds, screen]);

  const completedSets = workoutDraft.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
  const totalSets = workoutDraft.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  const volume = Math.round(workoutDraft.exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((setSum, set) => setSum + (set.weight ?? 0) * set.reps, 0), 0));
  const activeExercise = workoutDraft.exercises.find((exercise) => exercise.id === activeExerciseId) ?? workoutDraft.exercises[0];
  const nextSet = activeExercise?.sets.findIndex((set) => !set.completed) ?? 0;
  const muscleKey = Object.keys(muscleImages).find((key) => workoutDraft.title.toLowerCase().includes(key)) ?? "pecho";
  const heroImage = muscleImages[muscleKey];

  async function saveWorkout(markComplete = false) {
    setIsSaving(true);
    const payload = {
      dateKey: selectedDateKey,
      title: workoutDraft.title,
      focus: workoutDraft.focus,
      intensity: workoutDraft.intensity,
      durationMinutes: workoutDraft.durationMinutes,
      notes: workoutDraft.notes,
      exercises: workoutDraft.exercises,
      completed: markComplete || workoutDraft.exercises.every((exercise) => exercise.sets.every((set) => set.completed))
    };
    try {
      if (savedWorkout?.id) await onUpdateWorkout(savedWorkout.id, payload);
      else await onAddWorkout(payload);
      setModal(markComplete ? "save" : undefined);
    } finally {
      setIsSaving(false);
    }
  }

  function completeSet(exerciseId: string, setIndex: number) {
    setWorkoutDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set, index) => (index === setIndex ? { ...set, completed: true } : set)),
              completed: exercise.sets.every((set, index) => index === setIndex || set.completed)
            }
          : exercise
      )
    }));
    setRestSeconds(activeExercise?.sets[setIndex]?.restSeconds ?? 105);
    setModal("set");
  }

  function reorderExercise(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setWorkoutDraft((current) => {
      const exercises = [...current.exercises];
      const from = exercises.findIndex((exercise) => exercise.id === draggedId);
      const to = exercises.findIndex((exercise) => exercise.id === targetId);
      if (from < 0 || to < 0) return current;
      const [item] = exercises.splice(from, 1);
      exercises.splice(to, 0, item);
      return { ...current, exercises };
    });
  }

  function duplicateExercise(id: string) {
    setWorkoutDraft((current) => {
      const source = current.exercises.find((exercise) => exercise.id === id);
      if (!source) return current;
      return {
        ...current,
        exercises: [...current.exercises, { ...source, id: DateTimeService.id("exercise-copy"), name: `${source.name} copia` }]
      };
    });
    setModal("added");
  }

  function deleteExercise(id: string) {
    setWorkoutDraft((current) => ({ ...current, exercises: current.exercises.filter((exercise) => exercise.id !== id) }));
    setPendingDeleteId("");
    setModal(undefined);
  }

  return (
    <div className="space-y-4 pb-4 text-white">
      {screen !== "exercise" && screen !== "rest" ? (
        <DateNavigator title="Entrenamiento" eyebrow="Coach IA" selectedDate={selectedDate} onSelectDate={onSelectDate} />
      ) : null}

      <AnimatePresence mode="wait">
        {screen === "dashboard" ? (
          <MotionScreen key="dashboard">
            <DashboardScreen
              workout={workoutDraft}
              progress={progress}
              volume={volume}
              heroImage={heroImage}
              onStart={() => setScreen("list")}
              isSaving={isSaving}
              sportProfiles={sportProfiles}
              onOpenSportSettings={onOpenSportSettings}
              onSaveTemplate={() => void onAddTemplate({ name: `${workoutDraft.title} premium`, group: workoutDraft.title, focus: workoutDraft.focus, intensity: workoutDraft.intensity, notes: workoutDraft.notes, exercises: workoutDraft.exercises, source: "user" })}
            />
          </MotionScreen>
        ) : null}

        {screen === "list" ? (
          <MotionScreen key="list">
            <ListScreen
              workout={workoutDraft}
              progress={progress}
              onOpen={(id) => {
                setActiveExerciseId(id);
                setScreen("exercise");
              }}
              onDuplicate={duplicateExercise}
              onDelete={(id) => {
                setPendingDeleteId(id);
                setModal("delete");
              }}
              onDragStart={setDraggedId}
              onDrop={reorderExercise}
              onFinish={() => setModal("finish")}
              onBack={() => setScreen("dashboard")}
            />
          </MotionScreen>
        ) : null}

        {screen === "exercise" && activeExercise ? (
          <FullScreenMotion key="exercise">
            <ExerciseScreen
              exercise={activeExercise}
              index={workoutDraft.exercises.findIndex((exercise) => exercise.id === activeExercise.id) + 1}
              onBack={() => setScreen("list")}
              onHistory={() => setScreen("history")}
              onRest={() => setScreen("rest")}
              onCompleteSet={(setIndex) => completeSet(activeExercise.id, setIndex)}
              onAiUp={() => setModal("up")}
              onAiDown={() => setModal("down")}
              onInjury={() => setModal("injury")}
            />
          </FullScreenMotion>
        ) : null}

        {screen === "rest" && activeExercise ? (
          <FullScreenMotion key="rest">
            <RestScreen
              seconds={restSeconds}
              total={activeExercise.sets[Math.max(nextSet - 1, 0)]?.restSeconds ?? 120}
              exercise={activeExercise}
              nextSet={Math.max(nextSet + 1, 1)}
              onAdd={(seconds) => setRestSeconds((value) => value + seconds)}
              onSkip={() => setScreen("exercise")}
              onHydration={() => setModal("hydration")}
            />
          </FullScreenMotion>
        ) : null}

        {screen === "summary" ? (
          <MotionScreen key="summary">
            <SummaryScreen workout={workoutDraft} volume={volume} completedSets={completedSets} onBack={() => setScreen("list")} onSave={() => void saveWorkout(true)} />
          </MotionScreen>
        ) : null}

        {screen === "history" && activeExercise ? (
          <MotionScreen key="history">
            <HistoryScreen exercise={activeExercise} onBack={() => setScreen("exercise")} />
          </MotionScreen>
        ) : null}
      </AnimatePresence>

      <TrainingModal
        kind={modal}
        isSaving={isSaving}
        onClose={() => setModal(undefined)}
        onContinue={() => {
          setModal(undefined);
          setScreen("rest");
        }}
        onDelete={() => deleteExercise(pendingDeleteId)}
        onFinish={() => {
          setModal(undefined);
          setScreen("summary");
        }}
      />
    </div>
  );
}

function DashboardScreen({
  workout,
  progress,
  volume,
  heroImage,
  isSaving,
  onStart,
  onSaveTemplate,
  sportProfiles,
  onOpenSportSettings
}: {
  workout: Workout;
  progress: number;
  volume: number;
  heroImage: string;
  isSaving: boolean;
  onStart: () => void;
  onSaveTemplate: () => void;
  sportProfiles: SportProfile[];
  onOpenSportSettings: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#15161a] p-4 shadow-panel">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(var(--module-accent),0.18),transparent_30%)]" />
        <div
          className="absolute right-0 top-0 h-full w-44 bg-cover bg-center opacity-55 [mask-image:linear-gradient(to_left,black,transparent)]"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative z-10 max-w-[68%] space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Entrenamiento de hoy</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">{workout.title}</h1>
            <p className="mt-1 text-sm text-white/58">{workout.focus} Â· {workout.exercises.length} ejercicios</p>
          </div>
          <ProgressLine value={progress} />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Metric icon={Clock3} label="Tiempo" value={`${estimateMinutes(workout)} min`} />
            <Metric icon={BarChart3} label="Volumen" value={`${volume || targetVolume(workout)} kg`} />
          </div>
        </div>
        <button type="button" onClick={onStart} className="relative z-10 mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[rgb(var(--module-accent))] text-sm font-bold text-black shadow-action transition active:scale-[0.98]">
          <Play size={18} fill="currentColor" /> Comenzar entrenamiento
        </button>
      </section>

      <section className="rounded-[22px] border border-[rgb(var(--module-accent))]/20 bg-[rgb(var(--module-accent))]/10 p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-[rgb(var(--module-accent))]/18 text-[rgb(var(--module-accent))]"><Sparkles size={20} /></div>
          <div>
            <p className="text-sm font-semibold">Hoy estas completamente recuperado.</p>
            <p className="text-xs text-white/55">IA recomienda mantener RIR 2 y subir carga solo en la ultima serie.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Rutinas completadas" value="18" detail="+12% mensual" />
        <StatTile label="Volumen semanal" value="42.8k" detail="86% objetivo" />
        <StatTile label="Historial semanal" value="4/5" detail="1 dia restante" />
        <StatTile label="Volumen objetivo" value={`${targetVolume(workout)} kg`} detail="Adaptativo IA" />
      </div>

      <section className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Deportes configurados</p>
            <p className="mt-1 text-xs text-white/45">{sportProfiles.filter((item) => item.status === "active").length} activos en agenda y entrenamiento</p>
          </div>
          <button type="button" onClick={onOpenSportSettings} className="h-11 shrink-0 rounded-2xl bg-[rgb(var(--module-accent))] px-4 text-sm font-bold text-black">Configurar deportes</button>
        </div>
        {sportProfiles.length ? (
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {sportProfiles.slice(0, 6).map((profile) => (
              <span key={profile.id ?? profile.name} className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs" style={{ color: profile.accent }}>{profile.name}</span>
            ))}
          </div>
        ) : null}
      </section>

      <button disabled={isSaving} type="button" onClick={onSaveTemplate} className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.055] text-sm font-semibold">
        <Save size={16} /> Guardar como rutina
      </button>
    </div>
  );
}

function ListScreen({
  workout,
  progress,
  onOpen,
  onDuplicate,
  onDelete,
  onDragStart,
  onDrop,
  onFinish,
  onBack
}: {
  workout: Workout;
  progress: number;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <HeaderBar title={workout.title} subtitle={`${progress}% completado`} onBack={onBack} />
      <div className="space-y-3">
        {workout.exercises.map((exercise, index) => (
          <motion.div
            layout
            key={exercise.id}
            draggable
            onDragStart={() => onDragStart(exercise.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDrop(exercise.id)}
            className="group overflow-hidden rounded-[20px] border border-white/8 bg-[#17181c]/95"
          >
            <div className="flex translate-x-0 transition group-active:-translate-x-12">
              <button type="button" onClick={() => onOpen(exercise.id)} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left">
                <ExerciseThumb name={exercise.name} index={index + 1} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{exercise.name}</p>
                    <ProgressDot value={exerciseProgress(exercise)} />
                  </div>
                  <p className="mt-1 text-xs text-white/45">{exercise.sets.length} series Â· {exercise.sets[0]?.reps ?? 0} reps Â· RIR {exercise.sets[0]?.rir ?? 2} Â· {exercise.sets[0]?.restSeconds ?? 90}s</p>
                  <p className="mt-1 text-xs text-white/35">Ultimo peso: {exercise.sets[0]?.weight ?? 0} kg</p>
                </div>
                <GripVertical className="text-white/30" size={16} />
                <div className="flex gap-1">
                  <IconPill icon={NotebookPen} label="Notas" />
                  <IconPill icon={Video} label="Tecnica" />
                  <IconPill icon={Edit3} label="Editar" />
                </div>
              </button>
              <div className="grid w-24 grid-cols-2">
                <button type="button" onClick={() => onDuplicate(exercise.id)} className="grid place-items-center bg-[rgb(var(--module-accent))] text-black"><Copy size={17} /></button>
                <button type="button" onClick={() => onDelete(exercise.id)} className="grid place-items-center bg-red-500 text-white"><Trash2 size={17} /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <button type="button" className="flex h-13 w-full items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.055] text-sm font-semibold">
        <Plus size={18} /> Agregar ejercicio
      </button>
      <button type="button" onClick={onFinish} className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[rgb(var(--module-accent))] text-sm font-bold text-black shadow-action">
        <Check size={18} /> Finalizar entrenamiento
      </button>
    </div>
  );
}

function ExerciseScreen({
  exercise,
  index,
  onBack,
  onHistory,
  onRest,
  onCompleteSet,
  onAiUp,
  onAiDown,
  onInjury
}: {
  exercise: WorkoutExercise;
  index: number;
  onBack: () => void;
  onHistory: () => void;
  onRest: () => void;
  onCompleteSet: (setIndex: number) => void;
  onAiUp: () => void;
  onAiDown: () => void;
  onInjury: () => void;
}) {
  const [showTechnique, setShowTechnique] = useState(false);
  const technique = techniqueFor(exercise.name);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#0d0d0d] px-3 pb-5 pt-[calc(env(safe-area-inset-top)+10px)]">
      <HeaderBar title={`${index}. ${exercise.name}`} subtitle="Tecnica y series" onBack={onBack} right={<button type="button" onClick={onHistory} className="grid size-9 place-items-center rounded-full bg-white/8"><LineChart size={16} /></button>} />
      <section className="overflow-hidden rounded-[26px] border border-white/10 bg-[#16171b]">
        <div className="relative h-56 bg-[radial-gradient(circle_at_50%_35%,rgba(var(--module-accent),0.18),transparent_36%)]">
          <div className="absolute inset-5 rounded-[24px] border border-white/8 bg-black/20" />
          <div className="absolute inset-x-0 bottom-5 mx-auto grid size-32 place-items-center rounded-full border border-[rgb(var(--module-accent))]/25 bg-[rgb(var(--module-accent))]/10 text-[rgb(var(--module-accent))]">
            <Dumbbell size={52} />
          </div>
          <button type="button" onClick={() => setShowTechnique((value) => !value)} className="absolute bottom-4 right-4 flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-black">
            <Video size={15} /> Ver tecnica
          </button>
        </div>
        <AnimatePresence initial={false}>
          {showTechnique ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden border-t border-white/8"
            >
              <div className="space-y-3 p-3">
                <div className="grid min-h-36 place-items-center rounded-[20px] border border-[rgb(var(--module-accent))]/20 bg-black/35 text-center">
                  <div>
                    <Video className="mx-auto text-[rgb(var(--module-accent))]" size={28} />
                    <p className="mt-2 text-sm font-semibold">Video tecnico pendiente</p>
                    <p className="mt-1 px-6 text-xs leading-5 text-white/45">La estructura ya esta lista para cargar video desde BD o CDN por ejercicio.</p>
                  </div>
                </div>
                <TechniqueList title="Ejecucion" items={technique.steps} />
                <TechniqueList title="Errores comunes" items={technique.mistakes} />
                <TechniqueList title="Alternativas" items={technique.alternatives} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="grid grid-cols-2 gap-2 p-3 text-xs">
          <InfoBlock label="Musculos" value={musclesFor(exercise.name)} />
          <InfoBlock label="Riesgos" value="Hombro, lumbar, bloqueo articular" />
          <InfoBlock label="Tecnica correcta" value="Controla bajada, pausa breve y empuje estable." />
          <InfoBlock label="Alternativas" value="Mancuernas, polea, maquina convergente." />
        </div>
      </section>

      <section className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Series</h2>
          <p className="text-xs text-[rgb(var(--module-accent))]">Descanso: {exercise.sets[0]?.restSeconds ?? 90}s</p>
        </div>
        <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#16171b]">
          <div className="grid grid-cols-[42px_1fr_1fr_1fr_54px] gap-1 border-b border-white/8 px-3 py-2 text-[11px] text-white/40">
            <span>Serie</span><span>Peso</span><span>Reps</span><span>RIR</span><span>Estado</span>
          </div>
          {exercise.sets.map((set, setIndex) => (
            <div key={setIndex} className="grid grid-cols-[42px_1fr_1fr_1fr_54px] items-center gap-1 px-3 py-2 text-sm">
              <span>{setIndex + 1}</span>
              <BigCell value={`${set.weight ?? 0}`} suffix="kg" />
              <BigCell value={`${set.reps}`} suffix="reps" />
              <BigCell value={`${set.rir ?? 2}`} suffix="" />
              <button type="button" onClick={() => onCompleteSet(setIndex)} className={`grid size-10 place-items-center rounded-full ${set.completed ? "bg-[rgb(var(--module-accent))] text-black" : "border border-white/20 text-white/35"}`}>
                <Check size={18} />
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={onAiUp} className="rounded-[16px] bg-[rgb(var(--module-accent))]/12 px-3 py-3 text-xs font-semibold text-[rgb(var(--module-accent))]">Subir peso</button>
          <button type="button" onClick={onAiDown} className="rounded-[16px] bg-white/8 px-3 py-3 text-xs font-semibold">Bajar peso</button>
          <button type="button" onClick={onInjury} className="rounded-[16px] bg-red-500/12 px-3 py-3 text-xs font-semibold text-red-300">Dolor</button>
        </div>
        <button type="button" onClick={onRest} className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-white text-sm font-bold text-black">
          <TimerReset size={18} /> Iniciar descanso
        </button>
      </section>
    </div>
  );
}

function RestScreen({ seconds, total, exercise, nextSet, onAdd, onSkip, onHydration }: { seconds: number; total: number; exercise: WorkoutExercise; nextSet: number; onAdd: (seconds: number) => void; onSkip: () => void; onHydration: () => void }) {
  const pct = Math.max(0, Math.min(100, (seconds / Math.max(total, 1)) * 100));
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[#0d0d0d] px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+10px)] text-center">
      <div className="w-full space-y-7">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onSkip} className="grid size-10 place-items-center rounded-full bg-white/8"><ArrowLeft size={18} /></button>
          <p className="font-semibold">Descanso</p>
          <button type="button" onClick={onSkip} className="grid size-10 place-items-center rounded-full bg-white/8"><X size={18} /></button>
        </div>
        <div className="relative mx-auto grid size-64 place-items-center rounded-full" style={{ background: `conic-gradient(rgb(var(--module-accent)) ${pct * 3.6}deg, rgba(255,255,255,.08) 0deg)` }}>
          <div className="grid size-52 place-items-center rounded-full bg-[#0d0d0d]">
            <div>
              <p className="text-5xl font-bold tabular-nums">{formatTime(seconds)}</p>
              <p className="mt-2 text-sm text-white/55">de {formatTime(total)}</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-white/50">Siguiente: Serie {nextSet}</p>
          <p className="mt-1 text-lg font-semibold">{exercise.sets[nextSet - 1]?.weight ?? exercise.sets[0]?.weight ?? 0} kg x {exercise.sets[nextSet - 1]?.reps ?? exercise.sets[0]?.reps ?? 0} reps</p>
        </div>
        <section className="grid grid-cols-2 gap-2 rounded-[22px] border border-white/10 bg-white/[0.045] p-3 text-left">
          <Metric icon={Droplets} label="Hidratacion" value="250 ml" />
          <Metric icon={HeartPulse} label="FC" value="118 bpm" />
          <Metric icon={Activity} label="Respiracion" value="4-2-6" />
          <Metric icon={BarChart3} label="Volumen restante" value="38%" />
        </section>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onAdd(15)} className="h-12 rounded-[16px] bg-white/8 font-semibold">+15 segundos</button>
          <button type="button" onClick={() => onAdd(30)} className="h-12 rounded-[16px] bg-white/8 font-semibold">+30 segundos</button>
          <button type="button" onClick={onHydration} className="h-12 rounded-[16px] bg-white/8 font-semibold">Hidratacion</button>
          <button type="button" onClick={onSkip} className="h-12 rounded-[16px] bg-[rgb(var(--module-accent))] font-bold text-black">Finalizar ahora</button>
        </div>
      </div>
    </div>
  );
}

function SummaryScreen({ workout, volume, completedSets, onBack, onSave }: { workout: Workout; volume: number; completedSets: number; onBack: () => void; onSave: () => void }) {
  return (
    <div className="space-y-4">
      <HeaderBar title="Resumen" subtitle="Entrenamiento finalizado" onBack={onBack} />
      <section className="rounded-[26px] border border-[rgb(var(--module-accent))]/20 bg-[rgb(var(--module-accent))]/10 p-5 text-center">
        <Trophy className="mx-auto text-[rgb(var(--module-accent))]" size={44} />
        <h1 className="mt-3 text-2xl font-bold">Excelente</h1>
        <p className="mt-1 text-sm text-white/55">Score IA alto, fatiga controlada y progreso consistente.</p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Tiempo total" value={`${estimateMinutes(workout)} min`} detail="5 min menos" />
        <StatTile label="Series" value={`${completedSets}`} detail={`${workout.exercises.length} ejercicios` } />
        <StatTile label="Repeticiones" value={`${workout.exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((s, set) => s + set.reps, 0), 0)}`} detail="total" />
        <StatTile label="Volumen total" value={`${volume} kg`} detail="+7% anterior" />
        <StatTile label="Calorias" value="426" detail="estimadas" />
        <StatTile label="PR nuevos" value="2" detail="press y fondos" />
      </div>
      <section className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
        <p className="text-sm font-semibold">Musculos trabajados</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Pectoral", "Triceps", "Deltoide anterior", "Core"].map((item) => <span key={item} className="rounded-full bg-white/8 px-3 py-1.5 text-xs text-white/70">{item}</span>)}
        </div>
      </section>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={onSave} className="h-12 rounded-[16px] bg-[rgb(var(--module-accent))] text-sm font-bold text-black">Guardar</button>
        <button type="button" className="h-12 rounded-[16px] bg-white/8 text-sm font-semibold">Compartir</button>
        <button type="button" className="h-12 rounded-[16px] bg-white/8 text-sm font-semibold">Notas</button>
      </div>
    </div>
  );
}

function HistoryScreen({ exercise, onBack }: { exercise: WorkoutExercise; onBack: () => void }) {
  const bars = [56, 64, 59, 72, 78, 82, 88];
  return (
    <div className="space-y-4">
      <HeaderBar title="Historial del ejercicio" subtitle={exercise.name} onBack={onBack} />
      <section className="rounded-[24px] border border-white/10 bg-[#16171b] p-4">
        <div className="flex items-end gap-2">
          {bars.map((bar, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-xl bg-[rgb(var(--module-accent))]" style={{ height: `${bar}px`, opacity: 0.45 + index * 0.07 }} />
              <span className="text-[10px] text-white/35">S{index + 1}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Fuerza" value="+14%" detail="mensual" />
        <StatTile label="Volumen" value="+9%" detail="semanal" />
      </div>
      {["12/05/2026 Â· 80 kg x 8, 8, 6", "19/05/2026 Â· 82.5 kg x 8, 7, 6", "26/05/2026 Â· 85 kg x 6, 6, 6"].map((item) => (
        <div key={item} className="rounded-[18px] border border-white/8 bg-white/[0.045] p-3 text-sm text-white/70">{item}</div>
      ))}
      <section className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
        <p className="text-sm font-semibold">Comentarios IA</p>
        <p className="mt-2 text-sm leading-6 text-white/55">La velocidad de progreso es buena. Si el sueno se mantiene por encima de 7 h, probar +2.5 kg la proxima sesion.</p>
      </section>
    </div>
  );
}

function TrainingModal({ kind, isSaving, onClose, onContinue, onDelete, onFinish }: { kind: ModalKind; isSaving: boolean; onClose: () => void; onContinue: () => void; onDelete: () => void; onFinish: () => void }) {
  const content = modalContent(kind);
  return (
    <AnimatePresence>
      {kind ? (
        <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 px-5 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }} className="w-full max-w-sm rounded-[24px] border border-white/12 bg-[#17181c]/95 p-5 text-center shadow-panel">
            <button type="button" onClick={onClose} className="ml-auto grid size-8 place-items-center rounded-full bg-white/8"><X size={15} /></button>
            <div className={`mx-auto grid size-14 place-items-center rounded-full ${content.tone}`}>{content.icon}</div>
            <h2 className="mt-4 text-lg font-bold">{content.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/58">{content.body}</p>
            {kind === "delete" ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={onClose} className="h-12 rounded-[16px] border border-white/10 font-semibold">Cancelar</button>
                <button type="button" onClick={onDelete} className="h-12 rounded-[16px] bg-red-500 font-bold">Eliminar</button>
              </div>
            ) : kind === "finish" ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={onClose} className="h-12 rounded-[16px] border border-white/10 font-semibold">Cancelar</button>
                <button type="button" onClick={onFinish} className="h-12 rounded-[16px] bg-red-500 font-bold">Finalizar</button>
              </div>
            ) : kind === "set" ? (
              <button type="button" onClick={onContinue} className="mt-5 h-12 w-full rounded-[16px] bg-[rgb(var(--module-accent))] font-bold text-black">Continuar</button>
            ) : kind === "save" ? (
              <button type="button" onClick={onClose} className="mt-5 h-12 w-full rounded-[16px] bg-[rgb(var(--module-accent))] font-bold text-black">Entendido</button>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={onClose} className="h-12 rounded-[16px] border border-white/10 font-semibold">{kind === "up" || kind === "down" ? "Ignorar" : "Cerrar"}</button>
                <button type="button" onClick={onClose} disabled={isSaving} className="h-12 rounded-[16px] bg-[rgb(var(--module-accent))] font-bold text-black">{kind === "up" || kind === "down" ? "Aceptar" : "Si"}</button>
              </div>
            )}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function modalContent(kind: ModalKind) {
  const green = "bg-[rgb(var(--module-accent))]/16 text-[rgb(var(--module-accent))]";
  const red = "bg-red-500/15 text-red-300";
  const neutral = "bg-white/10 text-white";
  switch (kind) {
    case "set":
      return { title: "Serie completada", body: "Excelente. IA sugiere +2.5 kg en la proxima sesion si mantienes la tecnica.", tone: green, icon: <Check size={25} /> };
    case "pr":
      return { title: "Nuevo PR", body: "Mejor marca personal registrada. Puedes compartir el logro con peso, repeticiones e historico.", tone: green, icon: <Trophy size={25} /> };
    case "delete":
      return { title: "Confirmar eliminar ejercicio", body: "Esta accion quitara el ejercicio de la rutina actual.", tone: red, icon: <Trash2 size={24} /> };
    case "finish":
      return { title: "Finalizar entrenamiento", body: "Se guardara tu progreso y veras un resumen rapido.", tone: red, icon: <Flame size={24} /> };
    case "added":
      return { title: "Ejercicio agregado", body: "La rutina fue actualizada con una nueva variante.", tone: green, icon: <Plus size={24} /> };
    case "down":
      return { title: "IA recomienda bajar peso", body: "Detecte fatiga por RIR bajo y descanso extendido. Baja 5% para proteger la tecnica.", tone: neutral, icon: <ShieldAlert size={24} /> };
    case "up":
      return { title: "IA recomienda subir peso", body: "Estas progresando. Peso recomendado: +2.5 kg manteniendo el mismo rango de reps.", tone: green, icon: <Sparkles size={24} /> };
    case "injury":
      return { title: "Lesion detectada", body: "Si hubo dolor, reemplaza por una alternativa estable y reduce rango hasta evaluar molestia.", tone: red, icon: <ShieldAlert size={24} /> };
    case "hydration":
      return { title: "Recordatorio hidratacion", body: "Toma 200-300 ml de agua antes de la proxima serie.", tone: green, icon: <Droplets size={24} /> };
    case "longRest":
      return { title: "Descanso demasiado largo", body: "Llevas 4 minutos descansando. Continua el entrenamiento o finaliza el descanso.", tone: neutral, icon: <Clock3 size={24} /> };
    case "save":
      return { title: "Guardar cambios", body: "El entrenamiento quedo guardado con tus series, notas y resumen.", tone: green, icon: <Save size={24} /> };
    default:
      return { title: "", body: "", tone: neutral, icon: null };
  }
}

function MotionScreen({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
      {children}
    </motion.div>
  );
}

function FullScreenMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
      {children}
    </motion.div>
  );
}

function HeaderBar({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-3 py-2">
      <button type="button" onClick={onBack} className="grid size-10 place-items-center rounded-full bg-white/8"><ArrowLeft size={18} /></button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-white/45">{subtitle}</p> : null}
      </div>
      {right ?? <button type="button" className="grid size-10 place-items-center rounded-full bg-white/8"><MoreVertical size={18} /></button>}
    </header>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[16px] bg-white/[0.06] p-3">
      <Icon className="mb-2 text-[rgb(var(--module-accent))]" size={16} />
      <p className="text-[10px] text-white/38">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-[#17181c]/92 p-4">
      <p className="text-xs text-white/42">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-[rgb(var(--module-accent))]">{detail}</p>
    </div>
  );
}

function ProgressLine({ value }: { value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-white/58">{value}% completado</span>
        <span className="text-[rgb(var(--module-accent))]">IA activo</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full bg-[rgb(var(--module-accent))]" initial={{ width: 0 }} animate={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ExerciseThumb({ name, index }: { name: string; index: number }) {
  return (
    <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[16px] border border-white/8 bg-white/[0.055]">
      <Dumbbell className="text-[rgb(var(--module-accent))]" size={24} />
      <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-black/55 text-[10px]">{index}</span>
      <span className="sr-only">{name}</span>
    </div>
  );
}

function IconPill({ icon: Icon, label }: { icon: typeof NotebookPen; label: string }) {
  return (
    <span title={label} className="hidden size-8 place-items-center rounded-xl bg-white/[0.055] text-white/45 sm:grid">
      <Icon size={14} />
    </span>
  );
}

function ProgressDot({ value }: { value: number }) {
  return <span className="grid size-6 place-items-center rounded-full bg-[rgb(var(--module-accent))]/15 text-[10px] font-bold text-[rgb(var(--module-accent))]">{value}%</span>;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white/[0.055] p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">{label}</p>
      <p className="mt-2 text-xs leading-5 text-white/68">{value}</p>
    </div>
  );
}

function TechniqueList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[18px] bg-white/[0.055] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div key={item} className="flex gap-2 text-xs leading-5 text-white/68">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[rgb(var(--module-accent))]/15 text-[10px] font-bold text-[rgb(var(--module-accent))]">{index + 1}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BigCell({ value, suffix }: { value: string; suffix: string }) {
  return (
    <button type="button" className="flex h-11 items-center justify-center gap-1 rounded-[14px] bg-white/[0.06] font-semibold">
      {value} {suffix ? <span className="text-[10px] text-white/42">{suffix}</span> : null}
    </button>
  );
}

function buildDraft(dateKeyValue: string, template: WorkoutTemplate, workout?: Workout): Workout {
  if (workout) return workout;
  return {
    dateKey: dateKeyValue,
    title: template.group,
    focus: template.focus,
    intensity: template.intensity,
    durationMinutes: estimateTemplateMinutes(template),
    exercises: cloneTemplateExercises(template),
    notes: template.notes,
    completed: false,
    createdAt: DateTimeService.nowIso(),
    updatedAt: DateTimeService.nowIso()
  };
}

function estimateMinutes(workout: Workout) {
  return workout.durationMinutes ?? Math.max(45, workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length * 4, 18));
}

function estimateTemplateMinutes(template: WorkoutTemplate) {
  return Math.max(45, template.exercises.reduce((sum, exercise) => sum + exercise.sets.length * 4, 18));
}

function targetVolume(workout: Workout) {
  return Math.round(workout.exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((setSum, set) => setSum + Math.max(set.weight ?? 20, 20) * set.reps, 0), 0));
}

function exerciseProgress(exercise: WorkoutExercise) {
  if (!exercise.sets.length) return 0;
  return Math.round((exercise.sets.filter((set) => set.completed).length / exercise.sets.length) * 100);
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function musclesFor(name: string) {
  const value = name.toLowerCase();
  if (value.includes("press") || value.includes("apertura")) return "Pectoral, triceps, deltoide anterior";
  if (value.includes("remo") || value.includes("jalon") || value.includes("dominada")) return "Dorsal, romboides, biceps";
  if (value.includes("sentadilla") || value.includes("prensa")) return "Cuadriceps, gluteos, core";
  return "Musculo principal, sinergistas, estabilizadores";
}

function techniqueFor(name: string) {
  const value = name.toLowerCase();
  if (value.includes("press") || value.includes("apertura")) {
    return {
      steps: ["Escapulas atras y abajo antes de iniciar.", "Baja con control hasta rango estable.", "Empuja sin perder la posicion del hombro."],
      mistakes: ["Rebotar la carga.", "Abrir demasiado los codos.", "Perder tension del core."],
      alternatives: ["Press con mancuernas", "Press en maquina", "Aperturas en polea"]
    };
  }
  if (value.includes("remo") || value.includes("jalon") || value.includes("dominada")) {
    return {
      steps: ["Inicia con depresion escapular.", "Tira con codos hacia atras, no con manos.", "Controla la vuelta sin soltar tension."],
      mistakes: ["Balancear el torso.", "Encoger hombros.", "Acortar el recorrido final."],
      alternatives: ["Remo sentado", "Jalon neutro", "Remo unilateral"]
    };
  }
  if (value.includes("sentadilla") || value.includes("prensa")) {
    return {
      steps: ["Apoya estable todo el pie.", "Desciende manteniendo rodillas alineadas.", "Sube empujando el suelo sin colapsar cadera."],
      mistakes: ["Rodillas hacia adentro.", "Talones despegados.", "Perder posicion lumbar."],
      alternatives: ["Prensa", "Hack squat", "Sentadilla goblet"]
    };
  }
  return {
    steps: ["Prepara postura y respiracion.", "Ejecuta el rango con control.", "Termina la repeticion sin perder tension."],
    mistakes: ["Compensar con impulso.", "Acelerar la fase negativa.", "Subir carga antes de dominar tecnica."],
    alternatives: ["Maquina guiada", "Mancuernas", "Polea"]
  };
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Dashboard } from "@/components/cards/Dashboard";
import { AlertsView } from "@/components/cards/AlertsView";
import { CalendarView } from "@/components/cards/CalendarView";
import { ChatAiView } from "@/components/cards/ChatAiView";
import { HomeView } from "@/components/cards/HomeView";
import { InsightsView } from "@/components/cards/InsightsView";
import { NutritionSmartView } from "@/components/cards/NutritionSmartView";
import { PhysicalView } from "@/components/cards/PhysicalView";
import { ProductsSmartView } from "@/components/cards/ProductsSmartView";
import { SettingsView } from "@/components/cards/SettingsView";
import { ShoppingView } from "@/components/cards/ShoppingView";
import { SleepView } from "@/components/cards/SleepView";
import { StatsView } from "@/components/cards/StatsView";
import { TimelineView } from "@/components/cards/TimelineView";
import { TrainingSmartView } from "@/components/cards/TrainingSmartView";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, type ViewKey } from "@/components/layout/BottomNav";
import { useApexStore } from "@/hooks/useApexStore";
import { DateTimeService, addDays, dateKey, hourInAppTimeZone } from "@/lib/date";
import { buildTimeline } from "@/lib/timeline";
import { useEffect } from "react";

export default function Home() {
  const [view, setView] = useState<ViewKey>("home");
  const [smartOpened, setSmartOpened] = useState(false);
  const [selectedDate, setSelectedDate] = useState(DateTimeService.todayDate());
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const store = useApexStore(selectedDate);
  const selectedDateKey = dateKey(selectedDate);
  const previousDateKey = dateKey(addDays(selectedDate, -1));
  const previousSleep = store.sleepLogs.find((log) => log.dateKey === previousDateKey);
  const timeline = buildTimeline({
    completions: store.allCompletions,
    consumptions: store.productConsumptions,
    nutritionLogs: store.nutritionLogs,
    workouts: store.workouts,
    alerts: store.alerts,
    stock: store.stockSummaries,
    sleepLogs: store.sleepLogs
  });
  const habitsCompleted = store.completions.filter((item) => item.done).length;

  function navigate(nextView: ViewKey, options?: { preserveDate?: boolean }) {
    const dailyViews: ViewKey[] = ["dashboard", "nutrition", "training", "physical", "sleep"];
    if (!options?.preserveDate && dailyViews.includes(nextView)) setSelectedDate(DateTimeService.todayDate());
    setView(nextView);
  }

  useEffect(() => {
    if (!store.ready || smartOpened) return;
    const nextView = initialViewForNow();
    setView(nextView === "sleep" && store.selectedSleep ? "home" : nextView);
    setSmartOpened(true);
  }, [smartOpened, store.ready, store.selectedSleep]);

  const screen = {
    home: <HomeView onNavigate={navigate} />,
    dashboard: (
      <Dashboard
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        isDone={store.isDone}
        onToggle={(id) => void store.toggleTask(id)}
        nutrition={store.selectedNutrition}
        workouts={store.selectedWorkouts}
        stockSummaries={store.stockSummaries}
        sleep={store.selectedSleep}
      />
    ),
    calendar: <CalendarView selectedDate={selectedDate} onSelectDate={setSelectedDate} mode={calendarMode} onModeChange={setCalendarMode} workouts={store.workouts} stockSummaries={store.stockSummaries} nutrition={store.selectedNutrition} bodyMeasurements={store.bodyMeasurements} workoutTemplates={store.workoutTemplates} previousSleep={previousSleep} note={store.selectedAgendaNote?.note} onSaveNote={(note) => void store.saveAgendaNote(note)} onOpenModule={(nextView) => navigate(nextView, { preserveDate: true })} isDone={store.isDone} onToggle={(id) => void store.toggleTask(id)} />,
    nutrition: <NutritionSmartView nutrition={store.selectedNutrition} selectedDate={selectedDate} selectedDateKey={selectedDateKey} onSelectDate={setSelectedDate} onSave={store.upsertNutritionLog} onDelete={store.deleteNutritionLog} onEstimateFood={store.estimateFood} />,
    training: <TrainingSmartView selectedDate={selectedDate} selectedDateKey={selectedDateKey} onSelectDate={setSelectedDate} workouts={store.selectedWorkouts} templates={store.workoutTemplates} onAddWorkout={store.addWorkout} onUpdateWorkout={store.updateWorkout} onDeleteWorkout={store.deleteWorkout} onDuplicateWorkout={store.duplicateWorkout} onAddTemplate={store.addWorkoutTemplate} onDeleteTemplate={store.deleteWorkoutTemplate} />,
    physical: <PhysicalView latest={store.latestBody} selectedDate={selectedDate} onSelectDate={setSelectedDate} measurements={store.bodyMeasurements} onSave={store.addBodyMeasurement} onUpdate={store.updateBodyMeasurement} onDelete={store.deleteBodyMeasurement} />,
    products: (
      <ProductsSmartView
        summaries={store.stockSummaries}
        onAddProduct={store.addProduct}
        onAddConsumption={(id, amount, note) => void store.addProductConsumption(id, amount, note)}
      />
    ),
    shopping: <ShoppingView items={store.shoppingItems} onSync={store.syncShoppingList} onUpdate={store.updateShoppingStatus} />,
    health: <ShoppingView items={store.shoppingItems} onSync={store.syncShoppingList} onUpdate={store.updateShoppingStatus} />,
    alerts: <AlertsView alerts={store.alerts} onSyncStockAlerts={() => void store.syncStockAlerts()} onUpdateStatus={(id, status) => void store.updateAlertStatus(id, status)} />,
    timeline: <TimelineView events={timeline} />,
    ai: <InsightsView settings={store.settings} nutrition={store.selectedNutrition} stock={store.stockSummaries} workouts={store.workouts} sleep={store.selectedSleep} habitsCompleted={habitsCompleted} />,
    chat: <ChatAiView messages={store.chatMessages} onSend={store.sendChatMessage} onNewChat={store.clearChat} />,
    stats: <StatsView completions={store.allCompletions} />,
    settings: <SettingsView settings={store.settings} onUpdateSettings={(settings) => void store.updateSettings(settings)} onExport={store.exportData} />,
    sleep: <SleepView sleep={store.selectedSleep} onSave={store.saveSleepLog} />
  }[view];

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-4 pb-28 pt-[calc(env(safe-area-inset-top)+18px)]">
      <AppHeader onNavigate={navigate} onRefresh={store.refresh} />
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {store.ready ? screen : <div className="mt-20 text-center text-sm text-white/50">Cargando APEX...</div>}
        </motion.div>
      </AnimatePresence>
      <BottomNav active={view} onChange={navigate} />
    </main>
  );
}

function initialViewForNow(): ViewKey {
  const hour = hourInAppTimeZone(DateTimeService.now());
  if (hour >= 2 && hour < 9) return "sleep";
  if (hour < 10) return "dashboard";
  if (hour >= 10 && hour < 19) return "nutrition";
  if (hour >= 19 && hour < 21) return "training";
  if (hour >= 21 && hour < 23) return "nutrition";
  return "dashboard";
}

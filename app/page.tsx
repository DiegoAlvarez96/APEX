"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";
import { Dashboard } from "@/components/cards/Dashboard";
import { AlertsView } from "@/components/cards/AlertsView";
import { CalendarView } from "@/components/cards/CalendarView";
import { ChatAiView } from "@/components/cards/ChatAiView";
import { FinanceView } from "@/components/cards/FinanceView";
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
import { ModuleRadialMenu } from "@/components/layout/ModuleRadialMenu";
import { useApexStore } from "@/hooks/useApexStore";
import { DateTimeService, addDays, dateKey, hourInAppTimeZone } from "@/lib/date";
import { getModuleIdentity } from "@/lib/modules";
import { buildTimeline } from "@/lib/timeline";

export default function Home() {
  const [view, setView] = useState<ViewKey>("home");
  const [smartOpened, setSmartOpened] = useState(false);
  const [selectedDate, setSelectedDate] = useState(DateTimeService.todayDate());
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
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
    setModuleMenuOpen(false);
    setView(nextView);
  }

  useEffect(() => {
    if (!store.ready || smartOpened) return;
    const nextView = initialViewForNow();
    setView(nextView === "sleep" && store.selectedSleep ? "home" : nextView);
    setSmartOpened(true);
  }, [smartOpened, store.ready, store.selectedSleep]);

  useEffect(() => {
    void logDeviceVisit();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    void clearLocalDevCaches();
  }, []);

  const screen = {
    home: <HomeView onNavigate={navigate} />,
    finance: <FinanceView selectedDateKey={selectedDateKey} transactions={store.financeTransactions} rules={store.financeCategoryRules} paymentMethods={store.financePaymentMethods} scheduledPayments={store.financeScheduledPayments} settings={store.financeSettings} onSave={store.addFinanceTransaction} onDelete={store.deleteFinanceTransaction} onAddPaymentMethod={store.addFinancePaymentMethod} onUpdateSettings={store.updateFinanceSettings} />,
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
        workoutTemplates={store.workoutTemplates}
        sportProfiles={store.sportProfiles}
        financeScheduledPayments={store.financeScheduledPayments}
        onOpenModule={(nextView) => navigate(nextView, { preserveDate: true })}
      />
    ),
    calendar: <CalendarView selectedDate={selectedDate} onSelectDate={setSelectedDate} mode={calendarMode} onModeChange={setCalendarMode} workouts={store.workouts} stockSummaries={store.stockSummaries} nutrition={store.selectedNutrition} bodyMeasurements={store.bodyMeasurements} workoutTemplates={store.workoutTemplates} sportProfiles={store.sportProfiles} financeScheduledPayments={store.financeScheduledPayments} previousSleep={previousSleep} note={store.selectedAgendaNote?.note} onSaveNote={(note) => void store.saveAgendaNote(note)} onOpenModule={(nextView) => navigate(nextView, { preserveDate: true })} isDone={store.isDone} onToggle={(id) => void store.toggleTask(id)} />,
    nutrition: <NutritionSmartView nutrition={store.selectedNutrition} selectedDate={selectedDate} selectedDateKey={selectedDateKey} onSelectDate={setSelectedDate} onSave={store.upsertNutritionLog} onDelete={store.deleteNutritionLog} onEstimateFood={store.estimateFood} onGeneratePlan={store.generateNutritionPlan} />,
    training: <TrainingSmartView selectedDate={selectedDate} selectedDateKey={selectedDateKey} onSelectDate={setSelectedDate} workouts={store.selectedWorkouts} templates={store.workoutTemplates} onAddWorkout={store.addWorkout} onUpdateWorkout={store.updateWorkout} onDeleteWorkout={store.deleteWorkout} onDuplicateWorkout={store.duplicateWorkout} onAddTemplate={store.addWorkoutTemplate} onDeleteTemplate={store.deleteWorkoutTemplate} onGenerateWorkout={store.generateWorkoutPlan} sportProfiles={store.sportProfiles} onOpenSportSettings={() => navigate("settings")} />,
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
    chat: <ChatAiView messages={store.chatMessages} aiStatus={store.chatAiStatus} onSend={store.sendChatMessage} onNewChat={store.clearChat} />,
    stats: <StatsView completions={store.allCompletions} />,
    settings: <SettingsView settings={store.settings} onUpdateSettings={(settings) => void store.updateSettings(settings)} onExport={store.exportData} sportProfiles={store.sportProfiles} onAddSportProfile={store.addSportProfile} onUpdateSportProfile={store.updateSportProfile} onDeleteSportProfile={(id) => void store.deleteSportProfile(id)} onDuplicateSportProfile={store.duplicateSportProfile} onOpenAgenda={() => navigate("calendar")} />,
    sleep: <SleepView sleep={store.selectedSleep} onSave={store.saveSleepLog} />
  }[view];
  const moduleTheme = getModuleIdentity(view);
  const moduleStyle = {
    background: moduleTheme.pageBackground,
    "--module-accent": `var(--${moduleTheme.token})`
  } as CSSProperties;

  return (
    <main data-module={view} className="apex-shell mx-auto min-h-dvh w-full max-w-xl px-3 pb-20 pt-[calc(env(safe-area-inset-top)+10px)] lg:max-w-3xl" style={moduleStyle}>
      <AppHeader active={view} onNavigate={navigate} onRefresh={store.refresh} onOpenTrainingSettings={() => navigate("settings")} />
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {store.ready ? screen : <div className="mt-20 text-center text-sm text-white/50">Cargando APEX...</div>}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        <ModuleRadialMenu active={view} open={moduleMenuOpen} onClose={() => setModuleMenuOpen(false)} onNavigate={navigate} />
      </AnimatePresence>
      <BottomNav active={view} onChange={navigate} onHomeAction={() => setModuleMenuOpen(true)} />
    </main>
  );
}

async function logDeviceVisit() {
  try {
    await fetch("/api/device/log", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer,
        language: navigator.language,
        languages: navigator.languages,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth,
          pixelDepth: window.screen.pixelDepth
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        devicePixelRatio: window.devicePixelRatio,
        touchPoints: navigator.maxTouchPoints,
        standalone: window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
      })
    });
  } catch {
    // Device logging is best-effort and must never affect app usage.
  }
}

async function clearLocalDevCaches() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Local cache cleanup is best-effort and should never affect app usage.
  }
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

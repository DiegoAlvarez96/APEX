"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Dashboard } from "@/components/cards/Dashboard";
import { AlertsView } from "@/components/cards/AlertsView";
import { CalendarView } from "@/components/cards/CalendarView";
import { CareView } from "@/components/cards/CareView";
import { ChatAiView } from "@/components/cards/ChatAiView";
import { HealthAestheticView } from "@/components/cards/HealthAestheticView";
import { InsightsView } from "@/components/cards/InsightsView";
import { NutritionSmartView } from "@/components/cards/NutritionSmartView";
import { PhysicalView } from "@/components/cards/PhysicalView";
import { ProductsSmartView } from "@/components/cards/ProductsSmartView";
import { SettingsView } from "@/components/cards/SettingsView";
import { ShoppingView } from "@/components/cards/ShoppingView";
import { StatsView } from "@/components/cards/StatsView";
import { TimelineView } from "@/components/cards/TimelineView";
import { TrainingSmartView } from "@/components/cards/TrainingSmartView";
import { BottomNav, type ViewKey } from "@/components/layout/BottomNav";
import { useApexStore } from "@/hooks/useApexStore";
import { buildTimeline } from "@/lib/timeline";

export default function Home() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const store = useApexStore(selectedDate);
  const timeline = buildTimeline({
    completions: store.allCompletions,
    consumptions: store.productConsumptions,
    nutritionLogs: store.nutritionLogs,
    workouts: store.workouts,
    alerts: store.alerts,
    stock: store.stockSummaries
  });
  const habitsCompleted = store.completions.filter((item) => item.done).length;

  const screen = {
    dashboard: (
      <Dashboard
        selectedDate={selectedDate}
        isDone={store.isDone}
        onToggle={(id) => void store.toggleTask(id)}
        nutrition={store.selectedNutrition}
        workouts={store.selectedWorkouts}
        stockSummaries={store.stockSummaries}
      />
    ),
    calendar: <CalendarView selectedDate={selectedDate} onSelectDate={setSelectedDate} mode={calendarMode} onModeChange={setCalendarMode} workouts={store.workouts} stockSummaries={store.stockSummaries} />,
    nutrition: <NutritionSmartView nutrition={store.selectedNutrition} onSave={(values) => void store.upsertNutritionLog(values)} onDelete={(id) => void store.deleteNutritionLog(id)} onDuplicate={(log) => void store.duplicateNutritionLog(log)} />,
    training: <TrainingSmartView workouts={store.workouts} onAddWorkout={(workout) => void store.addWorkout(workout)} onUpdateWorkout={(id, workout) => void store.updateWorkout(id, workout)} onDeleteWorkout={(id) => void store.deleteWorkout(id)} onDuplicateWorkout={(workout) => void store.duplicateWorkout(workout)} />,
    physical: <PhysicalView latest={store.latestBody} measurements={store.bodyMeasurements} onSave={(value) => void store.addBodyMeasurement(value)} />,
    health: <HealthAestheticView />,
    care: <CareView photos={store.photos} onAddPhoto={(photo) => void store.addPhoto(photo)} />,
    products: (
      <ProductsSmartView
        summaries={store.stockSummaries}
        onAddProduct={(product) => void store.addProduct(product)}
        onAddConsumption={(id, amount, note) => void store.addProductConsumption(id, amount, note)}
      />
    ),
    shopping: <ShoppingView items={store.shoppingItems} onSync={() => void store.syncShoppingList()} onUpdate={(id, status) => void store.updateShoppingStatus(id, status)} />,
    alerts: <AlertsView alerts={store.alerts} onSyncStockAlerts={() => void store.syncStockAlerts()} onUpdateStatus={(id, status) => void store.updateAlertStatus(id, status)} />,
    timeline: <TimelineView events={timeline} />,
    ai: <InsightsView settings={store.settings} nutrition={store.selectedNutrition} stock={store.stockSummaries} workouts={store.workouts} habitsCompleted={habitsCompleted} />,
    chat: <ChatAiView messages={store.chatMessages} onSend={(content) => void store.sendChatMessage(content)} />,
    stats: <StatsView completions={store.allCompletions} />,
    settings: <SettingsView settings={store.settings} onUpdateSettings={(settings) => void store.updateSettings(settings)} onExport={store.exportData} />
  }[view];

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-4 pb-28 pt-[calc(env(safe-area-inset-top)+18px)]">
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {store.ready ? screen : <div className="mt-20 text-center text-sm text-white/50">Cargando APEX...</div>}
        </motion.div>
      </AnimatePresence>
      <BottomNav active={view} onChange={setView} />
    </main>
  );
}

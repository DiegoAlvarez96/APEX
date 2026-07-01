"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Dashboard } from "@/components/cards/Dashboard";
import { CalendarView } from "@/components/cards/CalendarView";
import { CareView } from "@/components/cards/CareView";
import { ProductsView } from "@/components/cards/ProductsView";
import { SettingsView } from "@/components/cards/SettingsView";
import { StatsView } from "@/components/cards/StatsView";
import { BottomNav, type ViewKey } from "@/components/layout/BottomNav";
import { useApexStore } from "@/hooks/useApexStore";

export default function Home() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const store = useApexStore(selectedDate);

  const screen = {
    dashboard: <Dashboard selectedDate={selectedDate} isDone={store.isDone} onToggle={(id) => void store.toggleTask(id)} />,
    calendar: <CalendarView selectedDate={selectedDate} onSelectDate={setSelectedDate} mode={calendarMode} onModeChange={setCalendarMode} />,
    care: <CareView photos={store.photos} onAddPhoto={(photo) => void store.addPhoto(photo)} />,
    products: (
      <ProductsView
        products={store.products}
        onAddProduct={(product) => void store.addProduct(product)}
        onUpdateQuantity={(id, quantity) => void store.updateProductQuantity(id, quantity)}
      />
    ),
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

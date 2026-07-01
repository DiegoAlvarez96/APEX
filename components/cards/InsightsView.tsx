"use client";

import { BrainCircuit } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { createAiProvider, type ApexAiRecommendation } from "@/lib/ai/openai";
import type { AppSettings, NutritionLog, ProductStockSummary, Workout } from "@/types/apex";

export function InsightsView({
  settings,
  nutrition,
  stock,
  workouts,
  habitsCompleted
}: {
  settings: AppSettings;
  nutrition?: NutritionLog;
  stock: ProductStockSummary[];
  workouts: Workout[];
  habitsCompleted: number;
}) {
  const [items, setItems] = useState<ApexAiRecommendation[]>([]);

  useEffect(() => {
    let active = true;
    void createAiProvider()
      .analyze({ settings, nutrition, stock, workouts, habitsCompleted })
      .then((next) => {
        if (active) setItems(next);
      })
      .catch(() => {
        if (active) setItems([{ category: "habit", title: "IA no disponible", detail: "Configura una API key valida para usar OpenAI." }]);
      });
    return () => {
      active = false;
    };
  }, [habitsCompleted, nutrition, settings, stock, workouts]);

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">OpenAI-ready</p>
        <h1 className="text-3xl font-semibold">IA APEX</h1>
      </header>
      <Card>
        <SectionTitle eyebrow="OPENAI_API_KEY" title="Recomendaciones" />
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.category}-${item.title}`} className="flex gap-3 rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]">
              <BrainCircuit className="mt-0.5 text-limeglass" size={19} />
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs leading-5 text-white/50 light:text-black/50">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

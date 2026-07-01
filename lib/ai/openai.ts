import type { AppSettings, NutritionLog, ProductStockSummary, Workout } from "@/types/apex";

export type ApexAiContext = {
  settings: AppSettings;
  nutrition?: NutritionLog;
  stock: ProductStockSummary[];
  workouts: Workout[];
  habitsCompleted: number;
};

export type ApexAiRecommendation = {
  title: string;
  detail: string;
  category: "nutrition" | "training" | "stock" | "habit";
};

export interface ApexAiProvider {
  analyze(context: ApexAiContext): Promise<ApexAiRecommendation[]>;
}

export class LocalInsightProvider implements ApexAiProvider {
  async analyze(context: ApexAiContext): Promise<ApexAiRecommendation[]> {
    const recommendations: ApexAiRecommendation[] = [];
    const protein = context.nutrition?.protein ?? 0;
    const waterMl = context.nutrition?.waterMl ?? 0;
    const critical = context.stock.filter((item) => item.status === "critical" || item.status === "warning");

    if (protein > 0 && protein < 120) {
      recommendations.push({ category: "nutrition", title: "Subir proteina", detail: "Aumentaria 20 g de proteina para acercarte a un rango mas consistente." });
    }
    if (waterMl > 0 && waterMl < 2500) {
      recommendations.push({ category: "nutrition", title: "Hidratacion baja", detail: "El agua del dia esta por debajo de 2.5 L. Conviene repartir tomas durante la tarde." });
    }
    if (critical[0]) {
      recommendations.push({ category: "stock", title: "Stock critico", detail: `${critical[0].product.name} necesita reposicion pronto.` });
    }
    if (context.workouts.length === 0) {
      recommendations.push({ category: "training", title: "Sin entrenamiento reciente", detail: "Registra la sesion para poder analizar volumen, frecuencia e intensidad." });
    }

    return recommendations;
  }
}

export class OpenAiInsightProvider implements ApexAiProvider {
  constructor(private readonly apiKey: string, private readonly model = "gpt-4.1-mini") {}

  async analyze(context: ApexAiContext): Promise<ApexAiRecommendation[]> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "system",
            content: "Sos APEX, un asistente personal breve para nutricion, entrenamiento, stock y habitos. Responde JSON estricto."
          },
          {
            role: "user",
            content: JSON.stringify({
              schema: "Array<{title:string,detail:string,category:'nutrition'|'training'|'stock'|'habit'}>",
              context
            })
          }
        ]
      })
    });

    if (!response.ok) throw new Error("OpenAI request failed");
    const data = await response.json();
    const text = data.output_text ?? "[]";
    return JSON.parse(text) as ApexAiRecommendation[];
  }
}

export function createAiProvider(settings: AppSettings): ApexAiProvider {
  return settings.openAiApiKey ? new OpenAiInsightProvider(settings.openAiApiKey) : new LocalInsightProvider();
}

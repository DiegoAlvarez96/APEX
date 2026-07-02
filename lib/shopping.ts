import { productDisplayName } from "@/lib/stock";
import { DateTimeService } from "@/lib/date";
import type { ProductGroup, ProductStockSummary, ShoppingItem } from "@/types/apex";

export function inferProductGroup(category: string, name: string): ProductGroup {
  const value = `${category} ${name}`.toLowerCase();
  if (/prote|creatina|avena|arroz|yogur|leche|comida|alimento/.test(value)) return "nutrition";
  if (/omega|vitamina|suplement/.test(value)) return "supplement";
  if (/shampoo|crema|retinol|minoxidil|protector|limpiador|skincare|barba|cabello/.test(value)) return "personalCare";
  return "other";
}

export function buildShoppingSuggestions(stock: ProductStockSummary[], existing: ShoppingItem[]): Omit<ShoppingItem, "id">[] {
  const existingTitles = new Set(existing.filter((item) => item.status !== "ignored").map((item) => item.title.toLowerCase()));
  return stock
    .filter((summary) => summary.status !== "ok")
    .map((summary) => ({
      title: productDisplayName(summary.product),
      category: summary.product.group ?? inferProductGroup(summary.product.category, summary.product.name),
      status: "pending",
      source: "stock",
      productId: summary.product.id,
      createdAt: DateTimeService.nowIso(),
      updatedAt: DateTimeService.nowIso()
    } satisfies Omit<ShoppingItem, "id">))
    .filter((item) => !existingTitles.has(item.title.toLowerCase()));
}

export const productSuggestions = {
  nutrition: ["Proteina ENA Whey", "Creatina ENA", "Avena", "Arroz", "Yogur griego", "Atun"],
  personalCare: ["Protector solar Anthelios", "Retinol La Roche Posay", "Limpiador Effaclar", "Shampoo", "Minoxidil"],
  supplement: ["Omega 3", "Vitamina D", "Magnesio", "Creatina ENA"],
  other: ["Producto APEX"]
} satisfies Record<ProductGroup, string[]>;

export type ProductTemplate = {
  commercialName: string;
  name: string;
  brand: string;
  category: string;
  group: ProductGroup;
  size: number;
  initialStock: number;
  unit: string;
  recommendedConsumption: number;
  dailyConsumptionEstimate: number;
  image?: string;
};

export const productTemplates: Record<string, ProductTemplate> = {
  "Proteina ENA Whey": { commercialName: "Proteina ENA Whey", name: "Whey Protein", brand: "ENA", category: "Alimentacion", group: "nutrition", size: 930, initialStock: 930, unit: "g", recommendedConsumption: 35, dailyConsumptionEstimate: 35 },
  "Creatina ENA": { commercialName: "Creatina ENA", name: "Creatina monohidrato", brand: "ENA", category: "Suplementos", group: "supplement", size: 300, initialStock: 300, unit: "g", recommendedConsumption: 5, dailyConsumptionEstimate: 5 },
  Avena: { commercialName: "Avena", name: "Avena", brand: "Quaker", category: "Alimentacion", group: "nutrition", size: 500, initialStock: 500, unit: "g", recommendedConsumption: 50, dailyConsumptionEstimate: 50 },
  Arroz: { commercialName: "Arroz", name: "Arroz", brand: "Gallo", category: "Alimentacion", group: "nutrition", size: 1000, initialStock: 1000, unit: "g", recommendedConsumption: 100, dailyConsumptionEstimate: 100 },
  "Yogur griego": { commercialName: "Yogur griego", name: "Yogur", brand: "Serenisima", category: "Alimentacion", group: "nutrition", size: 900, initialStock: 900, unit: "g", recommendedConsumption: 170, dailyConsumptionEstimate: 170 },
  Atun: { commercialName: "Atun", name: "Atun", brand: "La Campagnola", category: "Alimentacion", group: "nutrition", size: 170, initialStock: 170, unit: "g", recommendedConsumption: 170, dailyConsumptionEstimate: 0 },
  "Protector solar Anthelios": { commercialName: "La Roche Posay Anthelios FPS50", name: "Protector solar", brand: "La Roche Posay", category: "Skincare", group: "personalCare", size: 50, initialStock: 50, unit: "ml", recommendedConsumption: 1.5, dailyConsumptionEstimate: 1.5 },
  "Retinol La Roche Posay": { commercialName: "Retinol La Roche Posay", name: "Retinol", brand: "La Roche Posay", category: "Skincare", group: "personalCare", size: 30, initialStock: 30, unit: "ml", recommendedConsumption: 0.5, dailyConsumptionEstimate: 0.3 },
  "Limpiador Effaclar": { commercialName: "Effaclar Gel", name: "Limpiador", brand: "La Roche Posay", category: "Skincare", group: "personalCare", size: 200, initialStock: 200, unit: "ml", recommendedConsumption: 2, dailyConsumptionEstimate: 4 },
  Shampoo: { commercialName: "Shampoo", name: "Shampoo", brand: "A definir", category: "Higiene personal", group: "personalCare", size: 400, initialStock: 400, unit: "ml", recommendedConsumption: 8, dailyConsumptionEstimate: 4 },
  Minoxidil: { commercialName: "Minoxidil", name: "Minoxidil", brand: "A definir", category: "Barba", group: "personalCare", size: 60, initialStock: 60, unit: "ml", recommendedConsumption: 1, dailyConsumptionEstimate: 1 },
  "Omega 3": { commercialName: "Omega 3", name: "Omega 3", brand: "A definir", category: "Suplementos", group: "supplement", size: 60, initialStock: 60, unit: "caps", recommendedConsumption: 1, dailyConsumptionEstimate: 1 },
  "Vitamina D": { commercialName: "Vitamina D", name: "Vitamina D", brand: "A definir", category: "Suplementos", group: "supplement", size: 60, initialStock: 60, unit: "caps", recommendedConsumption: 1, dailyConsumptionEstimate: 1 },
  Magnesio: { commercialName: "Magnesio", name: "Magnesio", brand: "A definir", category: "Suplementos", group: "supplement", size: 60, initialStock: 60, unit: "caps", recommendedConsumption: 1, dailyConsumptionEstimate: 1 },
  "Producto APEX": { commercialName: "Producto APEX", name: "Producto", brand: "A definir", category: "Otros", group: "other", size: 1, initialStock: 1, unit: "un", recommendedConsumption: 0, dailyConsumptionEstimate: 0 }
};

export function recommendedPurchases() {
  return [
    { section: "Nutricion", items: ["Proteina ENA Whey", "Creatina ENA", "Avena", "Yogur griego", "Atun"] },
    { section: "Skincare", items: ["Protector solar Anthelios", "Retinol La Roche Posay", "Limpiador Effaclar"] },
    { section: "Suplementos", items: ["Omega 3", "Vitamina D", "Magnesio"] },
    { section: "Cuidado personal", items: ["Shampoo", "Minoxidil"] }
  ];
}

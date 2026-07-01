import { productDisplayName } from "@/lib/stock";
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } satisfies Omit<ShoppingItem, "id">))
    .filter((item) => !existingTitles.has(item.title.toLowerCase()));
}

export const productSuggestions = {
  nutrition: ["Proteina whey", "Creatina", "Avena", "Arroz", "Yogur"],
  personalCare: ["Niacinamida", "Protector solar", "Retinol", "Limpiador", "Shampoo"],
  supplement: ["Omega 3", "Vitamina D", "Magnesio"],
  other: ["Producto APEX"]
} satisfies Record<ProductGroup, string[]>;

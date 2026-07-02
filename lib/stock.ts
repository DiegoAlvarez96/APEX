import { DateTimeService, addDays, dateKey } from "@/lib/date";
import type { ApexAlert, Product, ProductConsumption, ProductStockSummary } from "@/types/apex";

const dayMs = 24 * 60 * 60 * 1000;

export function productDisplayName(product: Product) {
  return product.commercialName?.trim() || product.name;
}

export function productInitialStock(product: Product) {
  return Math.max(product.initialStock ?? product.size ?? product.quantity, 0);
}

export function summarizeProductStock(product: Product, consumptions: ProductConsumption[]): ProductStockSummary {
  const initialStock = productInitialStock(product);
  const productConsumptions = consumptions.filter((item) => item.productId === product.id);
  const consumed = productConsumptions.reduce((sum, item) => sum + item.amount, 0);
  const currentStock = Math.max(initialStock - consumed, 0);
  const percent = initialStock > 0 ? Math.round((currentStock / initialStock) * 100) : 0;
  const dated = productConsumptions.map((item) => item.dateKey).sort();
  const firstDate = dated[0] ?? product.purchaseDate;
  const daysWindow = Math.max(1, daysBetween(firstDate, dateKey()) + 1);
  const estimatedDaily = Math.max(product.dailyConsumptionEstimate ?? product.recommendedConsumption ?? 0, 0);
  const dailyAverage = consumed > 0 ? consumed / daysWindow : estimatedDaily;
  const weeklyConsumption =
    consumed > 0 ? productConsumptions.filter((item) => daysBetween(item.dateKey, dateKey()) <= 6).reduce((sum, item) => sum + item.amount, 0) : estimatedDaily * 7;
  const monthlyConsumption =
    consumed > 0 ? productConsumptions.filter((item) => daysBetween(item.dateKey, dateKey()) <= 29).reduce((sum, item) => sum + item.amount, 0) : estimatedDaily * 30;
  const estimatedDaysLeft = dailyAverage > 0 ? Math.max(0, Math.floor(currentStock / dailyAverage)) : null;
  const estimatedRestockDate = estimatedDaysLeft === null ? null : dateKey(addDays(DateTimeService.todayDate(), estimatedDaysLeft));

  return {
    product: { ...product, quantity: currentStock },
    consumed,
    currentStock,
    percent,
    dailyAverage,
    weeklyConsumption,
    monthlyConsumption,
    estimatedDaysLeft,
    estimatedRestockDate,
    status: stockStatus(percent)
  };
}

export function stockStatus(percent: number): ProductStockSummary["status"] {
  if (percent < 10) return "critical";
  if (percent < 20) return "warning";
  if (percent < 40) return "low";
  return "ok";
}

export function stockColor(status: ProductStockSummary["status"]) {
  return {
    ok: "bg-limeglass",
    low: "bg-yellow-300",
    warning: "bg-orange-400",
    critical: "bg-red-500"
  }[status];
}

export function buildStockAlerts(summaries: ProductStockSummary[], existing: ApexAlert[]): ApexAlert[] {
  const activeKeys = new Set(existing.filter((alert) => alert.status !== "ignored").map((alert) => `${alert.source}-${alert.productId}-${alert.title}`));
  return summaries.reduce<ApexAlert[]>((alerts, summary) => {
    if (summary.status === "ok") return alerts;
      const name = productDisplayName(summary.product);
      const days = summary.estimatedDaysLeft;
      const title = days === null ? `Revisar stock de ${name}` : `Se termina ${name} en ${days} dias`;
      const key = `stock-${summary.product.id}-${title}`;
      if (activeKeys.has(key)) return alerts;
      alerts.push({
        title,
        detail: `${summary.percent}% restante · promedio ${formatAmount(summary.dailyAverage)} ${summary.product.unit}/dia`,
        severity: summary.status === "critical" ? "critical" : "warning",
        status: "active",
        source: "stock",
        productId: summary.product.id,
        dueDateKey: summary.estimatedRestockDate ?? undefined,
        createdAt: DateTimeService.nowIso(),
        updatedAt: DateTimeService.nowIso()
      });
      return alerts;
    }, []);
}

export function formatAmount(value: number) {
  if (!Number.isFinite(value)) return "0";
  return value >= 10 ? Math.round(value).toString() : value.toFixed(1);
}

function daysBetween(fromKey: string, toKey: string) {
  const from = keyToUtc(fromKey);
  const to = keyToUtc(toKey);
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / dayMs));
}

function keyToUtc(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

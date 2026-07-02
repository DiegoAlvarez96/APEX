import { DateTimeService } from "@/lib/date";
import type { DrinkEntry, DrinkType, FoodEntry, NutritionLog, NutritionPlanItem } from "@/types/apex";

type FoodPreset = Omit<FoodEntry, "id" | "estimated" | "source"> & { aliases: string[] };

export const foodPresets: FoodPreset[] = [
  { name: "Banana mediana", aliases: ["banana", "ban"], calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1 },
  { name: "Banana grande", aliases: ["banana grande"], calories: 121, protein: 1.5, carbs: 31, fat: 0.4, fiber: 3.5 },
  { name: "Pechuga de pollo 150 g", aliases: ["pollo", "pechuga"], calories: 248, protein: 46, carbs: 0, fat: 5.4, fiber: 0 },
  { name: "Arroz cocido 150 g", aliases: ["arroz"], calories: 195, protein: 4.1, carbs: 42, fat: 0.4, fiber: 0.6 },
  { name: "Leche 250 ml", aliases: ["leche"], calories: 122, protein: 8, carbs: 12, fat: 4.8, fiber: 0 },
  { name: "Avena 50 g", aliases: ["avena"], calories: 190, protein: 6.5, carbs: 33, fat: 3.5, fiber: 5 },
  { name: "Proteina whey 35 g", aliases: ["proteina", "whey", "whey protein"], calories: 135, protein: 27, carbs: 3, fat: 2, fiber: 0 },
  { name: "Verduras 200 g", aliases: ["verduras", "vegetales"], calories: 70, protein: 4, carbs: 12, fat: 0.8, fiber: 6 },
  { name: "Yogur 190 g", aliases: ["yogur", "yogurt"], calories: 120, protein: 8, carbs: 16, fat: 2, fiber: 0 },
  { name: "Frutos secos 30 g", aliases: ["frutos secos", "nueces", "almendras"], calories: 185, protein: 6, carbs: 6, fat: 16, fiber: 3 },
  { name: "Carne magra 180 g", aliases: ["carne", "bife"], calories: 360, protein: 46, carbs: 0, fat: 18, fiber: 0 },
  { name: "Ensalada completa", aliases: ["ensalada"], calories: 90, protein: 3, carbs: 11, fat: 4, fiber: 5 }
];

export function suggestFoods(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return foodPresets.slice(0, 5);
  return foodPresets.filter((food) => food.name.toLowerCase().includes(normalized) || food.aliases.some((alias) => alias.includes(normalized))).slice(0, 6);
}

export function findFoodPreset(query: string) {
  const normalized = query.trim().toLowerCase();
  return foodPresets.find((food) => food.name.toLowerCase().includes(normalized) || food.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized)));
}

export function parseFoodText(value: string): FoodEntry[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => {
      const preset = findFoodPreset(name);
      return preset ? toFoodEntry(preset, "text", name) : unknownFoodEntry(name);
    });
}

export function parseFoodQuery(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/(\d+(?:[.,]\d+)?)\s*(gramos|gramo|gr|g|ml|cc|l|unidad|unidades|u)\b/i);
  const unitlessMatch = match ? undefined : normalized.match(/^(\d+(?:[.,]\d+)?)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ][\wáéíóúÁÉÍÓÚñÑ-]*)/);
  const amount = match ? Number(match[1].replace(",", ".")) : unitlessMatch ? Number(unitlessMatch[1].replace(",", ".")) : undefined;
  const rawUnit = match?.[2]?.toLowerCase();
  const unit = rawUnit ? ({ gramos: "g", gramo: "g", gr: "g", g: "g", ml: "ml", cc: "ml", l: "l", unidad: "un", unidades: "un", u: "un" }[rawUnit] ?? rawUnit) : unitlessMatch ? "un" : undefined;
  const name = normalized.replace(match?.[0] ?? unitlessMatch?.[1] ?? "", "").replace(/\bde\b/gi, "").replace(/\s+/g, " ").trim() || normalized;
  return { name, amount, unit, amountLabel: amount && unit ? `${amount} ${unit}` : undefined };
}

export function estimatePhotoFoods(): FoodEntry[] {
  return [
    toFoodEntry(matchPreset("pollo"), "photo", "Pollo estimado"),
    toFoodEntry(matchPreset("arroz"), "photo", "Arroz estimado")
  ];
}

export function sumMeals(meals: FoodEntry[]): Omit<NutritionLog, "id" | "dateKey" | "waterMl" | "weightKg" | "createdAt" | "updatedAt"> {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
      fiber: (acc.fiber ?? 0) + meal.fiber,
      meals
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals } as Omit<NutritionLog, "id" | "dateKey" | "waterMl" | "weightKg" | "createdAt" | "updatedAt">
  );
}

export function calculateNutritionTotals(meals: FoodEntry[], planItems: NutritionPlanItem[] = [], drinks: DrinkEntry[] = []) {
  const completedPlanFoods = planItems.filter((item) => item.done).map(planItemToFood);
  const drinkFoods = drinks.map(drinkToFoodEntry);
  return sumMeals([...completedPlanFoods, ...meals, ...drinkFoods]);
}

export function normalizeNutritionLog(log: NutritionLog): NutritionLog {
  const totals = calculateNutritionTotals(log.meals ?? [], log.planItems ?? [], log.drinks ?? []);
  return {
    ...log,
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
    fiber: totals.fiber,
    waterMl: (log.drinks ?? []).filter((drink) => drink.type === "water").reduce((sum, drink) => sum + drink.amountMl, 0)
  };
}

export function planItemToFood(item: NutritionPlanItem): FoodEntry {
  const preset = findFoodPreset(item.name);
  return {
    id: `plan-food-${item.id}`,
    name: item.name,
    calories: item.calories ?? preset?.calories ?? 0,
    protein: item.protein ?? preset?.protein ?? 0,
    carbs: item.carbs ?? preset?.carbs ?? 0,
    fat: item.fat ?? preset?.fat ?? 0,
    fiber: item.fiber ?? preset?.fiber ?? 0,
    estimated: !preset,
    source: "text",
    calculationMethod: preset ? "database" : "fallback"
  };
}

export function drinkNutrition(type: DrinkType, amountMl: number) {
  const factor = amountMl / 100;
  const per100: Record<DrinkType, { calories: number; protein: number; carbs: number; fat: number; fiber: number }> = {
    water: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    soda: { calories: 42, protein: 0, carbs: 10.5, fat: 0, fiber: 0 },
    juice: { calories: 45, protein: 0.2, carbs: 10.8, fat: 0, fiber: 0.2 },
    isotonic: { calories: 24, protein: 0, carbs: 6, fat: 0, fiber: 0 },
    alcohol: { calories: 70, protein: 0, carbs: 3, fat: 0, fiber: 0 },
    other: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  };
  const base = per100[type];
  return {
    calories: base.calories * factor,
    protein: base.protein * factor,
    carbs: base.carbs * factor,
    fat: base.fat * factor,
    fiber: base.fiber * factor
  };
}

export function createDrinkEntry(type: DrinkType, amount: number, unit: "ml" | "cc" | "l"): DrinkEntry {
  const amountMl = drinkToMl(amount, unit);
  return {
    id: DateTimeService.id("drink"),
    type,
    amountMl,
    label: `${amount} ${unit}`,
    ...drinkNutrition(type, amountMl)
  };
}

function matchPreset(name: string) {
  const normalized = name.toLowerCase();
  return foodPresets.find((food) => food.name.toLowerCase().includes(normalized) || food.aliases.some((alias) => normalized.includes(alias))) ?? foodPresets[0];
}

export function unknownFoodEntry(name: string): FoodEntry {
  const parsed = parseFoodQuery(name);
  return {
    id: DateTimeService.id("food"),
    name: parsed.name,
    inputText: name,
    amount: parsed.amount,
    unit: parsed.unit,
    amountLabel: parsed.amountLabel,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    estimated: true,
    source: "text",
    calculationMethod: "manual",
    createdAt: DateTimeService.nowIso()
  };
}

const defaultPlanItems: Omit<NutritionPlanItem, "id">[] = [
  { meal: "Desayuno", name: "Avena", done: false },
  { meal: "Desayuno", name: "Banana", done: false },
  { meal: "Desayuno", name: "Whey Protein", done: false },
  { meal: "Almuerzo", name: "Pollo", done: false },
  { meal: "Almuerzo", name: "Arroz", done: false },
  { meal: "Almuerzo", name: "Verduras", done: false },
  { meal: "Merienda", name: "Yogur", done: false },
  { meal: "Merienda", name: "Frutos secos", done: false },
  { meal: "Cena", name: "Carne", done: false },
  { meal: "Cena", name: "Ensalada", done: false }
];

export const defaultNutritionPlan: NutritionPlanItem[] = defaultPlanItems.map((item, index) => ({ id: `plan-${index}-${item.meal}-${item.name}`, ...item }));

export function drinkToMl(amount: number, unit: "ml" | "cc" | "l") {
  if (unit === "l") return amount * 1000;
  return amount;
}

function drinkToFoodEntry(drink: DrinkEntry): FoodEntry {
  const macros = drink.calories === undefined ? drinkNutrition(drink.type, drink.amountMl) : drink;
  return {
    id: `drink-food-${drink.id}`,
    name: drinkLabel(drink.type),
    amountLabel: drink.label,
    calories: macros.calories ?? 0,
    protein: macros.protein ?? 0,
    carbs: macros.carbs ?? 0,
    fat: macros.fat ?? 0,
    fiber: macros.fiber ?? 0,
    estimated: false,
    source: "text",
    calculationMethod: "database"
  };
}

function drinkLabel(type: DrinkType) {
  return {
    water: "Agua",
    soda: "Gaseosa",
    juice: "Jugo",
    isotonic: "Isotonica",
    alcohol: "Alcohol",
    other: "Bebida"
  }[type];
}

export function toFoodEntry(food: FoodPreset, source: FoodEntry["source"], label?: string): FoodEntry {
  const parsed = parseFoodQuery(label ?? food.name);
  return {
    id: DateTimeService.id("food"),
    name: label ?? food.name,
    inputText: label ?? food.name,
    amount: parsed.amount,
    unit: parsed.unit,
    amountLabel: parsed.amountLabel,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    estimated: source === "photo" || source === "text",
    source,
    calculationMethod: source === "photo" ? "photo" : "database",
    createdAt: DateTimeService.nowIso()
  };
}

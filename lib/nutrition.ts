import type { FoodEntry, NutritionLog, NutritionPlanItem } from "@/types/apex";

type FoodPreset = Omit<FoodEntry, "id" | "estimated" | "source"> & { aliases: string[] };

export const foodPresets: FoodPreset[] = [
  { name: "Banana mediana", aliases: ["banana", "ban"], calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1 },
  { name: "Banana grande", aliases: ["banana grande"], calories: 121, protein: 1.5, carbs: 31, fat: 0.4, fiber: 3.5 },
  { name: "Pechuga de pollo 150 g", aliases: ["pollo", "pechuga"], calories: 248, protein: 46, carbs: 0, fat: 5.4, fiber: 0 },
  { name: "Arroz cocido 150 g", aliases: ["arroz"], calories: 195, protein: 4.1, carbs: 42, fat: 0.4, fiber: 0.6 },
  { name: "Leche 250 ml", aliases: ["leche"], calories: 122, protein: 8, carbs: 12, fat: 4.8, fiber: 0 },
  { name: "Avena 50 g", aliases: ["avena"], calories: 190, protein: 6.5, carbs: 33, fat: 3.5, fiber: 5 },
  { name: "Proteina whey 35 g", aliases: ["proteina", "whey"], calories: 135, protein: 27, carbs: 3, fat: 2, fiber: 0 }
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

function matchPreset(name: string) {
  const normalized = name.toLowerCase();
  return foodPresets.find((food) => food.name.toLowerCase().includes(normalized) || food.aliases.some((alias) => normalized.includes(alias))) ?? foodPresets[0];
}

export function unknownFoodEntry(name: string): FoodEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    estimated: true,
    source: "text"
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

function toFoodEntry(food: FoodPreset, source: FoodEntry["source"], label?: string): FoodEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: label ?? food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    estimated: source === "photo" || source === "text",
    source
  };
}

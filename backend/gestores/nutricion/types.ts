export type NutritionCreateInput = {
  foodId?: string;
  mealType?: string;
  loggedAt?: Date;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  metadata?: Record<string, unknown>;
};

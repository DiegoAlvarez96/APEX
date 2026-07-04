import { z } from "zod";

export const nutritionCreateSchema = z.object({
  foodId: z.string().optional(),
  mealType: z.string().optional(),
  loggedAt: z.date().optional(),
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional()
});

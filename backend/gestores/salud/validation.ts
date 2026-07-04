import { z } from "zod";
import { HealthMetricType } from "@/lib/generated/prisma/enums";

export const healthMetricSchema = z.object({
  type: z.nativeEnum(HealthMetricType),
  value: z.number().optional(),
  unit: z.string().optional(),
  source: z.string().min(1),
  measuredAt: z.date(),
  metadata: z.record(z.unknown()).optional()
});

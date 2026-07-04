import type { HealthMetricType } from "@/lib/generated/prisma/enums";

export type HealthMetricInput = {
  type: HealthMetricType;
  value?: number;
  unit?: string;
  source: string;
  measuredAt: Date;
  metadata?: Record<string, unknown>;
};

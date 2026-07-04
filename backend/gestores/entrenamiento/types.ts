export type WorkoutCreateInput = {
  title: string;
  focus?: string;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
};

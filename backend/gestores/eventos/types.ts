export type EventCreateInput = {
  title: string;
  startsAt: Date;
  endsAt?: Date;
  metadata?: Record<string, unknown>;
};

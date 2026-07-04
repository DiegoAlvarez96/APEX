import { eventsRepository } from "@/lib/server/repositories/eventsRepository";

export const calendarService = {
  listInternalEvents(userId: string, from: Date, to: Date) {
    return eventsRepository.listByRange(userId, from, to);
  },

  createInternalEvent(input: { userId: string; title: string; startsAt: Date; endsAt?: Date; metadata?: Record<string, unknown> }) {
    return eventsRepository.create({ ...input, source: "internal" });
  },

  syncGoogleCalendar() {
    throw new Error("Google Calendar sync is intentionally deferred behind the external connections manager.");
  }
};

import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";
import { describeEventDate } from "@/lib/schedule-image";

/** In-app notifications are deleted this many days after being created. */
export const NOTIFICATION_TTL_DAYS = 7;

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
/** The "your event is tomorrow" notice appears once the event is this close. */
const REMINDER_HOURS = 24;

/**
 * Whether the reminder moment has ALREADY passed when someone joins an event. It is marked as done right
 * away, so joining an event that starts in 5 hours does not trigger a "24 hours" notice.
 * `now` is a wall-clock Date (see `wallClockNow`), like the stored event dates.
 */
export function initialReminderMarks(startsAt: Date, now = wallClockNow()) {
  const passed = startsAt.getTime() - REMINDER_HOURS * HOUR_MS <= now.getTime();
  return { remind24At: passed ? new Date() : null };
}

/**
 * Creates the bell notice for the user's events that start within the next 24 hours. It runs when the
 * person opens the app (the bell asks for their notifications), so it needs no scheduler or server that
 * stays on. Each notice is "claimed" in the database first, so it is created only once.
 */
export async function createDueReminders(userId: string, now = wallClockNow()) {
  const due = await prisma.enrollment.findMany({
    where: {
      userId,
      status: "CONFIRMED",
      remind24At: null,
      event: { startsAt: { gt: now, lte: new Date(now.getTime() + REMINDER_HOURS * HOUR_MS) } },
    },
    select: { id: true, event: { select: { id: true, title: true, startsAt: true } } },
  });

  for (const { id, event } of due) {
    const claimed = await prisma.enrollment.updateMany({ where: { id, remind24At: null }, data: { remind24At: new Date() } });
    if (claimed.count === 0) continue; // another request took it

    const { weekdayLong, dateFull, time } = describeEventDate(event.startsAt);
    await prisma.notification.create({
      data: {
        userId,
        eventId: event.id,
        kind: "REMINDER_24H",
        title: `Lembrete: ${event.title}`,
        message: `Seu evento é ${weekdayLong}, ${dateFull} às ${time}.`,
      },
    });
  }
}

/** Deletes notifications older than `NOTIFICATION_TTL_DAYS` days. Returns how many were removed. */
export async function purgeExpiredNotifications() {
  const { count } = await prisma.notification.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - NOTIFICATION_TTL_DAYS * DAY_MS) } },
  });
  return count;
}

import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";
import { describeEventDate } from "@/lib/schedule-image";

/** In-app notifications are deleted this many days after being created... */
export const NOTIFICATION_TTL_DAYS = 7;
/** ...or this many days after the person read them, whichever comes first. */
export const READ_NOTIFICATION_TTL_DAYS = 3;

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

/** Deletes old notifications (unread ones after 7 days, read ones after 3). Returns how many were removed. */
export async function purgeExpiredNotifications() {
  const { count } = await prisma.notification.deleteMany({
    where: {
      OR: [
        { createdAt: { lt: new Date(Date.now() - NOTIFICATION_TTL_DAYS * DAY_MS) } },
        { readAt: { lt: new Date(Date.now() - READ_NOTIFICATION_TTL_DAYS * DAY_MS) } },
      ],
    },
  });
  return count;
}

/**
 * Tells every leader (bell) that a volunteer just signed up for an event. Never breaks the signup itself:
 * a failure here is ignored. The same notice is not repeated within 10 minutes (cancel + join again).
 */
export async function notifyLeadersOfSignup(params: {
  volunteerName: string;
  spouseName?: string | null;
  eventId: string;
  eventTitle: string;
  startsAt: Date;
}) {
  try {
    const who = params.spouseName ? `${params.volunteerName} e ${params.spouseName}` : params.volunteerName;
    const { dateFull, time } = describeEventDate(params.startsAt);
    const message = `${who} vai participar de "${params.eventTitle}" (${dateFull} às ${time}).`;

    const repeated = await prisma.notification.findFirst({
      where: { kind: "VOLUNTEER_JOINED", message, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } },
      select: { id: true },
    });
    if (repeated) return;

    const leaders = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await prisma.notification.createMany({
      data: leaders.map((leader) => ({
        userId: leader.id,
        eventId: params.eventId,
        kind: "VOLUNTEER_JOINED" as const,
        title: "Nova participação",
        message,
      })),
    });
  } catch (error) {
    console.error("[notificacoes] aviso de nova participação falhou:", error);
  }
}

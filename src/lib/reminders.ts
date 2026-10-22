import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";
import { describeEventDate } from "@/lib/schedule-image";
import { sendReminderEmail, type DeliveryResult } from "@/lib/email";

/** In-app notifications are deleted this many days after being created. */
export const NOTIFICATION_TTL_DAYS = 7;

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
/** The reminder goes out when the event is 24 hours away. */
const REMINDER_HOURS = 24;
const LEAD = "24 horas";
/** A reminder is only sent within this many hours after its moment; older ones are skipped. */
const GRACE_HOURS = 3;
const MAX_ATTEMPTS = 3;

function describeWhen(startsAt: Date) {
  const { weekdayLong, dateFull, time } = describeEventDate(startsAt);
  return `${weekdayLong}, ${dateFull} às ${time}`;
}

/**
 * Whether the reminder moment has ALREADY passed when someone joins an event. It is marked as done
 * right away, so joining 5 hours before an event does not trigger a late "24 hours" message.
 */
export function initialReminderMarks(startsAt: Date, now = wallClockNow()) {
  const passed = startsAt.getTime() - REMINDER_HOURS * HOUR_MS <= now.getTime();
  return { remind24At: passed ? new Date() : null };
}

interface Delivery {
  recipient: { name: string; email: string; notifyEmail: boolean };
  event: { title: string; startsAt: Date; dressCode: string[]; note: string | null };
  /** "ENTRADA 4 e 5 — Nave esquerda" when the leader already placed the volunteer. */
  slot: string | null;
}

/** Sends the reminder email, but only to people who allowed it in their profile. */
async function deliverEmail(notificationId: string, { recipient, event, slot }: Delivery): Promise<DeliveryResult> {
  const result: DeliveryResult = !recipient.notifyEmail
    ? { status: "SKIPPED", error: "Voluntário desativou o e-mail" }
    : await sendReminderEmail({
        to: recipient.email,
        name: recipient.name,
        eventTitle: event.title,
        when: describeWhen(event.startsAt),
        lead: LEAD,
        uniform: event.dressCode,
        note: event.note,
        slot,
      });

  await prisma.notification.update({
    where: { id: notificationId },
    data: { emailStatus: result.status, emailError: result.error ?? null, emailAttempts: { increment: 1 } },
  });
  return result;
}

export interface ReminderSummary {
  created: number;
  email: { sent: number; skipped: number; failed: number };
}

function slotText(slot: { label: string; location: string | null } | null) {
  if (!slot) return null;
  return slot.location ? `${slot.label} — ${slot.location}` : slot.label;
}

/**
 * Creates the in-app notification and emails the reminder to every confirmed volunteer whose event
 * starts in about 24 hours. Safe to run often and from several servers at once: each reminder is
 * "claimed" in the database before it is processed, so it happens only once.
 *
 * `now` is a wall-clock Date (see `wallClockNow`), like the stored event dates.
 */
export async function runReminders(now = wallClockNow()): Promise<ReminderSummary> {
  const summary: ReminderSummary = { created: 0, email: { sent: 0, skipped: 0, failed: 0 } };
  const createdNow = new Set<string>();
  const count = (result: DeliveryResult) => {
    if (result.status === "SENT") summary.email.sent++;
    else if (result.status === "SKIPPED") summary.email.skipped++;
    else summary.email.failed++;
  };

  const windowEnd = new Date(now.getTime() + REMINDER_HOURS * HOUR_MS);
  const windowStart = new Date(windowEnd.getTime() - GRACE_HOURS * HOUR_MS);

  const due = await prisma.enrollment.findMany({
    where: { status: "CONFIRMED", remind24At: null, event: { startsAt: { gt: windowStart, lte: windowEnd } } },
    include: {
      user: { select: { id: true, name: true, email: true, notifyEmail: true } },
      event: { select: { id: true, title: true, startsAt: true, dressCode: true, note: true } },
      slot: { select: { label: true, location: true } },
    },
  });

  for (const enrollment of due) {
    const claimed = await prisma.enrollment.updateMany({
      where: { id: enrollment.id, remind24At: null },
      data: { remind24At: new Date() },
    });
    if (claimed.count === 0) continue; // another run took it

    const notification = await prisma.notification.create({
      data: {
        userId: enrollment.user.id,
        eventId: enrollment.event.id,
        kind: "REMINDER_24H",
        title: `Lembrete: ${enrollment.event.title}`,
        message: `Seu evento começa em ${LEAD}: ${describeWhen(enrollment.event.startsAt)}.`,
      },
    });
    summary.created++;
    createdNow.add(notification.id);

    count(
      await deliverEmail(notification.id, {
        recipient: enrollment.user,
        event: enrollment.event,
        slot: slotText(enrollment.slot),
      }),
    );
  }

  // Emails that failed (network, provider hiccup) are retried a few times shortly afterwards.
  const retryable = await prisma.notification.findMany({
    where: {
      kind: "REMINDER_24H",
      eventId: { not: null },
      createdAt: { gt: new Date(Date.now() - GRACE_HOURS * HOUR_MS) },
      emailStatus: "FAILED",
      emailAttempts: { lt: MAX_ATTEMPTS },
    },
    include: { user: { select: { name: true, email: true, notifyEmail: true } } },
  });
  for (const notification of retryable) {
    // A delivery that just failed waits for the next round instead of being repeated at once.
    if (!notification.eventId || createdNow.has(notification.id)) continue;
    const [event, enrollment] = await Promise.all([
      prisma.event.findUnique({
        where: { id: notification.eventId },
        select: { title: true, startsAt: true, dressCode: true, note: true },
      }),
      prisma.enrollment.findUnique({
        where: { userId_eventId: { userId: notification.userId, eventId: notification.eventId } },
        select: { slot: { select: { label: true, location: true } } },
      }),
    ]);
    if (!event) continue;

    count(await deliverEmail(notification.id, { recipient: notification.user, event, slot: slotText(enrollment?.slot ?? null) }));
  }

  return summary;
}

/** Deletes notifications older than `NOTIFICATION_TTL_DAYS` days. Returns how many were removed. */
export async function purgeExpiredNotifications() {
  const { count } = await prisma.notification.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - NOTIFICATION_TTL_DAYS * DAY_MS) } },
  });
  return count;
}

import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";
import { describeEventDate } from "@/lib/schedule-image";
import { sendReminderEmail, type DeliveryResult } from "@/lib/email";

const HOUR_MS = 3_600_000;
/**
 * The job runs twice a day (every 12 hours). Each volunteer is reminded by the first run that finds the event
 * within this many hours, so the reminder always arrives between 24 and 36 hours before it starts.
 */
const WINDOW_HOURS = 36;
/** Emails that failed are retried by the following runs, this many times at most... */
const MAX_ATTEMPTS = 3;
/** ...for up to this many hours after the reminder was created. */
const RETRY_HOURS = 30;

function describeWhen(startsAt: Date) {
  const { weekdayLong, dateFull, time } = describeEventDate(startsAt);
  return `${weekdayLong}, ${dateFull} às ${time}`;
}

function slotText(slot: { label: string; location: string | null } | null) {
  if (!slot) return null;
  return slot.location ? `${slot.label} — ${slot.location}` : slot.label;
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

/**
 * Creates the bell notice and emails the reminder to every confirmed volunteer whose event starts within the
 * next `WINDOW_HOURS`. Safe to run any number of times, even from several servers at once: each reminder is
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

  const due = await prisma.enrollment.findMany({
    where: {
      status: "CONFIRMED",
      remind24At: null,
      event: { startsAt: { gt: now, lte: new Date(now.getTime() + WINDOW_HOURS * HOUR_MS) } },
    },
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
        message: `Seu evento é ${describeWhen(enrollment.event.startsAt)}.`,
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

  // Emails that failed (network, provider hiccup) are retried by later runs.
  const retryable = await prisma.notification.findMany({
    where: {
      kind: "REMINDER_24H",
      eventId: { not: null },
      createdAt: { gt: new Date(Date.now() - RETRY_HOURS * HOUR_MS) },
      emailStatus: "FAILED",
      emailAttempts: { lt: MAX_ATTEMPTS },
    },
    include: { user: { select: { name: true, email: true, notifyEmail: true } } },
  });
  for (const notification of retryable) {
    // A delivery that just failed waits for the next run instead of being repeated at once.
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

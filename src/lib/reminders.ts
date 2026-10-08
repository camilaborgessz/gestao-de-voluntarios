import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";
import { describeEventDate } from "@/lib/schedule-image";
import { sendReminderWhatsApp, toWhatsAppNumber, type DeliveryResult } from "@/lib/whatsapp";

/** In-app notifications are deleted this many days after being created. */
export const NOTIFICATION_TTL_DAYS = 7;

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
/** A reminder is only sent within this many hours after its moment; older ones are skipped. */
const GRACE_HOURS = 3;
const MAX_WHATSAPP_ATTEMPTS = 3;

const REMINDERS = [
  { kind: "REMINDER_24H", hours: 24, field: "remind24At", lead: "24 horas" },
  { kind: "REMINDER_12H", hours: 12, field: "remind12At", lead: "12 horas" },
] as const;

const LEAD_BY_KIND = { REMINDER_24H: "24 horas", REMINDER_12H: "12 horas" } as const;

function describeWhen(startsAt: Date) {
  const { weekdayLong, dateFull, time } = describeEventDate(startsAt);
  return `${weekdayLong}, ${dateFull} às ${time}`;
}

/**
 * Reminder moments that have ALREADY passed when someone joins an event. Those are marked as done
 * right away, so joining 5 hours before an event does not trigger a late "24 hours" message.
 */
export function initialReminderMarks(startsAt: Date, now = wallClockNow()) {
  const passed = (hours: number) => (startsAt.getTime() - hours * HOUR_MS <= now.getTime() ? new Date() : null);
  return { remind24At: passed(24), remind12At: passed(12) };
}

async function deliver(
  notificationId: string,
  user: { name: string; phone: string | null },
  event: { title: string; startsAt: Date },
  lead: string,
): Promise<DeliveryResult> {
  const to = toWhatsAppNumber(user.phone);
  const result: DeliveryResult = to
    ? await sendReminderWhatsApp({
        to,
        name: user.name.split(" ")[0],
        eventTitle: event.title,
        when: describeWhen(event.startsAt),
        lead,
      })
    : { status: "SKIPPED", error: "Voluntário sem telefone válido cadastrado" };

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      whatsappStatus: result.status,
      whatsappError: result.error ?? null,
      whatsappAttempts: { increment: 1 },
    },
  });
  return result;
}

export interface ReminderSummary {
  created: number;
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Creates the in-app notification and sends the WhatsApp message for every confirmed volunteer whose
 * event starts in about 24 h / 12 h. Safe to run often and from several servers at once: each reminder
 * is "claimed" in the database before it is processed, so it happens only once.
 *
 * `now` is a wall-clock Date (see `wallClockNow`), like the stored event dates.
 */
export async function runReminders(now = wallClockNow()): Promise<ReminderSummary> {
  const summary: ReminderSummary = { created: 0, sent: 0, skipped: 0, failed: 0 };
  const count = (result: DeliveryResult) => {
    if (result.status === "SENT") summary.sent++;
    else if (result.status === "SKIPPED") summary.skipped++;
    else summary.failed++;
  };

  for (const reminder of REMINDERS) {
    const windowEnd = new Date(now.getTime() + reminder.hours * HOUR_MS);
    const windowStart = new Date(windowEnd.getTime() - GRACE_HOURS * HOUR_MS);
    const unsent = reminder.field === "remind24At" ? { remind24At: null } : { remind12At: null };

    const due = await prisma.enrollment.findMany({
      where: { status: "CONFIRMED", ...unsent, event: { startsAt: { gt: windowStart, lte: windowEnd } } },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        event: { select: { id: true, title: true, startsAt: true } },
      },
    });

    for (const enrollment of due) {
      const claimed = await prisma.enrollment.updateMany({
        where: { id: enrollment.id, ...unsent },
        data: reminder.field === "remind24At" ? { remind24At: new Date() } : { remind12At: new Date() },
      });
      if (claimed.count === 0) continue; // another run took it

      const notification = await prisma.notification.create({
        data: {
          userId: enrollment.user.id,
          eventId: enrollment.event.id,
          kind: reminder.kind,
          title: `Lembrete: ${enrollment.event.title}`,
          message: `Seu evento começa em ${reminder.lead}: ${describeWhen(enrollment.event.startsAt)}.`,
        },
      });
      summary.created++;
      count(await deliver(notification.id, enrollment.user, enrollment.event, reminder.lead));
    }
  }

  // Messages that failed (network, API hiccup) are retried a few times shortly afterwards.
  const retryable = await prisma.notification.findMany({
    where: {
      whatsappStatus: "FAILED",
      whatsappAttempts: { lt: MAX_WHATSAPP_ATTEMPTS },
      createdAt: { gt: new Date(Date.now() - GRACE_HOURS * HOUR_MS) },
      eventId: { not: null },
    },
    include: { user: { select: { name: true, phone: true } } },
  });
  for (const notification of retryable) {
    const event = notification.eventId
      ? await prisma.event.findUnique({ where: { id: notification.eventId }, select: { title: true, startsAt: true } })
      : null;
    if (!event) continue;
    count(await deliver(notification.id, notification.user, event, LEAD_BY_KIND[notification.kind]));
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

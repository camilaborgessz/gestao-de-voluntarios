import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";
import { spouseKey } from "@/lib/spouse-key";

/** Past events and notices stay in the admin archive for this many days, then are deleted. */
export const ARCHIVE_DAYS = 30;

const DAY_MS = 86_400_000;

/** Midnight (wall clock) of the current day in the church's time zone. */
export function startOfTodayWallClock(now = wallClockNow()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Events are archived once their day has passed and stay for `ARCHIVE_DAYS` days
 * (the day right after the event counts as day 1).
 */
export function eventArchiveDaysLeft(startsAt: Date, now = wallClockNow()) {
  const today = startOfTodayWallClock(now).getTime();
  const eventDay = Date.UTC(startsAt.getUTCFullYear(), startsAt.getUTCMonth(), startsAt.getUTCDate());
  return Math.max(0, Math.round((eventDay + (ARCHIVE_DAYS + 1) * DAY_MS - today) / DAY_MS));
}

/** Notices are archived when their visibility window ends and stay for `ARCHIVE_DAYS` days. */
export function noticeArchiveDaysLeft(visibleUntil: Date, now = wallClockNow()) {
  return Math.max(0, Math.ceil((visibleUntil.getTime() + ARCHIVE_DAYS * DAY_MS - now.getTime()) / DAY_MS));
}

/**
 * Permanently removes one past event. Each confirmed volunteer gets +1 in `servicesDone` first, so the
 * "mais assíduos" ranking keeps the service. Only the call that actually deletes the event counts it
 * (two requests at once cannot count it twice). Returns false when the event was already gone.
 */
export async function deleteArchivedEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    select: { enrollments: { where: { status: "CONFIRMED" }, select: { userId: true, helpMode: true, spouseName: true } } },
  });
  if (!event) return false;

  const { count } = await prisma.event.deleteMany({ where: { id } });
  if (count === 0) return false;
  await Promise.all(
    event.enrollments.map(async ({ userId, helpMode, spouseName }) => {
      await prisma.user.updateMany({ where: { id: userId }, data: { servicesDone: { increment: 1 } } });
      // Signed up as a couple: the spouse served too.
      const name = spouseName?.trim();
      if (helpMode === "COUPLE" && name) {
        const key = spouseKey(name);
        await prisma.spouseService.upsert({
          where: { userId_key: { userId, key } },
          create: { userId, key, name, count: 1 },
          update: { count: { increment: 1 }, name },
        });
      }
    }),
  );
  return true;
}

/** Permanently removes archived events/notices older than `ARCHIVE_DAYS` days. */
export async function purgeExpiredArchive() {
  const now = wallClockNow();
  const eventCutoff = new Date(startOfTodayWallClock(now).getTime() - ARCHIVE_DAYS * DAY_MS);
  const noticeCutoff = new Date(now.getTime() - ARCHIVE_DAYS * DAY_MS);

  const expired = await prisma.event.findMany({ where: { startsAt: { lt: eventCutoff } }, select: { id: true } });
  for (const { id } of expired) await deleteArchivedEvent(id);

  await prisma.notice.deleteMany({ where: { visibleUntil: { lt: noticeCutoff } } });
}

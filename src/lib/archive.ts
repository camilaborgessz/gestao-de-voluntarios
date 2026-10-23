import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";

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
 * Permanently removes archived events/notices older than `ARCHIVE_DAYS` days.
 * Before an event disappears, each confirmed volunteer gets +1 in `servicesDone`, so the "mais assíduos"
 * ranking does not reset every month. Only the run that actually deletes the event counts it.
 */
export async function purgeExpiredArchive() {
  const now = wallClockNow();
  const eventCutoff = new Date(startOfTodayWallClock(now).getTime() - ARCHIVE_DAYS * DAY_MS);
  const noticeCutoff = new Date(now.getTime() - ARCHIVE_DAYS * DAY_MS);

  const expired = await prisma.event.findMany({
    where: { startsAt: { lt: eventCutoff } },
    select: { id: true, enrollments: { where: { status: "CONFIRMED" }, select: { userId: true } } },
  });
  for (const event of expired) {
    const { count } = await prisma.event.deleteMany({ where: { id: event.id } });
    if (count === 0) continue; // another request already removed (and counted) it
    await Promise.all(
      event.enrollments.map(({ userId }) =>
        prisma.user.updateMany({ where: { id: userId }, data: { servicesDone: { increment: 1 } } }),
      ),
    );
  }

  await prisma.notice.deleteMany({ where: { visibleUntil: { lt: noticeCutoff } } });
}

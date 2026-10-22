import { prisma } from "@/lib/prisma";

/** In-app notifications are deleted this many days after being created. */
export const NOTIFICATION_TTL_DAYS = 7;

const DAY_MS = 86_400_000;

/** Deletes notifications older than `NOTIFICATION_TTL_DAYS` days. Returns how many were removed. */
export async function purgeExpiredNotifications() {
  const { count } = await prisma.notification.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - NOTIFICATION_TTL_DAYS * DAY_MS) } },
  });
  return count;
}

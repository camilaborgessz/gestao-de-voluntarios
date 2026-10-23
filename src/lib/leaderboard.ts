import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";

export interface TopVolunteer {
  id: string;
  name: string;
  /** Services done: confirmed spots in events that already happened (including ones already archived). */
  services: number;
  /** Position in the ranking (1 = top). Ties are broken by who served most recently, then by name. */
  rank: number;
}

/**
 * Volunteers ranked by services done. A service is a confirmed spot in an event whose time has passed;
 * events purged from the archive are already folded into `servicesDone`.
 */
export async function getTopVolunteers(limit = 15): Promise<TopVolunteer[]> {
  const now = wallClockNow();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      servicesDone: true,
      enrollments: {
        where: { status: "CONFIRMED", event: { startsAt: { lt: now } } },
        select: { event: { select: { startsAt: true } } },
      },
    },
  });

  const ranked = users
    .map((user) => ({
      id: user.id,
      name: user.name,
      services: user.servicesDone + user.enrollments.length,
      // Events older than the archive are gone, so "last served" only looks at the ones still stored.
      lastServed: user.enrollments.reduce((latest, { event }) => Math.max(latest, event.startsAt.getTime()), 0),
    }))
    .filter((user) => user.services > 0)
    .sort(
      (a, b) =>
        b.services - a.services || b.lastServed - a.lastServed || a.name.localeCompare(b.name, "pt-BR"),
    )
    .slice(0, limit);

  return ranked.map(({ id, name, services }, index) => ({ id, name, services, rank: index + 1 }));
}

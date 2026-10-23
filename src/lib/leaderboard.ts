import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";

export interface TopVolunteer {
  id: string;
  name: string;
  /** Services done: confirmed spots in events that already happened (including ones already archived). */
  services: number;
  /** 1 for the top; people with the same number of services share the position. */
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
      _count: { select: { enrollments: { where: { status: "CONFIRMED", event: { startsAt: { lt: now } } } } } },
    },
  });

  const ranked = users
    .map((user) => ({ id: user.id, name: user.name, services: user.servicesDone + user._count.enrollments }))
    .filter((user) => user.services > 0)
    .sort((a, b) => b.services - a.services || a.name.localeCompare(b.name, "pt-BR"))
    .slice(0, limit);

  let rank = 0;
  let previous = -1;
  return ranked.map((user, index) => {
    if (user.services !== previous) rank = index + 1;
    previous = user.services;
    return { ...user, rank };
  });
}

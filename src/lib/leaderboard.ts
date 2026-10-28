import { prisma } from "@/lib/prisma";
import { wallClockNow } from "@/lib/event-schedule";
import { spouseKey } from "@/lib/spouse-key";

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
 * events purged from the archive are already folded into `servicesDone` / `SpouseService`.
 *
 * A spouse (who has no account) gets a row of his own, counting only the events the volunteer signed up
 * for as a couple. If the spouse is also a registered user, only his own account counts (no double credit).
 */
export async function getTopVolunteers(limit = 15): Promise<TopVolunteer[]> {
  const now = wallClockNow();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      servicesDone: true,
      spouseServices: { select: { key: true, name: true, count: true } },
      enrollments: {
        where: { status: "CONFIRMED", event: { startsAt: { lt: now } } },
        select: { helpMode: true, spouseName: true, event: { select: { startsAt: true } } },
      },
    },
  });

  const registered = new Set(users.map((user) => spouseKey(user.name)));

  interface Entry {
    id: string;
    name: string;
    services: number;
    lastServed: number;
  }
  const entries: Entry[] = [];

  for (const user of users) {
    entries.push({
      id: user.id,
      name: user.name,
      services: user.servicesDone + user.enrollments.length,
      // Events older than the archive are gone, so "last served" only looks at the ones still stored.
      lastServed: user.enrollments.reduce((latest, { event }) => Math.max(latest, event.startsAt.getTime()), 0),
    });

    // Spouses of this volunteer: events already archived (stored) + the ones still listed.
    const spouses = new Map<string, Entry>();
    for (const stored of user.spouseServices) {
      spouses.set(stored.key, { id: `spouse:${user.id}:${stored.key}`, name: stored.name, services: stored.count, lastServed: 0 });
    }
    for (const { helpMode, spouseName, event } of user.enrollments) {
      const name = spouseName?.trim();
      if (helpMode !== "COUPLE" || !name) continue;
      const key = spouseKey(name);
      const entry = spouses.get(key) ?? { id: `spouse:${user.id}:${key}`, name, services: 0, lastServed: 0 };
      entry.services += 1;
      entry.name = name;
      entry.lastServed = Math.max(entry.lastServed, event.startsAt.getTime());
      spouses.set(key, entry);
    }
    for (const [key, entry] of spouses) {
      if (!registered.has(key)) entries.push(entry);
    }
  }

  const ranked = entries
    .filter((entry) => entry.services > 0)
    .sort(
      (a, b) =>
        b.services - a.services || b.lastServed - a.lastServed || a.name.localeCompare(b.name, "pt-BR"),
    )
    .slice(0, limit);

  return ranked.map(({ id, name, services }, index) => ({ id, name, services, rank: index + 1 }));
}

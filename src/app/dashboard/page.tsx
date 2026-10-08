import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpcomingEventsList } from "@/components/dashboard/upcoming-events-list";
import type { EventRecord } from "@/components/dashboard/event-management";
import { VerseCard } from "@/components/dashboard/verse-card";
import { NoticesCard, type Notice } from "@/components/dashboard/notices-card";
import { after } from "next/server";
import { purgeExpiredArchive } from "@/lib/archive";
import { purgeExpiredNotifications } from "@/lib/reminders";
import { scheduleSlotsArgs, toScheduleView } from "@/lib/event-schedule-view";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";
import { formatShortDate, wallClockNow } from "@/lib/event-schedule";

export default async function DashboardPage() {
  const session = await auth();
  const isVolunteer = session?.user?.role !== "ADMIN";
  const userId = session?.user?.id;
  const firstName = session?.user?.name?.split(" ")[0] ?? "voluntário(a)";

  // Events and notices are stored as wall-clock values, so compare them with the local "now".
  const now = wallClockNow();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const profile = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { helpMode: true, spouseName: true } })
    : null;

  // Archived items older than 30 days are deleted without slowing this response down.
  after(() => Promise.all([purgeExpiredArchive(), purgeExpiredNotifications()]));

  const [verseOfTheDay, rawEvents, totalUpcoming, rawNotices, uniforms] = await Promise.all([
    getVerseOfTheDay(),
    prisma.event.findMany({
      where: { startsAt: { gte: startOfToday } },
      orderBy: { startsAt: "asc" },
      take: isVolunteer ? 50 : 8,
      include: {
        _count: { select: { enrollments: { where: { status: "CONFIRMED" } } } },
        slots: scheduleSlotsArgs,
        enrollments: { where: { userId: userId ?? "", status: "CONFIRMED" }, select: { id: true, helpMode: true } },
      },
    }),
    prisma.event.count({ where: { startsAt: { gte: startOfToday } } }),
    prisma.notice.findMany({
      where: { visibleFrom: { lte: now }, visibleUntil: { gte: now } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.uniform.findMany({ orderBy: { name: "asc" } }),
  ]);

  const upcomingEvents: EventRecord[] = rawEvents.map((event) => ({
    id: event.id,
    title: event.title,
    startsAt: event.startsAt,
    capacity: event.capacity,
    dressCode: event.dressCode,
    note: event.note,
    scheduleTitle: event.scheduleTitle,
    schedule: isVolunteer ? toScheduleView(event.slots) : undefined,
    filled: event._count.enrollments,
    joined: event.enrollments.length > 0,
    joinedMode: event.enrollments[0]?.helpMode,
  }));

  const notices: Notice[] = rawNotices.map((notice) => ({
    id: notice.id,
    message: notice.message,
    author: notice.author,
    postedAt: formatShortDate(notice.createdAt),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand/75 dark:text-lime-from/80">
          Bem-vindo (a), {firstName}
        </p>
        <h1 className="text-3xl font-semibold text-ink lg:text-4xl">
          Como está sua agenda hoje?
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-medium text-ink lg:text-2xl">Próximos eventos</h2>
            <span
              title={`${totalUpcoming} evento(s) a partir de hoje`}
              className="flex size-6 items-center justify-center rounded-full bg-lime-from/70 text-xs font-medium text-brand lg:size-7 lg:text-sm"
            >
              {totalUpcoming}
            </span>
          </div>

          <div className="flex flex-col gap-4 rounded-[10px] bg-surface p-5 shadow-[0_4px_37px_rgba(0,0,0,0.1)]">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-ink/60">Nenhum evento programado por enquanto.</p>
            ) : (
              <UpcomingEventsList
                events={upcomingEvents}
                uniforms={uniforms.map((u) => u.name)}
                initialCount={3}
                readOnly={isVolunteer}
                coupleOption={profile?.helpMode === "COUPLE"}
                defaultSpouseName={profile?.spouseName ?? ""}
              />
            )}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div>
            <h2 className="mb-4 text-xl font-medium text-ink lg:text-2xl">
              Versículo do dia
            </h2>
            <VerseCard verse={verseOfTheDay.verse} reference={verseOfTheDay.reference} />
          </div>

          <div>
            <h2 className="mb-4 text-xl font-medium text-ink lg:text-2xl">Avisos</h2>
            <NoticesCard notices={notices} initialCount={2} />
          </div>
        </section>
      </div>
    </div>
  );
}

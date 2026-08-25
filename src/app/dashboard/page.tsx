import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpcomingEventsList } from "@/components/dashboard/upcoming-events-list";
import type { EventRecord } from "@/components/dashboard/event-management";
import { VerseCard } from "@/components/dashboard/verse-card";
import { NoticesCard, type Notice } from "@/components/dashboard/notices-card";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";
import { formatShortDate } from "@/lib/event-schedule";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "voluntário(a)";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [verseOfTheDay, rawEvents, rawNotices, uniforms] = await Promise.all([
    getVerseOfTheDay(),
    prisma.event.findMany({
      where: { startsAt: { gte: startOfToday } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { _count: { select: { enrollments: { where: { status: "CONFIRMED" } } } } },
    }),
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
    filled: event._count.enrollments,
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
            <span className="flex size-6 items-center justify-center rounded-full bg-lime-from/70 text-xs font-medium text-brand lg:size-7 lg:text-sm">
              {upcomingEvents.length}
            </span>
          </div>

          <div className="flex flex-col gap-4 rounded-[10px] bg-surface p-5 shadow-[0_4px_37px_rgba(0,0,0,0.1)]">
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-ink/60">Nenhum evento programado por enquanto.</p>
            )}

            <UpcomingEventsList events={upcomingEvents} uniforms={uniforms.map((u) => u.name)} />

            {upcomingEvents.length > 0 && (
              <button className="self-end rounded-full bg-success-from/25 px-5 py-1.5 text-xs font-medium text-ink transition duration-150 ease-out hover:scale-105 hover:bg-success-from/40 active:scale-95 lg:text-sm">
                Ver mais
              </button>
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
            <NoticesCard notices={notices} />
          </div>
        </section>
      </div>
    </div>
  );
}

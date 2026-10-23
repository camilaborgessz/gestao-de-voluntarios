import Link from "next/link";
import type { Route } from "next";
import { requireAdminPage } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { seatsTaken } from "@/lib/seats";
import { wallClockNow } from "@/lib/event-schedule";
import {
  eventArchiveDaysLeft,
  noticeArchiveDaysLeft,
  purgeExpiredArchive,
  startOfTodayWallClock,
} from "@/lib/archive";
import { EventManagement } from "@/components/dashboard/event-management";
import { UniformManagement } from "@/components/dashboard/uniform-management";
import { NoticeManagement } from "@/components/dashboard/notice-management";
import { ArchiveSection } from "@/components/dashboard/archive-section";
import { LinkSpinner } from "@/components/dashboard/link-pending";

const tabClass = (active: boolean) =>
  `flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition duration-150 ease-out active:scale-95 ${
    active
      ? "border-brand bg-gradient-to-r from-brand to-brand-dark text-white shadow-sm dark:border-lime-from dark:bg-none dark:bg-lime-from dark:text-brand"
      : "border-brand/40 text-brand hover:bg-brand/10 dark:border-lime-from/40 dark:text-lime-from dark:hover:bg-white/10"
  }`;

export default async function GestaoPage({ searchParams }: { searchParams: Promise<{ aba?: string; filtro?: string }> }) {
  await requireAdminPage();
  const { aba, filtro } = await searchParams;
  const showArchive = aba === "arquivados";
  const onlyPending = filtro === "pendentes" && !showArchive;

  // Anything archived for more than 30 days is removed before listing.
  await purgeExpiredArchive();

  const now = wallClockNow();
  const startOfToday = startOfTodayWallClock(now);

  const [events, archivedEvents, uniforms, notices, archivedNotices] = await Promise.all([
    prisma.event.findMany({
      where: { startsAt: { gte: startOfToday } },
      orderBy: { startsAt: "asc" },
      include: { enrollments: { where: { status: "CONFIRMED" }, select: { helpMode: true, slotId: true } } },
    }),
    prisma.event.findMany({
      where: { startsAt: { lt: startOfToday } },
      orderBy: { startsAt: "desc" },
      include: { enrollments: { where: { status: "CONFIRMED" }, select: { helpMode: true } } },
    }),
    prisma.uniform.findMany({ orderBy: { name: "asc" } }),
    prisma.notice.findMany({ where: { visibleUntil: { gte: now } }, orderBy: { createdAt: "desc" } }),
    prisma.notice.findMany({ where: { visibleUntil: { lt: now } }, orderBy: { visibleUntil: "desc" } }),
  ]);

  const archivedCount = archivedEvents.length + archivedNotices.length;

  // Events that still need the leader: spots (vagas) left to fill, or volunteers not placed in the escala yet.
  const visibleEvents = events
    .map(({ enrollments, ...event }) => ({
      ...event,
      filled: seatsTaken(enrollments),
      pending: seatsTaken(enrollments) < event.capacity || enrollments.some((enrollment) => !enrollment.slotId),
    }))
    .filter((event) => !onlyPending || event.pending);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Gestão</h1>

      <nav aria-label="Seções da gestão" className="flex flex-wrap gap-2">
        <Link href={"/dashboard/eventos/novo" as Route} aria-current={showArchive ? undefined : "page"} className={tabClass(!showArchive)}>
          Em andamento
          <LinkSpinner />
        </Link>
        <Link
          href={"/dashboard/eventos/novo?aba=arquivados" as Route}
          aria-current={showArchive ? "page" : undefined}
          className={tabClass(showArchive)}
        >
          Arquivados
          <LinkSpinner />
          <span
            className={`flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
              showArchive ? "bg-lime-from text-brand dark:bg-brand dark:text-lime-from" : "bg-brand/10 dark:bg-white/10"
            }`}
          >
            {archivedCount}
          </span>
        </Link>
      </nav>

      {showArchive ? (
        <ArchiveSection
          events={archivedEvents.map((event) => ({
            id: event.id,
            title: event.title,
            startsAt: event.startsAt,
            capacity: event.capacity,
            dressCode: event.dressCode,
            note: event.note,
            filled: seatsTaken(event.enrollments),
            daysLeft: eventArchiveDaysLeft(event.startsAt, now),
          }))}
          notices={archivedNotices.map((notice) => ({
            id: notice.id,
            message: notice.message,
            visibleUntil: notice.visibleUntil,
            daysLeft: noticeArchiveDaysLeft(notice.visibleUntil, now),
          }))}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {onlyPending && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-brand/30 bg-lime-from/30 px-4 py-2.5 text-sm text-ink dark:border-lime-from/30 dark:bg-white/5">
                <span>Mostrando só eventos com vagas em aberto ou escala por montar.</span>
                <Link
                  href={"/dashboard/eventos/novo" as Route}
                  className="flex items-center gap-2 font-semibold text-brand underline-offset-4 hover:underline dark:text-lime-from"
                >
                  Ver todos
                  <LinkSpinner />
                </Link>
              </div>
            )}
            <EventManagement events={visibleEvents} uniforms={uniforms.map((u) => u.name)} />
          </div>

          <section className="flex flex-col gap-6">
            <UniformManagement uniforms={uniforms} />
            <NoticeManagement notices={notices} />
          </section>
        </div>
      )}
    </div>
  );
}

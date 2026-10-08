import Link from "next/link";
import type { Route } from "next";
import { requireAdminPage } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
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

const tabClass = (active: boolean) =>
  `flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition duration-150 ease-out active:scale-95 ${
    active
      ? "border-brand bg-gradient-to-r from-brand to-brand-dark text-white shadow-sm dark:border-lime-from dark:bg-none dark:bg-lime-from dark:text-brand"
      : "border-brand/40 text-brand hover:bg-brand/10 dark:border-lime-from/40 dark:text-lime-from dark:hover:bg-white/10"
  }`;

export default async function GestaoPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  await requireAdminPage();
  const { aba } = await searchParams;
  const showArchive = aba === "arquivados";

  // Anything archived for more than 30 days is removed before listing.
  await purgeExpiredArchive();

  const now = wallClockNow();
  const startOfToday = startOfTodayWallClock(now);

  const [events, archivedEvents, uniforms, notices, archivedNotices] = await Promise.all([
    prisma.event.findMany({ where: { startsAt: { gte: startOfToday } }, orderBy: { startsAt: "asc" } }),
    prisma.event.findMany({
      where: { startsAt: { lt: startOfToday } },
      orderBy: { startsAt: "desc" },
      include: { _count: { select: { enrollments: { where: { status: "CONFIRMED" } } } } },
    }),
    prisma.uniform.findMany({ orderBy: { name: "asc" } }),
    prisma.notice.findMany({ where: { visibleUntil: { gte: now } }, orderBy: { createdAt: "desc" } }),
    prisma.notice.findMany({ where: { visibleUntil: { lt: now } }, orderBy: { visibleUntil: "desc" } }),
  ]);

  const archivedCount = archivedEvents.length + archivedNotices.length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Gestão</h1>

      <nav aria-label="Seções da gestão" className="flex flex-wrap gap-2">
        <Link href={"/dashboard/eventos/novo" as Route} aria-current={showArchive ? undefined : "page"} className={tabClass(!showArchive)}>
          Em andamento
        </Link>
        <Link
          href={"/dashboard/eventos/novo?aba=arquivados" as Route}
          aria-current={showArchive ? "page" : undefined}
          className={tabClass(showArchive)}
        >
          Arquivados
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
            filled: event._count.enrollments,
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
          <EventManagement events={events} uniforms={uniforms.map((u) => u.name)} />

          <section className="flex flex-col gap-6">
            <UniformManagement uniforms={uniforms} />
            <NoticeManagement notices={notices} />
          </section>
        </div>
      )}
    </div>
  );
}

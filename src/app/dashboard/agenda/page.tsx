import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { scheduleSlotsArgs, toScheduleView } from "@/lib/event-schedule-view";
import { CalendarBoard, type CalendarDayCell } from "@/components/dashboard/calendar-board";
import type { EventRecord } from "@/components/dashboard/event-management";
import { buildMonthGrid, toDateInputValue, currentYearMonth } from "@/lib/event-schedule";

function resolveMonth(monthParam?: string, yearParam?: string) {
  const nowUtc = currentYearMonth();
  const parsedYear = Number(yearParam);
  const parsedMonth = Number(monthParam);
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 1970 && parsedYear <= 2200 ? parsedYear : nowUtc.year;
  const month =
    Number.isInteger(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11 ? parsedMonth : nowUtc.month;
  return { year, month };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { month: monthParam, year: yearParam } = await searchParams;
  const { year, month } = resolveMonth(monthParam, yearParam);
  const session = await auth();
  const isVolunteer = session?.user?.role !== "ADMIN";

  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));

  const profile = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { helpMode: true, spouseName: true } })
    : null;

  const [rawEvents, uniforms] = await Promise.all([
    prisma.event.findMany({
      where: { startsAt: { gte: monthStart, lt: monthEnd } },
      orderBy: { startsAt: "asc" },
      include: {
        _count: { select: { enrollments: { where: { status: "CONFIRMED" } } } },
        slots: scheduleSlotsArgs,
        enrollments: { where: { userId: session?.user?.id ?? "", status: "CONFIRMED" }, select: { id: true, helpMode: true } },
      },
    }),
    prisma.uniform.findMany({ orderBy: { name: "asc" } }),
  ]);

  const events: EventRecord[] = rawEvents.map((event) => ({
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

  const weeks: CalendarDayCell[][] = buildMonthGrid(year, month).map((week) =>
    week.map((cell) => ({
      day: cell.day,
      iso: cell.muted ? null : toDateInputValue(cell.date),
      muted: cell.muted,
      weekend: cell.weekend,
    })),
  );

  const nowUtc = currentYearMonth();
  const isCurrentMonth = year === nowUtc.year && month === nowUtc.month;

  return (
    <CalendarBoard
      year={year}
      month={month}
      weeks={weeks}
      events={events}
      uniforms={uniforms.map((u) => u.name)}
      today={isCurrentMonth ? nowUtc.day : undefined}
      readOnly={isVolunteer}
      coupleOption={profile?.helpMode === "COUPLE"}
      defaultSpouseName={profile?.spouseName ?? ""}
    />
  );
}

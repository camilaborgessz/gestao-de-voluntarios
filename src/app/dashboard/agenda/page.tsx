import { prisma } from "@/lib/prisma";
import { seatsTaken } from "@/lib/seats";
import { auth } from "@/auth";
import { CalendarBoard, type CalendarDayCell } from "@/components/dashboard/calendar-board";
import type { EventRecord } from "@/components/dashboard/event-management";
import { buildMonthGrid, toDateInputValue, currentYearMonth, wallClockNow } from "@/lib/event-schedule";

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
        enrollments: {
          where: { status: "CONFIRMED" },
          select: { userId: true, helpMode: true, slot: { select: { label: true, location: true } } },
        },
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
    myEntry: (() => {
      if (!isVolunteer) return undefined;
      const slot = event.enrollments.find((e) => e.userId === session?.user?.id)?.slot;
      if (!slot) return null;
      return slot.location ? `${slot.label} — ${slot.location}` : slot.label;
    })(),
    filled: seatsTaken(event.enrollments),
    joined: event.enrollments.some((e) => e.userId === session?.user?.id),
    joinedMode: event.enrollments.find((e) => e.userId === session?.user?.id)?.helpMode,
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
      nowIso={wallClockNow().toISOString()}
      readOnly={isVolunteer}
      coupleOption={profile?.helpMode === "COUPLE"}
      defaultSpouseName={profile?.spouseName ?? ""}
    />
  );
}

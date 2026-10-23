import { prisma } from "@/lib/prisma";
import { startOfTodayWallClock } from "@/lib/archive";
import { wallClockNow } from "@/lib/event-schedule";
import { seatsTaken } from "@/lib/seats";

const DAY_MS = 86_400_000;

export interface LeaderStats {
  activeVolunteers: number;
  eventsThisMonth: number;
  /** Share of the spots of upcoming events that are already taken (0-100), or null when there are none. */
  fillPercent: number | null;
  unscheduledEvents: number;
}

export interface BirthdayPerson {
  id: string;
  name: string;
  /** 0 = today. */
  daysAway: number;
  date: Date;
  turning: number;
}

export interface QuietVolunteer {
  id: string;
  name: string;
  contact: string | null;
  /** Has a spot in an upcoming event, so is about to serve for the first time. */
  hasUpcoming: boolean;
}

export interface UnscheduledEvent {
  id: string;
  title: string;
  startsAt: Date;
  unplaced: number;
  total: number;
}

export interface WeekBar {
  label: string;
  done: number;
  planned: number;
}

export interface LeaderOverview {
  stats: LeaderStats;
  birthdays: BirthdayPerson[];
  quiet: QuietVolunteer[];
  unscheduled: UnscheduledEvent[];
  weeks: WeekBar[];
  monthName: string;
}

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Numbers and lists for the leader's dashboard. Dates use the wall-clock convention (see `wallClockNow`). */
export async function getLeaderOverview(): Promise<LeaderOverview> {
  const now = wallClockNow();
  const today = startOfTodayWallClock(now);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1));
  const nextMonthStart = new Date(Date.UTC(year, month + 1, 1));

  const [users, upcoming, monthEvents] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        birthDate: true,
        passwordHash: true,
        servicesDone: true,
        enrollments: { where: { status: "CONFIRMED" }, select: { event: { select: { startsAt: true } } } },
      },
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: today } },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        capacity: true,
        enrollments: { where: { status: "CONFIRMED" }, select: { helpMode: true, slotId: true } },
      },
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: monthStart, lt: nextMonthStart } },
      select: { startsAt: true, enrollments: { where: { status: "CONFIRMED" }, select: { id: true } } },
    }),
  ]);

  // ---- people: who never served yet, and birthdays in the next 7 days
  const quiet: QuietVolunteer[] = [];
  const birthdays: BirthdayPerson[] = [];
  for (const user of users) {
    const past = user.enrollments.filter((enrollment) => enrollment.event.startsAt < now).length;
    const hasUpcoming = user.enrollments.length > past;
    if (user.role === "VOLUNTEER" && user.passwordHash && user.servicesDone + past === 0) {
      quiet.push({ id: user.id, name: user.name, contact: user.phone ?? user.email, hasUpcoming });
    }

    if (user.birthDate) {
      const birthMonth = user.birthDate.getUTCMonth();
      const birthDay = user.birthDate.getUTCDate();
      let next = new Date(Date.UTC(year, birthMonth, birthDay));
      if (next < today) next = new Date(Date.UTC(year + 1, birthMonth, birthDay));
      const daysAway = Math.round((next.getTime() - today.getTime()) / DAY_MS);
      if (daysAway <= 6) {
        birthdays.push({
          id: user.id,
          name: user.name,
          daysAway,
          date: next,
          turning: next.getUTCFullYear() - user.birthDate.getUTCFullYear(),
        });
      }
    }
  }
  quiet.sort((a, b) => Number(b.hasUpcoming) - Number(a.hasUpcoming) || a.name.localeCompare(b.name, "pt-BR"));
  birthdays.sort((a, b) => a.daysAway - b.daysAway || a.name.localeCompare(b.name, "pt-BR"));

  // ---- events: spots taken and schedules (escalas) still to be built
  let capacity = 0;
  let taken = 0;
  const unscheduled: UnscheduledEvent[] = [];
  for (const event of upcoming) {
    capacity += event.capacity;
    taken += Math.min(seatsTaken(event.enrollments), event.capacity);
    const unplaced = event.enrollments.filter((enrollment) => !enrollment.slotId).length;
    if (unplaced > 0) {
      unscheduled.push({ id: event.id, title: event.title, startsAt: event.startsAt, unplaced, total: event.enrollments.length });
    }
  }

  // ---- volunteers per week of the current month (done = already happened, planned = still to come)
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weekCount = Math.ceil(lastDay / 7);
  const weeks: WeekBar[] = Array.from({ length: weekCount }, (_, index) => {
    const from = index * 7 + 1;
    const to = Math.min(from + 6, lastDay);
    return { label: `${from}–${to}`, done: 0, planned: 0 };
  });
  for (const event of monthEvents) {
    const week = Math.min(Math.floor((event.startsAt.getUTCDate() - 1) / 7), weekCount - 1);
    weeks[week][event.startsAt < now ? "done" : "planned"] += event.enrollments.length;
  }

  return {
    stats: {
      activeVolunteers: users.filter((user) => user.role === "VOLUNTEER" && user.passwordHash).length,
      eventsThisMonth: monthEvents.length,
      fillPercent: capacity > 0 ? Math.round((taken / capacity) * 100) : null,
      unscheduledEvents: unscheduled.length,
    },
    birthdays,
    quiet,
    unscheduled,
    weeks,
    monthName: MONTHS[month],
  };
}

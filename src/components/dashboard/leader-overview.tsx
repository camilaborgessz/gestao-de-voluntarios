import Link from "next/link";
import type { Route } from "next";
import { Cake, CalendarCheck, CalendarX, Users, UsersRound } from "lucide-react";
import { ExpandableList } from "./expandable-list";
import type { BirthdayPerson, LeaderOverview, LeaderStats, QuietVolunteer, UnscheduledEvent } from "@/lib/leader-overview";

const card = "rounded-[10px] bg-surface p-5 shadow-[0_4px_37px_rgba(0,0,0,0.1)]";
const row = "flex items-center gap-3 rounded-[10px] border border-brand/[0.17] px-4 py-2.5 dark:border-white/10";

const dayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
const eventFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/** The four headline numbers at the top of the leader's dashboard. */
export function StatsRow({ stats }: { stats: LeaderStats }) {
  const items = [
    { icon: Users, value: String(stats.activeVolunteers), label: "Voluntários ativos" },
    { icon: CalendarCheck, value: String(stats.eventsThisMonth), label: "Eventos neste mês" },
    { icon: UsersRound, value: stats.fillPercent === null ? "—" : `${stats.fillPercent}%`, label: "Vagas preenchidas nos próximos eventos" },
    { icon: CalendarX, value: String(stats.unscheduledEvents), label: "Escalas a montar" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ icon: Icon, value, label }) => (
        <div key={label} className={`${card} flex items-center gap-4`}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lime-from/60 text-brand dark:bg-white/10 dark:text-lime-from">
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-semibold leading-none text-ink lg:text-3xl">{value}</p>
            <p className="mt-1 text-xs leading-tight text-ink/70 lg:text-sm">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BirthdaysCard({ people }: { people: BirthdayPerson[] }) {
  return (
    <div className={`${card} flex flex-col gap-2`}>
      {people.length === 0 && <p className="text-sm text-ink/60">Nenhum aniversariante nos próximos 7 dias.</p>}
      {people.map((person) => (
        <div key={person.id} className={row}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lime-from/60 text-brand dark:bg-white/10 dark:text-lime-from">
            <Cake size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
            <p className="text-xs text-ink/70">faz {person.turning} anos</p>
          </div>
          <span className={`shrink-0 text-sm font-medium ${person.daysAway === 0 ? "font-bold text-brand dark:text-lime-from" : "text-ink/70"}`}>
            {person.daysAway === 0 ? "Hoje" : dayFormat.format(person.date)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function QuietVolunteersCard({ people }: { people: QuietVolunteer[] }) {
  return (
    <div className={card}>
      <ExpandableList
        id="dashboard-quiet"
        initialCount={5}
        empty="Todos os voluntários já serviram."
        items={people.map((person) => (
          <li key={person.id} className={row}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
              {person.contact && <p className="truncate text-xs text-ink/70">{person.contact}</p>}
            </div>
            {person.hasUpcoming && (
              <span className="shrink-0 rounded-full bg-lime-from/50 px-2 py-0.5 text-xs font-semibold text-brand dark:bg-white/10 dark:text-lime-from">
                Inscrito
              </span>
            )}
          </li>
        ))}
      />
    </div>
  );
}

export function UnscheduledCard({ events }: { events: UnscheduledEvent[] }) {
  return (
    <div className={card}>
      <ExpandableList
        id="dashboard-unscheduled"
        initialCount={3}
        empty="Todas as escalas estão montadas."
        items={events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/dashboard/escala/${event.id}` as Route}
              className={`${row} transition-colors duration-150 hover:bg-brand/5 dark:hover:bg-white/5`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{event.title}</p>
                <p className="text-xs capitalize text-ink/70">{eventFormat.format(event.startsAt)}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-ink/70">
                {event.unplaced} de {event.total} sem entrada
              </span>
            </Link>
          </li>
        ))}
      />
    </div>
  );
}

/** Volunteers per week of the current month: solid bars already happened, light bars are still to come. */
export function MonthFrequencyCard({ overview }: { overview: LeaderOverview }) {
  const { weeks, monthName } = overview;
  const max = Math.max(1, ...weeks.map((week) => week.done + week.planned));
  const total = weeks.reduce((sum, week) => sum + week.done + week.planned, 0);

  return (
    <div className={`${card} flex flex-col gap-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink/70">
          Voluntários escalados por semana em <span className="font-semibold text-ink">{monthName}</span>
        </p>
        <div className="flex items-center gap-4 text-xs text-ink/70">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-brand dark:bg-lime-from" /> Realizados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-brand/30 dark:bg-lime-from/35" /> Previstos
          </span>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-ink/60">Nenhum voluntário escalado neste mês.</p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`Voluntários por semana: ${weeks.map((w) => `dias ${w.label}, ${w.done + w.planned}`).join("; ")}`}
            className="flex h-44 items-end gap-3 border-b border-ink/15 sm:gap-6"
          >
            {weeks.map((week) => {
              const sum = week.done + week.planned;
              return (
                <div
                  key={week.label}
                  title={`Dias ${week.label}: ${week.done} realizados, ${week.planned} previstos`}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="text-sm font-semibold text-ink">{sum}</span>
                  <div className="flex w-full max-w-14 flex-col justify-end gap-0.5" style={{ height: `${(sum / max) * 80}%` }}>
                    {week.planned > 0 && (
                      <div className="rounded-t-[4px] bg-brand/30 dark:bg-lime-from/35" style={{ flexGrow: week.planned }} />
                    )}
                    {week.done > 0 && (
                      <div
                        className={`bg-brand dark:bg-lime-from ${week.planned === 0 ? "rounded-t-[4px]" : ""}`}
                        style={{ flexGrow: week.done }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 sm:gap-6">
            {weeks.map((week) => (
              <span key={week.label} className="min-w-0 flex-1 text-center text-xs text-ink/70">
                dias {week.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

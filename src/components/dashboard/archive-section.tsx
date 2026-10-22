import { formatShortDate } from "@/lib/event-schedule";
import { ArchivedEventList, type ArchivedEvent } from "./archived-event-list";

export interface ArchivedNotice {
  id: string;
  message: string;
  visibleUntil: Date;
  daysLeft: number;
}

function ExpiryPill({ days }: { days: number }) {
  const soon = days <= 3;
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        soon ? "bg-warning-from/30 text-ink" : "bg-brand/10 text-brand dark:bg-white/10 dark:text-lime-from"
      }`}
    >
      {days <= 1 ? "Some em breve" : `Some em ${days} dias`}
    </span>
  );
}

function SectionCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xl font-medium text-ink lg:text-2xl">{title}</h2>
        <span className="flex size-6 items-center justify-center rounded-full bg-lime-from/70 text-xs font-medium text-brand lg:size-7 lg:text-sm">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-3 rounded-[10px] bg-surface p-5 shadow-[0_4px_37px_rgba(0,0,0,0.1)]">
        {children}
      </div>
    </section>
  );
}

const rowClass =
  "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-brand/[0.17] bg-surface px-4 py-3 dark:border-white/10 dark:bg-surface-raised";

/** Read-only archive of past events and notices, shown in the "Arquivados" tab of the admin management page. */
export type { ArchivedEvent };

export function ArchiveSection({ events, notices }: { events: ArchivedEvent[]; notices: ArchivedNotice[] }) {
  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Eventos" count={events.length}>
        {events.length === 0 && <p className="text-sm text-ink/60">Nenhum evento arquivado</p>}
        <ArchivedEventList events={events} />
      </SectionCard>

      <SectionCard title="Avisos" count={notices.length}>
        {notices.length === 0 && <p className="text-sm text-ink/60">Nenhum aviso arquivado</p>}
        {notices.map((notice) => (
          <div key={notice.id} className={rowClass}>
            <div className="w-20 shrink-0 text-center">
              <p className="text-xs text-ink/60">até</p>
              <p className="font-display text-lg font-bold leading-tight text-ink">{formatShortDate(notice.visibleUntil)}</p>
            </div>
            <div className="hidden h-10 w-0.5 shrink-0 rounded-full bg-brand/60 sm:block dark:bg-white/15" />
            <p className="line-clamp-2 min-w-0 flex-1 basis-36 text-sm text-ink">{notice.message}</p>
            <ExpiryPill days={notice.daysLeft} />
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

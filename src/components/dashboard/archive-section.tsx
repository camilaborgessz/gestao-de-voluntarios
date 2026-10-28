import { ArchivedEventList, type ArchivedEvent } from "./archived-event-list";
import { ArchivedNoticeList, type ArchivedNotice } from "./archived-notice-list";

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

/** Archive of past events and notices, shown in the "Arquivados" tab of the admin management page. */
export type { ArchivedEvent, ArchivedNotice };

export function ArchiveSection({ events, notices }: { events: ArchivedEvent[]; notices: ArchivedNotice[] }) {
  return (
    <div className="flex flex-col gap-8">
      <SectionCard title="Eventos" count={events.length}>
        {events.length === 0 && <p className="text-sm text-ink/60">Nenhum evento arquivado</p>}
        <ArchivedEventList events={events} />
      </SectionCard>

      <SectionCard title="Avisos" count={notices.length}>
        {notices.length === 0 && <p className="text-sm text-ink/60">Nenhum aviso arquivado</p>}
        <ArchivedNoticeList notices={notices} />
      </SectionCard>
    </div>
  );
}

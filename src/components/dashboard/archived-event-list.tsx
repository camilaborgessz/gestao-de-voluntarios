"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { formatEventSchedule } from "@/lib/event-schedule";
import { EventViewDialog } from "./event-view-dialog";
import type { EventRecord } from "./event-management";

export interface ArchivedEvent extends EventRecord {
  /** Days until the archived event is deleted. */
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

const rowClass =
  "flex items-center gap-4 rounded-[10px] border border-brand/[0.17] bg-surface px-4 py-3 dark:border-white/10 dark:bg-surface-raised";

/** Archived events: a short row each, with a read-only details dialog (no editing, no schedule). */
export function ArchivedEventList({ events }: { events: ArchivedEvent[] }) {
  const [selected, setSelected] = useState<ArchivedEvent | null>(null);

  return (
    <>
      {events.map((event) => {
        const { date, weekday, time } = formatEventSchedule(event.startsAt);
        return (
          <div key={event.id} className={rowClass}>
            <div className="w-20 shrink-0 text-center">
              <p className="font-display text-2xl font-bold leading-none text-ink">{date}</p>
              <p className="mt-1 text-xs text-ink/60">
                {weekday} · {time}
              </p>
            </div>
            <div className="h-10 w-0.5 shrink-0 rounded-full bg-brand/60 dark:bg-white/15" />
            <p className="min-w-0 flex-1 truncate text-base font-medium text-ink">{event.title}</p>
            <ExpiryPill days={event.daysLeft} />
            <button
              type="button"
              onClick={() => setSelected(event)}
              title="Ver detalhes"
              aria-label={`Ver detalhes de ${event.title}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition duration-150 ease-out hover:scale-110 active:scale-95"
            >
              <Eye size={18} strokeWidth={2.5} />
            </button>
          </div>
        );
      })}

      {selected && <EventViewDialog event={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

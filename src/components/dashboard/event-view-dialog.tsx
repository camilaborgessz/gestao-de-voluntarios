"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { X, Pencil, Trash2, ClipboardList, Download, Loader2 } from "lucide-react";
import type { EventRecord } from "./event-management";
import { Modal } from "./modal";
import { formatEventSchedule } from "@/lib/event-schedule";
import { DEFAULT_SCHEDULE_TITLE } from "@/lib/schedule-defaults";
import { describeEventDate, renderScheduleImage } from "@/lib/schedule-image";

/** The schedule as the same picture the leader shares, with a plain list as a fallback. */
function ScheduleSection({ event }: { event: EventRecord }) {
  const schedule = event.schedule ?? [];
  const [image, setImage] = useState<{ url: string; failed: boolean } | null>(null);

  useEffect(() => {
    if (schedule.length === 0) return;
    let cancelled = false;
    let createdUrl: string | null = null;
    const { weekdayLong, dateFull, time } = describeEventDate(event.startsAt);

    renderScheduleImage({
      heading: event.scheduleTitle?.trim() || DEFAULT_SCHEDULE_TITLE,
      weekdayLong,
      dateFull,
      time,
      title: event.title,
      uniform: event.dressCode,
      note: event.note?.trim() ?? "",
      rows: schedule.map((entry) => ({ label: entry.label, location: entry.location, people: entry.people })),
    })
      .then((blob) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setImage({ url: createdUrl, failed: false });
      })
      .catch(() => {
        if (!cancelled) setImage({ url: "", failed: true });
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
    // The dialog is remounted for each event, so the event never changes while it is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (schedule.length === 0) return <p className="text-ink/60">A escala ainda não foi montada.</p>;

  if (image && !image.failed) {
    return (
      <div className="flex flex-col gap-2">
        <a href={image.url} target="_blank" rel="noopener noreferrer" title="Abrir em tamanho real">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={`Escala de ${event.title}`} className="w-full rounded-[10px] border border-ink/15" />
        </a>
        <a
          href={image.url}
          download={`escala-${describeEventDate(event.startsAt).dateFull.replaceAll("/", "-")}.png`}
          className="flex items-center justify-center gap-2 self-start text-sm font-semibold text-brand hover:underline dark:text-lime-from"
        >
          <Download size={16} />
          Baixar imagem
        </a>
      </div>
    );
  }

  if (!image) {
    return (
      <p className="flex items-center gap-2 text-ink/60">
        <Loader2 size={16} className="animate-spin" />
        Carregando escala…
      </p>
    );
  }

  // Fallback if the picture could not be drawn.
  return (
    <div className="flex flex-col gap-3">
      {schedule.map((entry, index) => (
        <div key={index} className="rounded-[10px] border border-brand/20 p-3 dark:border-white/15">
          <p className="font-semibold text-ink">{entry.label}</p>
          {entry.location && <p className="text-xs text-ink/60">{entry.location}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.people.map((person, personIndex) => (
              <span
                key={personIndex}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  person.couple
                    ? "bg-gradient-to-r from-lime-from to-lime-to text-brand-dark"
                    : "bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from/20 dark:text-lime-from text-white"
                }`}
              >
                {person.text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventViewDialog({
  event,
  onClose,
  onEdit,
  onDelete,
  footer,
  scheduleHref,
}: {
  event: EventRecord;
  onClose: () => void;
  /** Omit (together with `onDelete`) for the read-only volunteer view. */
  onEdit?: () => void;
  onDelete?: () => void;
  /** Extra footer content, e.g. the participate button. */
  footer?: ReactNode;
  /** Admin: link to the schedule (escala) page of this event. */
  scheduleHref?: string;
}) {
  const { date, weekday, time } = formatEventSchedule(event.startsAt);

  return (
    <Modal
      onClose={onClose}
      labelledBy="event-view-title"
      className={`max-h-[90vh] w-full overflow-y-auto rounded-[15px] bg-surface p-6 shadow-xl ${
        event.schedule && event.schedule.length > 0 ? "max-w-2xl" : "max-w-md"
      }`}
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 id="event-view-title" className="text-xl font-semibold text-ink">
            Detalhes do evento
          </h2>
          <button onClick={onClose} title="Fechar" className="text-ink/60 transition-colors hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="font-medium text-ink/60">Título</dt>
            <dd className="text-ink">{event.title}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="font-medium text-ink/60">Data</dt>
              <dd className="text-ink">
                {weekday} - {date}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink/60">Horário</dt>
              <dd className="text-ink">{time}</dd>
            </div>
          </div>
          <div>
            <dt className="font-medium text-ink/60">Vagas</dt>
            <dd className="text-ink">
              {event.filled !== undefined ? `${event.filled}/${event.capacity} preenchidas` : event.capacity}
            </dd>
          </div>
          {event.note && !(event.schedule && event.schedule.length > 0) && (
            <div>
              <dt className="font-medium text-ink/60">Aviso</dt>
              <dd className="whitespace-pre-line text-ink">{event.note}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-ink/60">Traje</dt>
            <dd className="text-ink">
              {event.dressCode.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {event.dressCode.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from/20 dark:text-lime-from px-3 py-1 text-xs font-semibold text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </dd>
          </div>
          {event.schedule && (
            <div>
              <dt className="font-medium text-ink/60">Escala</dt>
              <dd className="mt-1">
                <ScheduleSection event={event} />
              </dd>
            </div>
          )}
        </dl>

        {scheduleHref && (
          <Link
            href={scheduleHref as Route}
            className="mt-6 flex items-center justify-center gap-2 rounded-full border border-brand py-2.5 text-sm font-bold text-brand transition duration-150 ease-out hover:scale-[1.02] hover:bg-brand/10 active:scale-95 dark:text-lime-from"
          >
            <ClipboardList size={16} />
            Gerenciar escala
          </Link>
        )}

        <div className="mt-3 flex gap-3">
          {footer}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-danger-from py-2.5 text-sm font-bold text-danger-text transition duration-150 ease-out hover:scale-[1.02] hover:bg-danger-from/10 active:scale-95"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from dark:text-brand py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-[1.02] active:scale-95"
            >
              <Pencil size={16} />
              Editar
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { X, Pencil, Trash2, ClipboardList } from "lucide-react";
import type { EventRecord } from "./event-management";
import { Modal } from "./modal";
import { LinkIcon } from "./link-pending";
import { formatEventSchedule } from "@/lib/event-schedule";

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
      className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[15px] bg-surface p-6 shadow-xl"
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
            <dt className="font-medium text-ink/60">Voluntários</dt>
            <dd className="text-ink">
              {event.filled !== undefined ? `${event.filled} de ${event.capacity} (meta)` : event.capacity}
            </dd>
          </div>
          {event.note && (
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
          {event.joined && (
            <div className="rounded-[10px] bg-lime-from/40 px-3 py-2.5 dark:bg-white/10">
              <dt className="font-medium text-ink/60">Sua entrada</dt>
              <dd className="font-semibold text-ink">{event.myEntry ?? "Ainda não definida"}</dd>
            </div>
          )}
        </dl>

        {scheduleHref && (
          <Link
            href={scheduleHref as Route}
            className="mt-6 flex items-center justify-center gap-2 rounded-full border border-brand py-2.5 text-sm font-bold text-brand transition duration-150 ease-out hover:scale-[1.02] hover:bg-brand/10 active:scale-95 dark:text-lime-from"
          >
            <LinkIcon icon={ClipboardList} size={16} />
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

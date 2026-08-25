"use client";

import { X, Pencil } from "lucide-react";
import type { EventRecord } from "./event-management";
import { formatEventSchedule } from "@/lib/event-schedule";

export function EventViewDialog({
  event,
  onClose,
  onEdit,
}: {
  event: EventRecord;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { date, weekday, time } = formatEventSchedule(event.startsAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[15px] bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Detalhes do evento</h2>
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
            <dd className="text-ink">{event.capacity}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink/60">Traje</dt>
            <dd className="text-ink">
              {event.dressCode.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {event.dressCode.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-3 py-1 text-xs font-semibold text-white"
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
        </dl>

        <button
          onClick={onEdit}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-[1.02] active:scale-95"
        >
          <Pencil size={16} />
          Editar
        </button>
      </div>
    </div>
  );
}

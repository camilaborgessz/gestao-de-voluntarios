"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { EventManageRow } from "./event-manage-row";
import { EventFormDialog } from "./event-form-dialog";
import { EventViewDialog } from "./event-view-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { formatEventSchedule } from "@/lib/event-schedule";
import { deleteEvent } from "@/app/dashboard/eventos/novo/actions";

export interface EventRecord {
  id: string;
  title: string;
  startsAt: Date;
  capacity: number;
  dressCode: string[];
  filled?: number;
}

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; event: EventRecord }
  | { mode: "view"; event: EventRecord }
  | { mode: "delete"; event: EventRecord };

export function EventManagement({ events, uniforms }: { events: EventRecord[]; uniforms: string[] }) {
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [isDeleting, startDeleteTransition] = useTransition();

  function confirmDelete() {
    if (dialog.mode !== "delete") return;
    const { event } = dialog;
    startDeleteTransition(async () => {
      await deleteEvent(event.id);
      setDialog({ mode: "closed" });
    });
  }

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-medium text-ink lg:text-2xl">Eventos</h2>
        <span className="flex size-6 items-center justify-center rounded-full bg-lime-from/70 text-xs font-medium text-brand lg:size-7 lg:text-sm">
          {events.length}
        </span>
        <button
          title="Novo evento"
          onClick={() => setDialog({ mode: "create" })}
          className="flex size-6 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-[10px] bg-surface p-5 shadow-[0_4px_37px_rgba(0,0,0,0.1)]">
        {events.length === 0 && <p className="text-sm text-ink/60">Nenhum evento cadastrado ainda.</p>}

        {events.map((event) => (
          <EventManageRow
            key={event.id}
            {...formatEventSchedule(event.startsAt)}
            title={event.title}
            tags={event.dressCode}
            onView={() => setDialog({ mode: "view", event })}
            onEdit={() => setDialog({ mode: "edit", event })}
            onDelete={() => setDialog({ mode: "delete", event })}
          />
        ))}

        {events.length > 0 && (
          <button className="self-end text-xs font-medium text-ink transition-colors duration-150 hover:text-brand hover:underline">
            Ver mais
          </button>
        )}
      </div>

      {(dialog.mode === "create" || dialog.mode === "edit") && (
        <EventFormDialog
          event={dialog.mode === "edit" ? dialog.event : null}
          uniforms={uniforms}
          onClose={() => setDialog({ mode: "closed" })}
        />
      )}

      {dialog.mode === "view" && (
        <EventViewDialog
          event={dialog.event}
          onClose={() => setDialog({ mode: "closed" })}
          onEdit={() => setDialog({ mode: "edit", event: dialog.event })}
        />
      )}

      {dialog.mode === "delete" && (
        <ConfirmDialog
          message={`Tem certeza que deseja excluir "${dialog.event.title}"?`}
          isLoading={isDeleting}
          onCancel={() => setDialog({ mode: "closed" })}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  );
}

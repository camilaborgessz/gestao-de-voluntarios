"use client";

import { useState, useTransition } from "react";
import { EventCard } from "./event-card";
import { EventFormDialog } from "./event-form-dialog";
import { EventViewDialog } from "./event-view-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { formatEventSchedule } from "@/lib/event-schedule";
import { deleteEvent } from "@/app/dashboard/eventos/novo/actions";
import type { EventRecord } from "./event-management";

type DialogState =
  | { mode: "closed" }
  | { mode: "edit"; event: EventRecord }
  | { mode: "view"; event: EventRecord }
  | { mode: "delete"; event: EventRecord };

export function UpcomingEventsList({ events, uniforms }: { events: EventRecord[]; uniforms: string[] }) {
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
    <>
      {events.map((event) => (
        <EventCard
          key={event.id}
          {...formatEventSchedule(event.startsAt)}
          title={event.title}
          tags={event.dressCode}
          filled={event.filled ?? 0}
          capacity={event.capacity}
          isAdmin
          onView={() => setDialog({ mode: "view", event })}
          onEdit={() => setDialog({ mode: "edit", event })}
          onDelete={() => setDialog({ mode: "delete", event })}
        />
      ))}

      {dialog.mode === "edit" && (
        <EventFormDialog event={dialog.event} uniforms={uniforms} onClose={() => setDialog({ mode: "closed" })} />
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
    </>
  );
}

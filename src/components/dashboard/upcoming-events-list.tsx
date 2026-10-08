"use client";

import { useOptimistic, useState, useTransition } from "react";
import { EventCard } from "./event-card";
import { EventFormDialog } from "./event-form-dialog";
import { EventViewDialog } from "./event-view-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { ParticipateButton } from "./participate-button";
import { ShowMoreToggle } from "./show-more-toggle";
import { formatEventSchedule } from "@/lib/event-schedule";
import { applyParticipation } from "@/lib/optimistic-participation";
import { deleteEvent } from "@/app/dashboard/eventos/novo/actions";
import type { EventRecord } from "./event-management";

type Filter = "all" | "joined" | "available";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "joined", label: "Participando" },
  { value: "available", label: "Disponíveis" },
];

/** Not joined yet and still has room. */
const isAvailable = (event: EventRecord) => !event.joined && (event.filled ?? 0) < event.capacity;

const EMPTY_MESSAGE: Record<Filter, string> = {
  all: "Nenhum evento programado por enquanto.",
  joined: "Você ainda não está participando de nenhum evento.",
  available: "Nenhum evento com vagas no momento.",
};

type DialogState =
  | { mode: "closed" }
  | { mode: "edit"; event: EventRecord }
  | { mode: "view"; event: EventRecord }
  | { mode: "delete"; event: EventRecord };

export function UpcomingEventsList({
  events: serverEvents,
  uniforms,
  initialCount = 3,
  readOnly = false,
  coupleOption = false,
  defaultSpouseName = "",
}: {
  events: EventRecord[];
  uniforms: string[];
  initialCount?: number;
  /** Volunteer mode: no edit/delete, only view + participate. */
  readOnly?: boolean;
  /** Volunteer serves as a couple: offer "alone / with spouse" when joining. */
  coupleOption?: boolean;
  defaultSpouseName?: string;
}) {
  // Joining / leaving shows up instantly; the server data replaces it as soon as it arrives.
  const [events, applyOptimistic] = useOptimistic(serverEvents, applyParticipation);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [isDeleting, startDeleteTransition] = useTransition();

  function openDialog(next: DialogState) {
    setDeleteError(null);
    setDialog(next);
  }

  function confirmDelete() {
    if (dialog.mode !== "delete") return;
    const { event } = dialog;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteEvent(event.id);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDialog({ mode: "closed" });
    });
  }

  const counts: Record<Filter, number> = {
    all: events.length,
    joined: events.filter((event) => event.joined).length,
    available: events.filter(isAvailable).length,
  };
  const filteredEvents =
    !readOnly || filter === "all"
      ? events
      : events.filter((event) => (filter === "joined" ? !!event.joined : isAvailable(event)));

  const viewing = dialog.mode === "view" ? (events.find((e) => e.id === dialog.event.id) ?? dialog.event) : null;

  const visibleEvents = expanded ? filteredEvents : filteredEvents.slice(0, initialCount);
  const hiddenCount = filteredEvents.length - visibleEvents.length;

  return (
    <>
      {readOnly && (
        <div role="tablist" aria-label="Filtrar eventos" className="flex flex-wrap gap-2">
          {FILTERS.map(({ value, label }) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(value)}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition duration-150 ease-out active:scale-95 ${
                  active
                    ? "border-brand bg-gradient-to-r from-brand to-brand-dark text-white shadow-sm dark:border-lime-from dark:bg-none dark:bg-lime-from dark:text-brand"
                    : "border-brand/40 text-brand hover:bg-brand/10 dark:border-lime-from/40 dark:text-lime-from dark:hover:bg-white/10"
                }`}
              >
                {label}
                <span
                  className={`flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                    active ? "bg-lime-from text-brand dark:bg-brand dark:text-lime-from" : "bg-brand/10 dark:bg-white/10"
                  }`}
                >
                  {counts[value]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filteredEvents.length === 0 && <p className="text-sm text-ink/60">{EMPTY_MESSAGE[filter]}</p>}

      <div id="upcoming-events" className="flex flex-col gap-4">
        {visibleEvents.map((event) => (
          <EventCard
            key={event.id}
            {...formatEventSchedule(event.startsAt)}
            title={event.title}
            tags={event.dressCode}
            filled={event.filled ?? 0}
            capacity={event.capacity}
            isAdmin={!readOnly}
            participation={
              readOnly ? (
                <ParticipateButton
                  onOptimistic={(joined, mode) => applyOptimistic({ id: event.id, joined, mode })}
                  eventId={event.id}
                  joined={event.joined ?? false}
                  joinedMode={event.joinedMode}
                  full={(event.filled ?? 0) >= event.capacity}
                  coupleOption={coupleOption}
                defaultSpouseName={defaultSpouseName}
                />
              ) : undefined
            }
            onView={() => openDialog({ mode: "view", event })}
          />
        ))}
      </div>

      {filteredEvents.length > initialCount && (
        <ShowMoreToggle
          expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          moreLabel={`Ver mais (${hiddenCount})`}
          controls="upcoming-events"
        />
      )}

      {dialog.mode === "edit" && (
        <EventFormDialog event={dialog.event} uniforms={uniforms} onClose={() => openDialog({ mode: "closed" })} />
      )}

      {viewing && (
        <EventViewDialog
          event={viewing}
          onClose={() => openDialog({ mode: "closed" })}
          onEdit={readOnly ? undefined : () => openDialog({ mode: "edit", event: viewing })}
          onDelete={readOnly ? undefined : () => openDialog({ mode: "delete", event: viewing })}
          scheduleHref={readOnly ? undefined : `/dashboard/escala/${viewing.id}`}
          footer={
            readOnly ? (
              <ParticipateButton
                onOptimistic={(joined, mode) => applyOptimistic({ id: viewing.id, joined, mode })}
                eventId={viewing.id}
                joined={viewing.joined ?? false}
                joinedMode={viewing.joinedMode}
                full={(viewing.filled ?? 0) >= viewing.capacity}
                coupleOption={coupleOption}
                defaultSpouseName={defaultSpouseName}
              />
            ) : undefined
          }
        />
      )}

      {dialog.mode === "delete" && (
        <ConfirmDialog
          title="Excluir evento?"
          description={`"${dialog.event.title}" será removido permanentemente, junto com as inscrições e a escala.`}
          isLoading={isDeleting}
          error={deleteError}
          onCancel={() => openDialog({ mode: "closed" })}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}

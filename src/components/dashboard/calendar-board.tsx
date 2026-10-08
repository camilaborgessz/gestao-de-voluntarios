"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import type { EventRecord } from "./event-management";
import { EventFormDialog } from "./event-form-dialog";
import { EventViewDialog } from "./event-view-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { ParticipateButton } from "./participate-button";
import { deleteEvent } from "@/app/dashboard/eventos/novo/actions";
import { toDateInputValue, MONTH_NAMES, WEEKDAYS_SHORT } from "@/lib/event-schedule";
import { applyParticipation } from "@/lib/optimistic-participation";

export interface CalendarDayCell {
  day: number;
  /** `YYYY-MM-DD` for days inside the shown month, `null` for adjacent-month fillers. */
  iso: string | null;
  muted?: boolean;
  weekend?: boolean;
}

type Status = "danger" | "warning" | "success";

const statusDot: Record<Status, string> = {
  danger: "from-danger-from to-danger-to",
  warning: "from-warning-from to-warning-to",
  success: "from-success-from to-success-to",
};

function getStatus(filled: number, capacity: number): Status {
  const ratio = capacity > 0 ? filled / capacity : 0;
  if (ratio >= 1) return "success";
  if (ratio >= 0.5) return "warning";
  return "danger";
}

const MAX_VISIBLE_EVENTS = 3;

const statusLegend: { status: Status; label: string }[] = [
  { status: "danger", label: "Faltam voluntários" },
  { status: "warning", label: "Quase completo" },
  { status: "success", label: "Completo" },
];

const gridLine = "border-[#a0d0c8] dark:border-white/10";

type DialogState =
  | { mode: "closed" }
  | { mode: "create"; date?: string }
  | { mode: "edit"; event: EventRecord }
  | { mode: "view"; event: EventRecord }
  | { mode: "delete"; event: EventRecord };

export function CalendarBoard({
  year,
  month,
  weeks,
  events: serverEvents,
  uniforms,
  today,
  readOnly = false,
  coupleOption = false,
  defaultSpouseName = "",
}: {
  year: number;
  month: number;
  weeks: CalendarDayCell[][];
  events: EventRecord[];
  uniforms: string[];
  today?: number;
  /** Volunteer mode: events can only be viewed/joined, never created, edited or deleted. */
  readOnly?: boolean;
  coupleOption?: boolean;
  defaultSpouseName?: string;
}) {
  const router = useRouter();
  // Joining / leaving shows up instantly; the server data replaces it as soon as it arrives.
  const [events, applyOptimistic] = useOptimistic(serverEvents, applyParticipation);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<ReadonlySet<string>>(() => new Set());
  const [isDeleting, startDelete] = useTransition();
  const [isNavigating, startNavigate] = useTransition();
  const [navDir, setNavDir] = useState<"prev" | "next" | null>(null);

  function toggleDayExpanded(iso: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

  const eventsByIso = useMemo(() => {
    const map = new Map<string, EventRecord[]>();
    for (const event of events) {
      const key = toDateInputValue(event.startsAt);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const viewing = dialog.mode === "view" ? (events.find((e) => e.id === dialog.event.id) ?? dialog.event) : null;

  function openDialog(next: DialogState) {
    setDeleteError(null);
    setDialog(next);
  }

  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  function goToMonth(target: { year: number; month: number }, dir: "prev" | "next") {
    setNavDir(dir);
    startNavigate(() => {
      router.push(`/dashboard/agenda?year=${target.year}&month=${target.month}`);
    });
  }

  function confirmDelete() {
    if (dialog.mode !== "delete") return;
    const { event } = dialog;
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteEvent(event.id);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDialog({ mode: "closed" });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Calendário e escalas</h1>
        {!readOnly && (
          <button
            onClick={() => openDialog({ mode: "create" })}
            className="flex items-center gap-2 rounded-full border border-ink bg-brand px-5 py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:bg-brand-dark active:scale-95"
          >
            <Plus size={18} />
            Novo evento
          </button>
        )}
      </div>

      <div className="rounded-[10px] bg-surface p-6 shadow-[0_4px_30px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-semibold text-ink">
            {MONTH_NAMES[month]} de {year}
          </h2>
          <button
            type="button"
            onClick={() => goToMonth(prev, "prev")}
            disabled={isNavigating}
            aria-label="Mês anterior"
            title="Mês anterior"
            className="rounded-full p-0.5 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90 disabled:cursor-wait disabled:hover:scale-100"
          >
            {isNavigating && navDir === "prev" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
          <button
            type="button"
            onClick={() => goToMonth(next, "next")}
            disabled={isNavigating}
            aria-label="Próximo mês"
            title="Próximo mês"
            className="rounded-full p-0.5 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90 disabled:cursor-wait disabled:hover:scale-100"
          >
            {isNavigating && navDir === "next" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
          <span
            title={`${events.length} evento(s) neste mês`}
            className="flex size-6 items-center justify-center rounded-full bg-lime-from/70 text-xs font-medium text-brand"
          >
            {events.length}
          </span>
          {isNavigating && (
            <span role="status" className="text-xs font-medium text-ink/50">
              Carregando…
            </span>
          )}
        </div>

        <div className="mb-2 grid grid-cols-7">
          {WEEKDAYS_SHORT.map((label, index) => (
            <div
              key={label}
              className={`px-2 text-center text-xs font-semibold uppercase tracking-wide ${
                index === 0 || index === 6 ? "text-brand/55 dark:text-lime-from/60" : "text-ink/45"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className={`relative overflow-hidden rounded-[10px] border-[0.5px] ${gridLine}`}>
          <div
            className={`grid grid-cols-7 transition-opacity duration-200 ${
              isNavigating ? "pointer-events-none opacity-40" : ""
            }`}
          >
            {weeks.map((week, weekIndex) =>
              week.map((cell, dayIndex) => {
                const isToday = !cell.muted && cell.day === today;
                const dayEvents = cell.iso ? eventsByIso.get(cell.iso) ?? [] : [];
                const expanded = cell.iso ? expandedDays.has(cell.iso) : false;
                const visibleEvents = expanded ? dayEvents : dayEvents.slice(0, MAX_VISIBLE_EVENTS);
                const hiddenCount = dayEvents.length - visibleEvents.length;
                const canCreate = !readOnly && cell.iso !== null;

                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    onClick={
                      canCreate && cell.iso
                        ? () => openDialog({ mode: "create", date: cell.iso! })
                        : undefined
                    }
                    className={`group relative min-h-[190px] p-2 ${
                      dayIndex !== 6 ? `border-r-[0.5px] ${gridLine}` : ""
                    } ${weekIndex !== weeks.length - 1 ? `border-b-[0.5px] ${gridLine}` : ""} ${
                      cell.weekend ? "bg-[#e5f0ef] dark:bg-[#1e3934]" : "bg-surface"
                    } ${cell.muted ? "opacity-40" : canCreate ? "cursor-pointer" : ""}`}
                  >
                    <span
                      aria-current={isToday ? "date" : undefined}
                      className={`absolute top-2 right-2 z-10 flex size-[26px] items-center justify-center rounded-full text-sm ${
                        isToday ? "bg-lime-from font-bold text-brand" : "font-medium text-ink/60"
                      }`}
                    >
                      {cell.day}
                    </span>

                    {canCreate && cell.iso && (
                      <button
                        type="button"
                        aria-label={`Criar evento no dia ${cell.day}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDialog({ mode: "create", date: cell.iso! });
                        }}
                        className="absolute left-2 top-2 z-10 flex size-[26px] items-center justify-center rounded-md text-ink/55 opacity-0 transition duration-150 ease-out hover:bg-ink/15 hover:text-ink/90 focus-visible:opacity-100 group-hover:opacity-80 dark:text-white/45 dark:hover:bg-white/15 dark:hover:text-white/90"
                      >
                        <Plus size={15} strokeWidth={2} />
                      </button>
                    )}

                    <div className="mt-8 flex flex-col gap-1.5">
                      {visibleEvents.map((event) => {
                        const filled = event.filled ?? 0;
                        const status = getStatus(filled, event.capacity);
                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDialog({ mode: "view", event });
                            }}
                            title={`Ver "${event.title}"`}
                            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from/20 dark:text-lime-from py-2 pl-2.5 pr-3 text-left shadow-sm transition duration-150 ease-out hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(2,87,92,0.35)] active:scale-95"
                          >
                            <span className={`size-2 shrink-0 rounded-full bg-gradient-to-b ${statusDot[status]}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-bold leading-tight text-white">{event.title}</p>
                              <p className="truncate text-[12px] font-semibold leading-tight text-white/95">
                                {filled}/{event.capacity} voluntários
                              </p>
                            </div>
                          </button>
                        );
                      })}

                      {(hiddenCount > 0 || expanded) && cell.iso && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDayExpanded(cell.iso!);
                          }}
                          className="self-start rounded-full px-2 py-0.5 text-[12px] font-semibold text-brand transition-colors hover:bg-brand/10 dark:text-lime-from"
                        >
                          {hiddenCount > 0 ? `+${hiddenCount} mais` : "mostrar menos"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }),
            )}
          </div>

          {isNavigating && (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-16">
              <Loader2 className="size-7 animate-spin text-brand" />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/55">
          {statusLegend.map(({ status, label }) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full bg-gradient-to-b ${statusDot[status]}`} />
              {label}
            </span>
          ))}
          {events.length === 0 && (
            <span className="text-ink/45">Nenhum evento em {MONTH_NAMES[month]}.</span>
          )}
        </div>
      </div>

      {(dialog.mode === "create" || dialog.mode === "edit") && (
        <EventFormDialog
          event={dialog.mode === "edit" ? dialog.event : null}
          defaultDate={dialog.mode === "create" ? dialog.date : undefined}
          uniforms={uniforms}
          onClose={() => openDialog({ mode: "closed" })}
        />
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
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Check, Download, GripVertical, ImageIcon, Loader2, Plus, Redo2, Send, Trash2, Undo2, Users, X } from "lucide-react";
import { saveSchedule } from "@/app/dashboard/escala/[id]/actions";
import { DEFAULT_SCHEDULE_TITLE, NEW_SLOT_PREFIX } from "@/lib/schedule-defaults";
import { describeEventDate, personChipText, renderScheduleImage, type ScheduleImageData } from "@/lib/schedule-image";
import { Modal } from "./modal";

export interface SchedulePerson {
  enrollmentId: string;
  name: string;
  couple: boolean;
  spouseName: string | null;
}

export interface ScheduleSlot {
  id: string;
  label: string;
  location: string;
  people: SchedulePerson[];
}

/** Everything the user can edit on this screen, for undo / redo. */
interface Snapshot {
  slots: ScheduleSlot[];
  pool: SchedulePerson[];
  note: string;
  heading: string;
}

type SaveState =
  | { kind: "idle" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; text: string };

const POOL_ID = "pool";
/** Wait a moment after the last change so a burst of edits becomes a single save. */
const AUTOSAVE_DELAY_MS = 1000;

const inputClass =
  "w-full rounded-[5px] border border-[#6e9193] bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand";

function personLabel(person: SchedulePerson) {
  if (!person.couple) return person.name;
  return `CASAL: ${person.name} e ${person.spouseName?.trim() || "cônjuge"}`;
}

function ChipFace({
  person,
  lifted = false,
  dimmed = false,
}: {
  person: SchedulePerson;
  lifted?: boolean;
  dimmed?: boolean;
}) {
  return (
    <span
      className={`inline-flex touch-none select-none items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-sm lg:text-sm ${
        person.couple
          ? "bg-gradient-to-r from-brand-dark to-brand dark:bg-none dark:bg-lime-from dark:text-brand"
          : "bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from/20 dark:text-lime-from"
      } ${lifted ? "cursor-grabbing shadow-lg" : "cursor-grab"} ${dimmed ? "opacity-30" : ""}`}
    >
      <GripVertical size={13} className="opacity-70" />
      {person.couple && <Users size={13} />}
      {personLabel(person)}
    </span>
  );
}

/** A chip is both draggable and a drop target, so dropping on a name places the dragged one next to it. */
function PersonChip({ person }: { person: SchedulePerson }) {
  const drag = useDraggable({ id: person.enrollmentId });
  const drop = useDroppable({ id: person.enrollmentId });

  return (
    <span
      ref={(node) => {
        drag.setNodeRef(node);
        drop.setNodeRef(node);
      }}
      {...drag.listeners}
      {...drag.attributes}
      title="Arraste para mover"
      className={`inline-flex rounded-full ${drop.isOver && !drag.isDragging ? "ring-2 ring-lime-to ring-offset-2" : ""}`}
    >
      <ChipFace person={person} dimmed={drag.isDragging} />
    </span>
  );
}

function DropZone({ id, className, children }: { id: string; className: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className} transition-colors duration-150 ${isOver ? "bg-lime-from/25 dark:bg-lime-from/15" : ""}`}
    >
      {children}
    </div>
  );
}

function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state.kind === "idle") return null;

  if (state.kind === "error") {
    return (
      <span
        role="alert"
        className="inline-flex items-center gap-2 rounded-full bg-danger-from/15 px-3 py-1 text-xs font-semibold text-danger-text"
      >
        Não foi possível salvar
        <button type="button" onClick={onRetry} className="underline underline-offset-2">
          Tentar de novo
        </button>
      </span>
    );
  }

  // Edits are saved a moment after they are made, so "waiting" and "saving" look the same to the user.
  const saved = state.kind === "saved";
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        saved ? "bg-success-from/20 text-success-text" : "bg-ink/5 text-ink/60 dark:bg-white/10"
      }`}
    >
      {saved ? <Check size={13} strokeWidth={3} /> : <Loader2 size={13} className="animate-spin" />}
      {saved ? "Salvo" : "Salvando"}
    </span>
  );
}

export function ScheduleBoard({
  eventId,
  title,
  startsAt,
  dressCode,
  initialNote,
  initialHeading,
  initialSlots,
  initialPool,
}: {
  eventId: string;
  title: string;
  startsAt: Date;
  dressCode: string[];
  initialNote: string;
  initialHeading: string;
  initialSlots: ScheduleSlot[];
  initialPool: SchedulePerson[];
}) {
  const [slots, setSlots] = useState(initialSlots);
  const [pool, setPool] = useState(initialPool);
  const [note, setNote] = useState(initialNote);
  const [heading, setHeading] = useState(initialHeading);
  const [activePerson, setActivePerson] = useState<SchedulePerson | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [revision, setRevision] = useState(0);
  const [share, setShare] = useState<{ url: string; blob: Blob } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const { weekdayLong, dateFull, time } = describeEventDate(startsAt);

  // Small drag distance so clicking inside inputs/buttons never starts a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // ---- undo / redo: the current state, and the steps before / after it ---------------------
  const snapshot = useRef<Snapshot>({ slots, pool, note, heading });
  const history = useRef<{ past: Snapshot[]; future: Snapshot[]; group: string | null }>({
    past: [],
    future: [],
    group: null,
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    snapshot.current = { slots, pool, note, heading };
  }, [slots, pool, note, heading]);

  // ---- autosave ---------------------------------------------------------------------------
  // `latest` always holds the newest edits, so a save that was waiting never sends stale data.
  const latest = useRef({ slots, note, heading });
  const inFlight = useRef(false);
  const queued = useRef(false);
  const hasUnsaved = useRef(false);

  useEffect(() => {
    latest.current = { slots, note, heading };
  }, [slots, note, heading]);

  async function runSave(): Promise<void> {
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    inFlight.current = true;
    setSaveState({ kind: "saving" });

    const { slots: currentSlots, note: currentNote, heading: currentHeading } = latest.current;
    try {
      const result = await saveSchedule(eventId, {
        note: currentNote,
        heading: currentHeading,
        slots: currentSlots.map((slot) => ({
          id: slot.id,
          label: slot.label,
          location: slot.location,
          enrollmentIds: slot.people.map((p) => p.enrollmentId),
        })),
      });

      if (result.ok) {
        // Swap temporary ids for the real ones so the next save updates instead of duplicating.
        const remap = <T extends { id: string }>(items: T[]) =>
          items.map((item) => ({ ...item, id: result.idMap[item.id] ?? item.id }));
        latest.current = { ...latest.current, slots: remap(latest.current.slots) };
        setSlots((current) => remap(current));
        const remapSnapshot = (item: Snapshot): Snapshot => ({ ...item, slots: remap(item.slots) });
        history.current.past = history.current.past.map(remapSnapshot);
        history.current.future = history.current.future.map(remapSnapshot);
        snapshot.current = remapSnapshot(snapshot.current);
        hasUnsaved.current = queued.current;
        setSaveState(queued.current ? { kind: "dirty" } : { kind: "saved" });
      } else {
        setSaveState({ kind: "error", text: result.error });
      }
    } catch {
      setSaveState({ kind: "error", text: "Sem conexão com o servidor." });
    }

    inFlight.current = false;
    if (queued.current) {
      queued.current = false;
      void runSave();
    }
  }

  const runSaveRef = useRef(runSave);
  useEffect(() => {
    runSaveRef.current = runSave;
  });

  function markDirty() {
    hasUnsaved.current = true;
    setSaveState({ kind: "dirty" });
    setRevision((value) => value + 1);
  }

  function syncHistoryFlags() {
    setCanUndo(history.current.past.length > 0);
    setCanRedo(history.current.future.length > 0);
  }

  /** Call right BEFORE changing something. Typing in the same field in a row counts as a single step. */
  function commit(group?: string) {
    const h = history.current;
    if (group && h.group === group) return; // still typing in the same field
    h.past.push(snapshot.current);
    if (h.past.length > 100) h.past.shift();
    h.future = [];
    h.group = group ?? null;
    syncHistoryFlags();
  }

  function restore(target: Snapshot) {
    setSlots(target.slots);
    setPool(target.pool);
    setNote(target.note);
    setHeading(target.heading);
    markDirty();
  }

  function undo() {
    const h = history.current;
    const previous = h.past.pop();
    if (!previous) return;
    h.future.push(snapshot.current);
    h.group = null;
    restore(previous);
    syncHistoryFlags();
  }

  function redo() {
    const h = history.current;
    const next = h.future.pop();
    if (!next) return;
    h.past.push(snapshot.current);
    h.group = null;
    restore(next);
    syncHistoryFlags();
  }

  // Ctrl+Z / Ctrl+Y outside text fields (inside them the browser undoes the typing itself).
  const undoRedo = useRef({ undo, redo });
  useEffect(() => {
    undoRedo.current = { undo, redo };
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undoRedo.current.undo();
      } else if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        undoRedo.current.redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (revision === 0) return;
    const timer = setTimeout(() => void runSaveRef.current(), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [revision]);

  // Leaving the page (e.g. "Voltar para a agenda") flushes edits that were still waiting for the timer.
  useEffect(() => {
    return () => {
      if (hasUnsaved.current && !inFlight.current) void runSaveRef.current();
    };
  }, []);

  // Closing the tab while a save is pending or failed: ask for confirmation.
  useEffect(() => {
    if (saveState.kind === "idle" || saveState.kind === "saved") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState.kind]);

  // Free the preview image when it is replaced or the page is left.
  useEffect(() => {
    return () => {
      if (share) URL.revokeObjectURL(share.url);
    };
  }, [share]);

  // ---- drag and drop ----------------------------------------------------------------------
  function findPerson(enrollmentId: string): SchedulePerson | undefined {
    return (
      pool.find((p) => p.enrollmentId === enrollmentId) ??
      slots.flatMap((slot) => slot.people).find((p) => p.enrollmentId === enrollmentId)
    );
  }

  function slotOf(enrollmentId: string): ScheduleSlot | undefined {
    return slots.find((slot) => slot.people.some((p) => p.enrollmentId === enrollmentId));
  }

  function onDragStart(event: DragStartEvent) {
    setActivePerson(findPerson(String(event.active.id)) ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActivePerson(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    const person = findPerson(activeId);
    if (!person || !overId || overId === activeId) return;

    // Where did it land: on the pool, on an entry, or on another name (= next to that name)?
    let targetSlotId: string | null;
    let overPersonId: string | null = null;
    if (overId === POOL_ID) {
      targetSlotId = null;
    } else if (overId.startsWith("slot:")) {
      targetSlotId = overId.slice("slot:".length);
    } else {
      overPersonId = overId;
      targetSlotId = slotOf(overId)?.id ?? null;
    }

    const currentSlotId = slotOf(activeId)?.id ?? null;
    if (!overPersonId && targetSlotId === currentSlotId) return;

    const targetList = targetSlotId === null ? pool : (slots.find((s) => s.id === targetSlotId)?.people ?? []);
    const oldIndex = targetList.findIndex((p) => p.enrollmentId === activeId);
    const without = targetList.filter((p) => p.enrollmentId !== activeId);

    let index = without.length;
    if (overPersonId) {
      const overIndexBefore = targetList.findIndex((p) => p.enrollmentId === overPersonId);
      const overIndex = without.findIndex((p) => p.enrollmentId === overPersonId);
      // Dragging forward lands after the target, dragging backward lands before it.
      index = oldIndex !== -1 && oldIndex < overIndexBefore ? overIndex + 1 : overIndex;
    }
    const next = [...without.slice(0, index), person, ...without.slice(index)];

    commit();
    setPool((current) => (targetSlotId === null ? next : current.filter((p) => p.enrollmentId !== activeId)));
    setSlots((current) =>
      current.map((slot) =>
        slot.id === targetSlotId
          ? { ...slot, people: next }
          : { ...slot, people: slot.people.filter((p) => p.enrollmentId !== activeId) },
      ),
    );
    markDirty();
  }

  // ---- entries ----------------------------------------------------------------------------
  function updateSlot(id: string, patch: Partial<Pick<ScheduleSlot, "label" | "location">>) {
    commit(`slot-${id}-${Object.keys(patch)[0]}`);
    setSlots((current) => current.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
    markDirty();
  }

  function addSlot() {
    commit();
    setSlots((current) => [
      ...current,
      { id: `${NEW_SLOT_PREFIX}${crypto.randomUUID()}`, label: `ENTRADA ${current.length + 1}`, location: "", people: [] },
    ]);
    markDirty();
  }

  function removeSlot(id: string) {
    const slot = slots.find((s) => s.id === id);
    if (!slot) return;
    commit();
    // People of a removed entry go back to the pool.
    setPool((current) => [...current, ...slot.people]);
    setSlots((current) => current.filter((s) => s.id !== id));
    markDirty();
  }

  // ---- image + WhatsApp -------------------------------------------------------------------
  const fileName = `escala-${dateFull.replaceAll("/", "-")}.png`;

  async function generate() {
    setShareMessage(null);
    setIsGenerating(true);
    try {
      const data: ScheduleImageData = {
        heading: heading.trim() || DEFAULT_SCHEDULE_TITLE,
        weekdayLong,
        dateFull,
        time,
        title,
        uniform: dressCode,
        note: note.trim(),
        rows: slots.map((slot) => ({
          label: slot.label.trim(),
          location: slot.location.trim(),
          people: slot.people.map((p) => ({ text: personChipText(p), couple: p.couple })),
        })),
      };
      const blob = await renderScheduleImage(data);
      setShare({ url: URL.createObjectURL(blob), blob });
    } catch {
      setSaveState({ kind: "error", text: "Não foi possível gerar a imagem." });
    } finally {
      setIsGenerating(false);
    }
  }

  function download() {
    if (!share) return;
    const link = document.createElement("a");
    link.href = share.url;
    link.download = fileName;
    link.click();
  }

  /**
   * Sends the picture itself (never text).
   * - Phone/tablet: the system share sheet with the image attached; WhatsApp (the installed app) is one tap away.
   * - Computer: opens WhatsApp Web straight away with the image already copied, ready to paste (Ctrl+V).
   * (WhatsApp does not allow a link to attach a picture by itself, so these are the closest "direct" ways.)
   */
  async function sendToWhatsApp() {
    if (!share) return;
    const file = new File([share.blob], fileName, { type: "image/png" });
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS

    if (isMobile) {
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch {
          // The user closed the share sheet; nothing to do.
        }
        return;
      }
      download();
      setShareMessage("Imagem salva. Abra o WhatsApp e anexe na conversa.");
      return;
    }

    // Open the tab first (while the click is still "fresh") so the browser does not block it.
    window.open("https://web.whatsapp.com/", "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": share.blob })]);
      setShareMessage("Imagem copiada. No WhatsApp Web, abra a conversa e cole com Ctrl+V.");
    } catch {
      download();
      setShareMessage("Imagem baixada. No WhatsApp Web, anexe o arquivo na conversa.");
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActivePerson(null)}>
      <div className="flex flex-col gap-6 rounded-[15px] bg-surface p-6 shadow-[0_4px_30px_rgba(0,0,0,0.12)]">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
          <div>
            <p className="text-sm font-medium text-ink/60">Culto</p>
            <p className="text-lg font-semibold text-ink">{title}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-ink/60">Data</p>
            <p className="text-lg font-semibold text-ink">
              {weekdayLong} - {dateFull}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-ink/60">Hora</p>
            <p className="text-lg font-semibold text-ink">{time}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-ink/60">Uniforme</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {dressCode.length > 0 ? (
                dressCode.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from/20 dark:text-lime-from px-3 py-1 text-xs font-semibold text-white"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-ink/50">—</span>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-0.5" role="group" aria-label="Desfazer e refazer">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                title="Desfazer (Ctrl+Z)"
                aria-label="Desfazer"
                className="flex size-8 items-center justify-center rounded-full text-brand transition duration-150 ease-out hover:bg-brand/10 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 dark:text-lime-from dark:hover:bg-white/10"
              >
                <Undo2 size={17} />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                title="Refazer (Ctrl+Y)"
                aria-label="Refazer"
                className="flex size-8 items-center justify-center rounded-full text-brand transition duration-150 ease-out hover:bg-brand/10 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 dark:text-lime-from dark:hover:bg-white/10"
              >
                <Redo2 size={17} />
              </button>
            </div>
            <SaveStatus state={saveState} onRetry={() => void runSave()} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-ink">Título</span>
            <input
              value={heading}
              onChange={(e) => {
                commit("heading");
                setHeading(e.target.value);
                markDirty();
              }}
              maxLength={80}
              placeholder="Ex.: Recepção Templo Sede"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-ink">Aviso</span>
            <textarea
              value={note}
              onChange={(e) => {
                commit("note");
                setNote(e.target.value);
                markDirty();
              }}
              maxLength={1000}
              rows={2}
              placeholder="Opcional: recado para a equipe"
              className={`${inputClass} resize-y`}
            />
          </label>
        </div>

        <section>
          <h2 className="mb-2 text-xl font-medium text-ink">
            Voluntários{" "}
            <span className="ml-1 rounded-full bg-lime-from/70 px-2 py-0.5 text-sm text-brand">{pool.length}</span>
          </h2>
          <DropZone
            id={POOL_ID}
            className="flex min-h-[64px] flex-wrap items-start gap-2 rounded-[10px] border border-dashed border-[#6e9193] p-3"
          >
            {pool.length === 0 ? (
              <p className="text-sm text-ink/50">Nenhum voluntário pendente</p>
            ) : (
              pool.map((person) => <PersonChip key={person.enrollmentId} person={person} />)
            )}
          </DropZone>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-medium text-ink">Escala</h2>
          <div className="overflow-hidden rounded-[15px] border border-ink/60 dark:border-white/20">
            {slots.length === 0 && <p className="p-4 text-sm text-ink/55">Nenhuma entrada cadastrada</p>}
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className={`grid grid-cols-1 sm:grid-cols-[260px_1fr] ${
                  index !== 0 ? "border-t border-ink/60 dark:border-white/20" : ""
                }`}
              >
                <div className="flex flex-col gap-2 bg-brand/10 p-3 sm:border-r sm:border-ink/60 dark:sm:border-white/20">
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="Nome da entrada"
                      value={slot.label}
                      onChange={(e) => updateSlot(slot.id, { label: e.target.value })}
                      placeholder="Nome da entrada"
                      className={`${inputClass} min-w-0 flex-1 font-semibold`}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      title="Remover entrada"
                      aria-label="Remover entrada"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full text-danger-text transition duration-150 ease-out hover:bg-danger-from/15 active:scale-90"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <input
                    aria-label="Local ou descrição da entrada"
                    value={slot.location}
                    onChange={(e) => updateSlot(slot.id, { location: e.target.value })}
                    placeholder="Local ou descrição"
                    className={inputClass}
                  />
                </div>

                <DropZone id={`slot:${slot.id}`} className="flex min-h-[110px] flex-wrap content-start items-start gap-2 p-3">
                  {slot.people.map((person) => (
                    <PersonChip key={person.enrollmentId} person={person} />
                  ))}
                  {slot.people.length === 0 && <p className="text-sm text-ink/40">Nenhum voluntário</p>}
                </DropZone>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSlot}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-brand/50 py-3 text-sm font-semibold text-brand transition duration-150 ease-out hover:bg-brand/10 active:scale-[0.99] dark:border-lime-from/50 dark:text-lime-from dark:hover:bg-white/10"
          >
            <Plus size={16} strokeWidth={2.5} />
            Adicionar entrada
          </button>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={isGenerating || slots.length === 0}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from dark:text-brand px-6 py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            {isGenerating ? "Gerando..." : "Gerar escala"}
          </button>
        </div>
      </div>

      <DragOverlay>{activePerson ? <ChipFace person={activePerson} lifted /> : null}</DragOverlay>

      {share && (
        <Modal
          onClose={() => setShare(null)}
          labelledBy="share-title"
          className="flex max-h-[92vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-[15px] bg-surface p-6 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h2 id="share-title" className="text-xl font-semibold text-ink">
              Escala pronta
            </h2>
            <button onClick={() => setShare(null)} title="Fechar" className="text-ink/60 transition-colors hover:text-ink">
              <X size={20} />
            </button>
          </div>

          {pool.length > 0 && (
            <p className="rounded-[8px] bg-warning-from/20 px-3 py-2 text-sm text-ink">
              Atenção: {pool.length} voluntário(s) inscrito(s) ainda não estão em nenhuma entrada e não aparecem na escala.
            </p>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={share.url} alt="Prévia da escala" className="w-full rounded-[10px] border border-ink/15" />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sendToWhatsApp}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from dark:text-brand px-5 py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 active:scale-95"
            >
              <Send size={16} />
              Enviar no WhatsApp
            </button>
            <button
              type="button"
              onClick={download}
              className="flex items-center gap-2 rounded-full border border-brand px-5 py-2.5 text-sm font-bold text-brand transition duration-150 ease-out hover:scale-105 hover:bg-brand/10 active:scale-95 dark:text-lime-from"
            >
              <Download size={16} />
              Baixar imagem
            </button>
          </div>

          {shareMessage && (
            <p role="status" className="text-sm font-medium text-ink/70">
              {shareMessage}
            </p>
          )}
        </Modal>
      )}
    </DndContext>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { X } from "lucide-react";
import { createEvent, updateEvent, type ActionState } from "@/app/dashboard/eventos/novo/actions";
import type { EventRecord } from "./event-management";
import { DatePicker } from "./date-picker";
import { toDateInputValue, toTimeInputValue } from "@/lib/event-schedule";

const inputClass =
  "rounded-[5px] border border-[#6e9193] px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand";

export function EventFormDialog({
  event,
  uniforms,
  onClose,
}: {
  event: EventRecord | null;
  uniforms: string[];
  onClose: () => void;
}) {
  const isEdit = event !== null;
  const action = isEdit ? updateEvent : createEvent;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, undefined);
  const wasPending = useRef(false);

  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event ? toDateInputValue(event.startsAt) : "");
  const [time, setTime] = useState(event ? toTimeInputValue(event.startsAt) : "");
  const [capacity, setCapacity] = useState(String(event?.capacity ?? 1));
  const [dressCode, setDressCode] = useState<string[]>(event?.dressCode ?? []);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      onClose();
    }
    wasPending.current = isPending;
  }, [isPending, state, onClose]);

  function toggleUniform(name: string) {
    setDressCode((tags) => (tags.includes(name) ? tags.filter((t) => t !== name) : [...tags, name]));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[15px] bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isEdit ? "Editar evento" : "Novo evento"}</h2>
          <button onClick={onClose} title="Fechar" className="text-ink/60 transition-colors hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          {isEdit && <input type="hidden" name="id" value={event.id} />}
          <input type="hidden" name="date" value={date} />
          {dressCode.map((tag) => (
            <input key={tag} type="hidden" name="dressCode" value={tag} />
          ))}

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Título
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
              placeholder="Culto de Ensino"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-ink">
              Data
              <DatePicker value={date} onChange={setDate} defaultYear={new Date().getFullYear()} />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-ink">
              Horário
              <input
                name="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Vagas
            <input
              name="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              className={inputClass}
            />
          </label>

          <div className="flex flex-col gap-1 text-sm font-medium text-ink">
            Traje
            {uniforms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {uniforms.map((name) => {
                  const selected = dressCode.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleUniform(name)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-150 ${
                        selected
                          ? "bg-gradient-to-r from-brand to-brand-dark text-white"
                          : "border border-[#6e9193] text-ink hover:bg-lime-from/30"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-normal text-ink/60">
                Nenhum uniforme cadastrado ainda. Cadastre um em &ldquo;Uniformes&rdquo; primeiro.
              </p>
            )}
          </div>

          {state?.error && <p className="text-sm text-danger-to">{state.error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar evento"}
          </button>
        </form>
      </div>
    </div>
  );
}

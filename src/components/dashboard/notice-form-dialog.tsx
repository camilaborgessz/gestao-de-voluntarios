"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { X } from "lucide-react";
import { createNotice, updateNotice, type ActionState } from "@/app/dashboard/eventos/novo/actions";
import type { NoticeRecord } from "./notice-management";
import { DateRangePicker } from "./date-range-picker";
import { toDateInputValue } from "@/lib/event-schedule";

const inputClass =
  "rounded-[5px] border border-[#6e9193] px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand";

export function NoticeFormDialog({ notice, onClose }: { notice: NoticeRecord | null; onClose: () => void }) {
  const isEdit = notice !== null;
  const action = isEdit ? updateNotice : createNotice;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, undefined);
  const wasPending = useRef(false);

  const [message, setMessage] = useState(notice?.message ?? "");
  const [visibleFrom, setVisibleFrom] = useState(notice ? toDateInputValue(notice.visibleFrom) : "");
  const [visibleUntil, setVisibleUntil] = useState(notice ? toDateInputValue(notice.visibleUntil) : "");

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      onClose();
    }
    wasPending.current = isPending;
  }, [isPending, state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[15px] bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isEdit ? "Editar aviso" : "Novo aviso"}</h2>
          <button onClick={onClose} title="Fechar" className="text-ink/60 transition-colors hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          {isEdit && <input type="hidden" name="id" value={notice.id} />}
          <input type="hidden" name="visibleFrom" value={visibleFrom} />
          <input type="hidden" name="visibleUntil" value={visibleUntil} />

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Aviso
            <textarea
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              autoFocus
              className={`resize-none ${inputClass}`}
              placeholder="Escreva o aviso para a equipe"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Período de exibição
            <DateRangePicker
              from={visibleFrom}
              to={visibleUntil}
              onChange={(newFrom, newTo) => {
                setVisibleFrom(newFrom);
                setVisibleUntil(newTo);
              }}
              defaultYear={new Date().getFullYear()}
            />
          </label>

          {state?.error && <p className="text-sm text-danger-to">{state.error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Publicar aviso"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { X } from "lucide-react";
import { createNotice, updateNotice, type ActionState } from "@/app/dashboard/eventos/novo/actions";
import type { NoticeRecord } from "./notice-management";
import { DateRangePicker } from "./date-range-picker";
import { Modal } from "./modal";
import { ConfirmDialog } from "./confirm-dialog";
import { useConfirmSubmit } from "./use-confirm-submit";
import { toDateInputValue } from "@/lib/event-schedule";

const inputClass =
  "rounded-[5px] border border-[#6e9193] px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand";

export function NoticeFormDialog({ notice, onClose }: { notice: NoticeRecord | null; onClose: () => void }) {
  const isEdit = notice !== null;
  const action = isEdit ? updateNotice : createNotice;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, undefined);
  const confirmSave = useConfirmSubmit(isEdit);
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
    <>
    <Modal
      onClose={onClose}
      labelledBy="notice-form-title"
      closeOnBackdrop={!isPending}
      className="w-full max-w-md rounded-[15px] bg-surface p-6 shadow-xl"
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 id="notice-form-title" className="text-xl font-semibold text-ink">
            {isEdit ? "Editar aviso" : "Novo aviso"}
          </h2>
          <button onClick={onClose} title="Fechar" className="text-ink/60 transition-colors hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <form {...confirmSave.formProps} action={formAction} className="flex flex-col gap-3">
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
              data-autofocus
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

          {state?.error && <p className="text-sm text-danger-text">{state.error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from dark:text-brand py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Publicar aviso"}
          </button>
        </form>
      </div>
    </Modal>
      {confirmSave.asking && (
        <ConfirmDialog
          title="Salvar alterações?"
          description="As alterações do aviso serão aplicadas imediatamente."
          confirmLabel="Salvar"
          cancelLabel="Cancelar"
          tone="default"
          loadingLabel="Salvando..."
          onCancel={confirmSave.cancel}
          onConfirm={confirmSave.confirm}
        />
      )}
    </>
  );
}

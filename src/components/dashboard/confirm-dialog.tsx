"use client";

import { X, Loader2 } from "lucide-react";
import { Modal } from "./modal";

/**
 * Confirmation before an important action. Pattern: a short question as the title, one sentence
 * saying what will happen, a neutral "Cancelar" and a confirm button named after the action.
 * `tone="danger"` (the default) is for destructive actions such as deleting.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  loadingLabel = "Excluindo...",
  tone = "danger",
  isLoading = false,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  tone?: "default" | "danger";
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      onClose={onCancel}
      labelledBy="confirm-dialog-title"
      closeOnBackdrop={!isLoading}
      className="relative w-full max-w-[440px] rounded-[15px] bg-surface px-8 py-8 text-center shadow-xl"
    >
      <div>
        <button
          onClick={onCancel}
          disabled={isLoading}
          title="Fechar"
          aria-label="Fechar"
          className="absolute right-5 top-5 text-ink/60 transition-colors hover:text-ink disabled:opacity-40"
        >
          <X size={20} />
        </button>

        <h2 id="confirm-dialog-title" className="text-xl font-semibold text-ink">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-ink/70">{description}</p>}

        {error && <p className="mt-4 text-sm font-medium text-danger-text">{error}</p>}

        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-full border border-ink/25 px-6 py-2 text-sm font-semibold text-ink transition duration-150 ease-out hover:bg-ink/5 active:scale-95 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            data-autofocus
            className={`flex min-w-[7.5rem] items-center justify-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition duration-150 ease-out hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 ${
              tone === "danger"
                ? "bg-danger-to text-white dark:bg-danger-from dark:text-[#2a0b0b]"
                : "bg-gradient-to-r from-brand to-brand-dark text-white dark:bg-none dark:bg-lime-from dark:text-brand"
            }`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

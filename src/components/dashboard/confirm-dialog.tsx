"use client";

import { X, Loader2 } from "lucide-react";

export function ConfirmDialog({
  message,
  confirmLabel = "Sim, desejo excluir",
  cancelLabel = "Não, cancelar",
  isLoading = false,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="relative w-full max-w-[608px] rounded-[15px] bg-bg px-8 py-10 text-center shadow-xl">
        <button
          onClick={onCancel}
          disabled={isLoading}
          title="Fechar"
          className="absolute right-6 top-6 text-ink/70 transition-colors hover:text-ink disabled:opacity-40"
        >
          <X size={22} />
        </button>

        <p className="text-lg font-bold text-ink">{message}</p>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-full bg-danger-from px-6 py-1.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:brightness-95 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex min-w-[9rem] items-center justify-center gap-2 rounded-full bg-success-from px-6 py-1.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:brightness-95 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

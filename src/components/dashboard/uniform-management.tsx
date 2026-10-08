"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { UniformFormDialog } from "./uniform-form-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { deleteUniform } from "@/app/dashboard/eventos/novo/actions";

export interface UniformRecord {
  id: string;
  name: string;
}

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; uniform: UniformRecord }
  | { mode: "delete"; uniform: UniformRecord };

export function UniformManagement({ uniforms }: { uniforms: UniformRecord[] }) {
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function openDialog(next: DialogState) {
    setDeleteError(null);
    setDialog(next);
  }

  function confirmDelete() {
    if (dialog.mode !== "delete") return;
    const { uniform } = dialog;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteUniform(uniform.id);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDialog({ mode: "closed" });
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-medium text-ink lg:text-2xl">Uniformes</h2>
        <button
          title="Novo uniforme"
          onClick={() => openDialog({ mode: "create" })}
          className="flex size-6 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-[10px] bg-gradient-to-r from-brand to-brand-dark p-5 shadow-[0_4px_17px_rgba(0,0,0,0.25)] sm:grid-cols-2 dark:bg-none dark:bg-surface">
        {uniforms.length === 0 && <p className="col-span-full text-sm text-white/80">Nenhum uniforme cadastrado ainda.</p>}

        {uniforms.map((uniform) => (
          <div
            key={uniform.id}
            className="flex items-center justify-between gap-2 rounded-full bg-gradient-to-r from-white to-bg px-4 py-2 dark:from-surface-raised dark:to-surface-raised transition-shadow duration-150 hover:shadow-md"
          >
            <span className="truncate text-sm font-semibold text-ink">{uniform.name}</span>
            <div className="flex shrink-0 items-center gap-2 text-ink/70">
              <button
                title="Apagar"
                onClick={() => openDialog({ mode: "delete", uniform })}
                className="transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
              >
                <Trash2 size={16} />
              </button>
              <button
                title="Editar"
                onClick={() => openDialog({ mode: "edit", uniform })}
                className="transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
              >
                <Pencil size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(dialog.mode === "create" || dialog.mode === "edit") && (
        <UniformFormDialog
          uniform={dialog.mode === "edit" ? dialog.uniform : null}
          onClose={() => openDialog({ mode: "closed" })}
        />
      )}

      {dialog.mode === "delete" && (
        <ConfirmDialog
          title="Excluir uniforme?"
          description={`"${dialog.uniform.name}" será removido permanentemente.`}
          isLoading={isDeleting}
          error={deleteError}
          onCancel={() => openDialog({ mode: "closed" })}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

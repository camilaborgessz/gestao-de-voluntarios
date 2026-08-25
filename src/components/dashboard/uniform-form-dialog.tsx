"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { X } from "lucide-react";
import { createUniform, updateUniform, type ActionState } from "@/app/dashboard/eventos/novo/actions";
import type { UniformRecord } from "./uniform-management";

const inputClass =
  "rounded-[5px] border border-[#6e9193] px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand";

export function UniformFormDialog({ uniform, onClose }: { uniform: UniformRecord | null; onClose: () => void }) {
  const isEdit = uniform !== null;
  const action = isEdit ? updateUniform : createUniform;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, undefined);
  const wasPending = useRef(false);

  const [name, setName] = useState(uniform?.name ?? "");

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      onClose();
    }
    wasPending.current = isPending;
  }, [isPending, state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-[15px] bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isEdit ? "Editar uniforme" : "Novo uniforme"}</h2>
          <button onClick={onClose} title="Fechar" className="text-ink/60 transition-colors hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          {isEdit && <input type="hidden" name="id" value={uniform.id} />}

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Nome
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className={inputClass}
              placeholder="Ex: Saia preta"
            />
          </label>

          {state?.error && <p className="text-sm text-danger-to">{state.error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar uniforme"}
          </button>
        </form>
      </div>
    </div>
  );
}

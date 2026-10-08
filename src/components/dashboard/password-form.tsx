"use client";

import { useActionState, useEffect } from "react";
import { Check, Pencil } from "lucide-react";
import { changePassword, type ActionState } from "@/app/dashboard/perfil/actions";
import { PasswordInput } from "@/components/password-input";
import { ConfirmDialog } from "./confirm-dialog";
import { useConfirmSubmit } from "./use-confirm-submit";

const inputClass =
  "rounded-[5px] border border-[#6e9193] bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-lime-from";

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(changePassword, undefined);
  const confirmSave = useConfirmSubmit(true);
  const { reset } = confirmSave;
  const justSaved = state?.success === true;

  useEffect(() => {
    if (justSaved) reset();
  }, [justSaved, reset]);

  return (
    <section>
      <h2 className="mb-4 text-xl font-medium text-ink lg:text-2xl">Senha</h2>

      <form
        {...confirmSave.formProps}
        action={formAction}
        className="flex flex-col gap-4 rounded-[15px] bg-gradient-to-b from-brand to-brand-dark p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:bg-none dark:bg-surface"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-base font-semibold text-white">Senha atual</span>
          <PasswordInput name="currentPassword" required className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-base font-semibold text-white">Nova senha</span>
          <PasswordInput
            name="newPassword"
            placeholder="***********"
            required
            minLength={6}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-base font-semibold text-white">Confirmar nova senha</span>
          <PasswordInput
            name="confirmPassword"
            placeholder="***********"
            required
            minLength={6}
            className={inputClass}
          />
        </label>

        {state?.error && <p className="text-sm text-danger-from">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex items-center gap-2 self-end rounded-full bg-white px-6 py-2.5 text-sm font-bold text-brand dark:bg-lime-from dark:text-brand transition duration-150 ease-out hover:scale-105 hover:brightness-95 active:scale-95 disabled:opacity-60"
        >
          {justSaved ? <Check size={16} /> : <Pencil size={16} />}
          {isPending ? "Salvando..." : justSaved ? "Senha alterada" : "Alterar Senha"}
        </button>
      </form>
      {confirmSave.asking && (
        <ConfirmDialog
          title="Alterar senha?"
          description="Use a nova senha no próximo acesso."
          confirmLabel="Alterar senha"
          cancelLabel="Cancelar"
          tone="default"
          loadingLabel="Alterando..."
          onCancel={confirmSave.cancel}
          onConfirm={confirmSave.confirm}
        />
      )}
    </section>
  );
}

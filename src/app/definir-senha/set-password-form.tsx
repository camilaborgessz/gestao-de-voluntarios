"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { AuthButton, AuthField } from "@/components/auth/auth-field";
import { setPassword, type SetPasswordState } from "./actions";

export function SetPasswordForm({ token, firstName, invite }: { token: string; firstName: string; invite: boolean }) {
  const [state, formAction, isPending] = useActionState<SetPasswordState, FormData>(setPassword, undefined);

  return (
    <form action={formAction} className="flex flex-col">
      <input type="hidden" name="token" value={token} />

      <h1 className="mb-2 text-center font-display text-4xl font-medium text-brand-dark dark:text-ink sm:text-5xl">
        {invite ? "Criar senha" : "Nova senha"}
      </h1>
      <p className="mb-8 text-center text-base text-ink/80">Olá, {firstName}!</p>

      <div className="flex flex-col gap-6">
        <AuthField
          kind="password"
          name="password"
          autoComplete="new-password"
          placeholder="Nova senha (mín. 8 caracteres)"
          aria-label="Nova senha"
          required
          minLength={8}
        />
        <AuthField
          kind="password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Confirme a senha"
          aria-label="Confirmar senha"
          required
          minLength={8}
        />
      </div>

      {state?.error && (
        <p role="alert" className="mt-4 text-center text-sm font-medium text-danger-text">
          {state.error}
        </p>
      )}

      <div className="mt-7">
        <AuthButton disabled={isPending}>
          {isPending && <Loader2 size={18} className="animate-spin" />}
          {isPending ? "Salvando..." : "Salvar senha"}
        </AuthButton>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { requestPasswordReset, type ResetRequestState } from "./actions";
import { AuthShell, AuthToast } from "@/components/auth/auth-shell";
import { AuthButton, AuthField } from "@/components/auth/auth-field";
import { LinkSpinner } from "@/components/dashboard/link-pending";

export default function RecoverPasswordPage() {
  const [state, formAction, isPending] = useActionState<ResetRequestState, FormData>(requestPasswordReset, undefined);
  const sent = state?.sent === true;

  return (
    <AuthShell
      toast={
        sent && (
          <AuthToast>
            <Check size={30} strokeWidth={2} />
            Solicitação enviada!
          </AuthToast>
        )
      }
    >
      <form action={formAction} className="flex flex-col">
        <div className="mb-10 flex justify-center">
          <h1 className="whitespace-nowrap font-display text-4xl font-medium text-brand-dark dark:text-ink sm:text-5xl lg:text-[64px]">
            Recuperar Senha
          </h1>
        </div>

        <AuthField
          kind="identifier"
          name="identifier"
          autoComplete="username"
          placeholder="Digite seu email ou telefone"
          aria-label="Email ou telefone"
          required
        />

        {state?.error && (
          <p role="alert" className="mt-4 text-center text-sm font-medium text-danger-text">
            {state.error}
          </p>
        )}

        <div className="mt-7">
          <AuthButton disabled={isPending}>
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {isPending ? "Enviando..." : "Solicitar nova senha"}
          </AuthButton>
        </div>

        {sent && (
          <p className="mt-4 text-center text-sm font-medium text-ink/80">
            Se houver cadastro, você receberá um link por e-mail.
          </p>
        )}

        <Link
          href="/login"
          className="mt-4 flex items-center justify-center gap-2 text-base font-semibold text-brand transition-colors hover:underline dark:text-lime-from"
        >
          Voltar ao login
          <LinkSpinner />
        </Link>
      </form>
    </AuthShell>
  );
}

"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { Check, Loader2 } from "lucide-react";
import { authenticate } from "./actions";
import { AuthShell, AuthToast } from "@/components/auth/auth-shell";
import { AuthButton, AuthField } from "@/components/auth/auth-field";
import { LinkSpinner } from "@/components/dashboard/link-pending";

/** Green tag shown after the person creates a password through the emailed link. */
function PasswordSavedToast() {
  const saved = useSearchParams().get("senha") === "ok";
  if (!saved) return null;
  return (
    <AuthToast>
      <Check size={30} strokeWidth={2} />
      Senha criada!
    </AuthToast>
  );
}

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  // Controlled: a failed attempt resets the form, and the email/phone should stay typed.
  const [identifier, setIdentifier] = useState("");

  return (
    <AuthShell
      toast={
        <Suspense>
          <PasswordSavedToast />
        </Suspense>
      }
    >
      <form action={formAction} className="flex flex-col">
        <h1 className="mb-10 text-center font-display text-5xl font-medium lg:text-[64px] text-brand-dark dark:text-ink">Entrar</h1>

        <div className="flex flex-col gap-6">
          <AuthField
            kind="identifier"
            name="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            placeholder="Digite seu email ou telefone"
            aria-label="Email ou telefone"
            required
          />
          <AuthField
            kind="password"
            name="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            aria-label="Senha"
            required
            minLength={6}
          />
        </div>

        {errorMessage && (
          <p role="alert" className="mt-4 text-center text-sm font-medium text-danger-text">
            {errorMessage}
          </p>
        )}

        <div className="mt-7">
          <AuthButton disabled={isPending}>
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {isPending ? "Entrando..." : "Entrar"}
          </AuthButton>
        </div>

        <Link
          href={"/recuperar-senha" as Route}
          className="mt-4 flex items-center justify-center gap-2 text-base font-semibold text-brand transition-colors hover:underline dark:text-lime-from"
        >
          Esqueceu a senha?
          <LinkSpinner />
        </Link>
      </form>
    </AuthShell>
  );
}

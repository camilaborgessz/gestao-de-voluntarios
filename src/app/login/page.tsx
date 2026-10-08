"use client";

import { useActionState } from "react";
import Image from "next/image";
import { authenticate } from "./actions";
import { PasswordInput } from "@/components/password-input";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-[10px] bg-surface p-8 shadow-[0_4px_37px_rgba(0,0,0,0.1)]"
      >
        <Image
          src="/logo.png"
          alt="Koinonia"
          width={150}
          height={50}
          priority
          unoptimized
          className="dark:hidden"
        />
        <Image
          src="/logo-dark.png"
          alt="Koinonia"
          width={150}
          height={50}
          priority
          unoptimized
          className="hidden dark:block"
        />

        <h1 className="text-2xl font-semibold text-ink">Entrar</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-brand/20 px-3 py-2 outline-none focus:border-brand"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Senha
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={6}
            className="w-full rounded-md border border-brand/20 px-3 py-2 outline-none focus:border-brand"
          />
        </div>

        {errorMessage && (
          <p className="text-sm text-danger-text">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full border border-brand-dark bg-brand py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

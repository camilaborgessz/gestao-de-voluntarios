import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LinkSpinner } from "@/components/dashboard/link-pending";
import { lookupPasswordToken } from "@/lib/password-tokens";
import { SetPasswordForm } from "./set-password-form";

// The address carries the one-time token: never leak it through the Referer header.
export const metadata: Metadata = { title: "Definir senha", referrer: "no-referrer" };

const PROBLEM: Record<"invalid" | "expired" | "used", string> = {
  invalid: "Link inválido.",
  expired: "Este link expirou.",
  used: "Este link já foi usado.",
};

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const lookup = await lookupPasswordToken(token);

  return (
    <AuthShell>
      {lookup.ok ? (
        <SetPasswordForm token={token!} firstName={lookup.userName.split(" ")[0]} invite={lookup.purpose === "INVITE"} />
      ) : (
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="font-display text-4xl font-medium text-brand-dark dark:text-ink sm:text-5xl">{PROBLEM[lookup.reason]}</h1>
          <p className="text-base text-ink/80">Peça um novo link para continuar.</p>
          <Link
            href={"/recuperar-senha" as Route}
            className="flex items-center justify-center gap-2 text-base font-semibold text-brand transition-colors hover:underline dark:text-lime-from"
          >
            Pedir novo link
            <LinkSpinner />
          </Link>
        </div>
      )}
    </AuthShell>
  );
}

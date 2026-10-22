"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { consumePasswordToken, passwordProblem } from "@/lib/password-tokens";
import { allowAttempt } from "@/lib/rate-limit";

export type SetPasswordState = { error?: string } | undefined;

/** Final step of both the invitation and "esqueci minha senha": spends the link and saves the new password. */
export async function setPassword(_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!allowAttempt(`set-password:${token.slice(0, 16)}`, 10, 15 * 60_000)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }
  if (password !== confirm) return { error: "As senhas não coincidem" };
  const problem = await passwordProblem(password);
  if (problem) return { error: problem };

  const done = await consumePasswordToken(token, password);
  if (!done) return { error: "Este link não vale mais. Peça um novo." };

  redirect("/login?senha=ok" as Route);
}

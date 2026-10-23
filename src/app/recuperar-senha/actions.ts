"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { findUserByIdentifier } from "@/lib/user-lookup";
import { sendAccountEmail } from "@/lib/email";
import { TOKEN_TTL_LABEL, issuePasswordToken, passwordLink } from "@/lib/password-tokens";
import { allowAttempt } from "@/lib/rate-limit";

export type ResetRequestState = { sent?: boolean; error?: string } | undefined;

/** The same person cannot trigger a new email more often than this. */
const RESEND_AFTER_MS = 2 * 60_000;
const ADMIN_REPEAT_WINDOW_MS = 30 * 60_000;

/**
 * "Esqueceu a senha?": emails a one-time link to the address on file. The answer is always the same,
 * so nobody can use this form to find out who has an account. When the email cannot be sent (not
 * configured / provider down) the request goes to the leaders' bell instead, so it is never lost.
 */
export async function requestPasswordReset(_prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  if (identifier.length < 3) return { error: "Informe seu email ou telefone" };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowAttempt(`reset-ip:${ip}`, 10, 15 * 60_000) || !allowAttempt(`reset:${identifier.toLowerCase()}`, 3, 15 * 60_000)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  try {
    await handleRequest(identifier);
  } catch {
    return { error: "Não foi possível enviar agora. Tente novamente." };
  }

  return { sent: true };
}

async function handleRequest(identifier: string) {
  const user = await findUserByIdentifier(identifier);
  if (!user) return;

  const recent = await prisma.passwordToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_AFTER_MS) } },
  });
  if (recent) return;

  const kind = user.passwordHash ? "RESET" : "INVITE";
  const token = await issuePasswordToken(user.id, kind);
  const result = await sendAccountEmail({
    to: user.email,
    name: user.name,
    kind,
    link: await passwordLink(token),
    validFor: TOKEN_TTL_LABEL[kind],
  });
  if (result.status === "SENT") return;
  console.error("[email] link de senha não enviado:", result.status, result.error);

  await notifyAdmins(user.name, user.email);
}

async function notifyAdmins(name: string, email: string) {
  const message = `${name} (${email}) pediu uma nova senha.`;
  const alreadyAsked = await prisma.notification.findFirst({
    where: {
      kind: "PASSWORD_RESET_REQUEST",
      message,
      createdAt: { gt: new Date(Date.now() - ADMIN_REPEAT_WINDOW_MS) },
    },
  });
  if (alreadyAsked) return;

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      kind: "PASSWORD_RESET_REQUEST" as const,
      title: "Pedido de nova senha",
      message,
    })),
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminActionError } from "@/lib/auth-guards";
import { sendAccountEmail } from "@/lib/email";
import { TOKEN_TTL_LABEL, issuePasswordToken, passwordLink } from "@/lib/password-tokens";

// Every action below is admin-only.

const userSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  role: z.enum(["ADMIN", "VOLUNTEER"]),
});

const updateSchema = userSchema.extend({
  id: z.string().min(1),
});

/** What happened to the invitation email. `link` is only returned when the email could not be sent. */
export interface InviteResult {
  email: string;
  sent: boolean;
  link?: string;
  /** "convite" the first time, "link de nova senha" for people who already have a password. */
  kind: "INVITE" | "RESET";
}

export type ActionState = { error?: string; invite?: InviteResult } | undefined;

/** Creates the one-time link and emails it. If the email is off or fails, the leader gets the link to pass on. */
async function sendPasswordLink(user: { id: string; name: string; email: string; passwordHash: string | null }): Promise<InviteResult> {
  const kind = user.passwordHash ? "RESET" : "INVITE";
  const token = await issuePasswordToken(user.id, kind);
  const link = await passwordLink(token);
  const result = await sendAccountEmail({
    to: user.email,
    name: user.name,
    kind,
    link,
    validFor: TOKEN_TTL_LABEL[kind],
  });
  if (result.status !== "SENT") console.error("[email] link de senha não enviado:", result.status, result.error);
  return result.status === "SENT"
    ? { email: user.email, sent: true, kind }
    : { email: user.email, sent: false, link, kind };
}

export async function createUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { name, email, phone, birthDate, role } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (existing) {
    return { error: "Já existe um usuário com esse email" };
  }

  // No password: the person chooses it through the emailed link, so nobody else ever sees it.
  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, birthDate: birthDate ? new Date(birthDate) : null, role },
  });
  const invite = await sendPasswordLink(user);

  revalidatePath("/dashboard/voluntarios");
  return { invite };
}

export async function updateUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { id, name, email, phone, birthDate, role } = parsed.data;

  await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      phone: phone || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      role,
    },
  });

  revalidatePath("/dashboard/voluntarios");
}

/** "Reenviar convite" (pending) or "Enviar link de nova senha" (active): a new link replaces the old one. */
export async function resendPasswordLink(id: string): Promise<InviteResult> {
  if (await adminActionError()) throw new Error("Sem permissão");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
  const invite = await sendPasswordLink(user);

  revalidatePath("/dashboard/voluntarios");
  return invite;
}

export async function deleteUser(id: string) {
  if (await adminActionError()) throw new Error("Sem permissão");

  await prisma.user.delete({ where: { id } });
  revalidatePath("/dashboard/voluntarios");
}

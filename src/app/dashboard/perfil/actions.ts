"use server";

import { EMAIL_IN_USE_MESSAGE, findUserWithSameMailbox } from "@/lib/email-key";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { spouseKey } from "@/lib/spouse-key";
import { MIN_PASSWORD_LENGTH, passwordProblem } from "@/lib/password-tokens";

const profileSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  helpMode: z.enum(["INDIVIDUAL", "COUPLE"]).optional(),
  spouseName: z.string().trim().max(120).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH, `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function updateProfile(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sessão expirada, faça login novamente" };
  }

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { name, email, phone, birthDate, helpMode, spouseName } = parsed.data;
  // Checkboxes are present in the form data only when ticked.
  const notifyEmail = formData.get("notifyEmail") === "on";

  if (await findUserWithSameMailbox(email, session.user.id)) return { error: EMAIL_IN_USE_MESSAGE };

  const before = await prisma.user.findUnique({ where: { id: session.user.id }, select: { spouseName: true } });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email,
      phone: phone || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      notifyEmail,
      ...(helpMode ? { helpMode, spouseName: helpMode === "COUPLE" ? spouseName || null : null } : {}),
    },
  });

  // A new spouse name replaces the old one everywhere: past and future signups, the ranking, the schedules.
  const newSpouse = helpMode === "COUPLE" ? spouseName?.trim() : "";
  if (newSpouse && newSpouse !== before?.spouseName) {
    await applySpouseName(session.user.id, newSpouse);
  }

  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
  return { success: true };
}

/**
 * Makes every trace of this volunteer's spouse carry the new name: the couple signups (also past ones, which
 * feed the "mais assíduos" ranking) and the services already kept from archived events.
 */
async function applySpouseName(userId: string, name: string) {
  await prisma.enrollment.updateMany({ where: { userId, helpMode: "COUPLE" }, data: { spouseName: name } });

  const stored = await prisma.spouseService.findMany({ where: { userId } });
  if (stored.length === 0) return;
  const key = spouseKey(name);
  const total = stored.reduce((sum, row) => sum + row.count, 0);
  await prisma.spouseService.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, name, count: total },
    update: { count: total, name },
  });
  await prisma.spouseService.deleteMany({ where: { userId, key: { not: key } } });
}

export async function changePassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sessão expirada, faça login novamente" };
  }

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return { error: "Usuário não encontrado" };
  }

  const problem = await passwordProblem(newPassword);
  if (problem) return { error: problem };

  const passwordsMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordsMatch) {
    return { error: "Senha atual incorreta" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  revalidatePath("/dashboard/perfil");
  return { success: true };
}

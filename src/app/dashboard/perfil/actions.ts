"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.user.id) {
    return { error: "Já existe um usuário com esse email" };
  }

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

  revalidatePath("/dashboard/perfil");
  return { success: true };
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

"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// TODO(auth): once login is wired up, guard every action below with
// something like `requireRole("ADMIN")` before touching the database.

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

export type ActionState = { error?: string; generatedPassword?: string } | undefined;

function generateTempPassword() {
  // 12-character URL-safe random password, shown once to whoever creates/resets the account.
  return randomBytes(9).toString("base64url");
}

export async function createUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { name, email, phone, birthDate, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário com esse email" };
  }

  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      role,
      passwordHash,
    },
  });

  revalidatePath("/dashboard/voluntarios");
  return { generatedPassword: password };
}

export async function updateUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
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

export async function resetUserPassword(id: string): Promise<string> {
  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({ where: { id }, data: { passwordHash } });

  revalidatePath("/dashboard/voluntarios");
  return password;
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/dashboard/voluntarios");
}

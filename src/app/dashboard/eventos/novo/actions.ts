"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { adminActionError } from "@/lib/auth-guards";
import { wallClockToDate } from "@/lib/event-schedule";

// Every action below is admin-only (volunteers can only view events and join them).

const eventSchema = z.object({
  title: z.string().min(1, "Informe o título"),
  date: z.string().min(1, "Informe a data"),
  time: z.string().min(1, "Informe o horário"),
  capacity: z.coerce.number().int().min(1, "Capacidade deve ser pelo menos 1"),
});

const updateEventSchema = eventSchema.extend({
  id: z.string().min(1),
});

export type ActionState = { error?: string } | undefined;

export async function createEvent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { title, date, time, capacity } = parsed.data;
  const startsAt = wallClockToDate(date, time);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Data ou horário inválido" };
  }

  const dressCode = formData
    .getAll("dressCode")
    .map((value) => String(value).trim())
    .filter(Boolean);

  try {
    await prisma.event.create({
      data: { title, startsAt, capacity, dressCode },
    });
  } catch {
    return { error: "Não foi possível salvar o evento. Tente novamente." };
  }

  revalidatePath("/dashboard/eventos/novo");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
}

export async function updateEvent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  const parsed = updateEventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { id, title, date, time, capacity } = parsed.data;
  const startsAt = wallClockToDate(date, time);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Data ou horário inválido" };
  }

  const dressCode = formData
    .getAll("dressCode")
    .map((value) => String(value).trim())
    .filter(Boolean);

  try {
    await prisma.event.update({
      where: { id },
      data: { title, startsAt, capacity, dressCode },
    });
  } catch {
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidatePath("/dashboard/eventos/novo");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
}

export async function deleteEvent(id: string): Promise<{ error?: string } | undefined> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  try {
    await prisma.event.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir o evento. Tente novamente." };
  }
  revalidatePath("/dashboard/eventos/novo");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
}

const uniformSchema = z.object({
  name: z.string().min(1, "Informe o nome do uniforme"),
});

const updateUniformSchema = uniformSchema.extend({
  id: z.string().min(1),
});

export async function createUniform(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  const parsed = uniformSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.uniform.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return { error: "Já existe um uniforme com esse nome" };
  }

  await prisma.uniform.create({ data: { name: parsed.data.name } });
  revalidatePath("/dashboard/eventos/novo");
}

export async function updateUniform(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  const parsed = updateUniformSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { id, name } = parsed.data;

  const existing = await prisma.uniform.findUnique({ where: { name } });
  if (existing && existing.id !== id) {
    return { error: "Já existe um uniforme com esse nome" };
  }

  await prisma.uniform.update({ where: { id }, data: { name } });
  revalidatePath("/dashboard/eventos/novo");
}

export async function deleteUniform(id: string): Promise<{ error?: string } | undefined> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  try {
    await prisma.uniform.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir o uniforme. Tente novamente." };
  }
  revalidatePath("/dashboard/eventos/novo");
}

const noticeSchema = z
  .object({
    message: z.string().min(1, "Escreva o aviso"),
    visibleFrom: z.string().min(1, "Informe a data de início"),
    visibleUntil: z.string().min(1, "Informe a data de saída"),
  })
  .refine((data) => data.visibleUntil >= data.visibleFrom, {
    message: "A data de saída deve ser igual ou posterior à data de início",
    path: ["visibleUntil"],
  });

const updateNoticeSchema = z
  .object({
    id: z.string().min(1),
    message: z.string().min(1, "Escreva o aviso"),
    visibleFrom: z.string().min(1, "Informe a data de início"),
    visibleUntil: z.string().min(1, "Informe a data de saída"),
  })
  .refine((data) => data.visibleUntil >= data.visibleFrom, {
    message: "A data de saída deve ser igual ou posterior à data de início",
    path: ["visibleUntil"],
  });

export async function createNotice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  const parsed = noticeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const session = await auth();
  const author = session?.user?.name ?? "Desconhecido";
  const { message, visibleFrom, visibleUntil } = parsed.data;

  await prisma.notice.create({
    data: {
      message,
      author,
      visibleFrom: wallClockToDate(visibleFrom, "00:00"),
      visibleUntil: wallClockToDate(visibleUntil, "23:59"),
    },
  });
  revalidatePath("/dashboard/eventos/novo");
  revalidatePath("/dashboard");
}

export async function updateNotice(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  const parsed = updateNoticeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { id, message, visibleFrom, visibleUntil } = parsed.data;
  await prisma.notice.update({
    where: { id },
    data: {
      message,
      visibleFrom: wallClockToDate(visibleFrom, "00:00"),
      visibleUntil: wallClockToDate(visibleUntil, "23:59"),
    },
  });
  revalidatePath("/dashboard/eventos/novo");
  revalidatePath("/dashboard");
}

export async function deleteNotice(id: string): Promise<{ error?: string } | undefined> {
  const denied = await adminActionError();
  if (denied) return { error: denied };

  try {
    await prisma.notice.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir o aviso. Tente novamente." };
  }
  revalidatePath("/dashboard/eventos/novo");
  revalidatePath("/dashboard");
}

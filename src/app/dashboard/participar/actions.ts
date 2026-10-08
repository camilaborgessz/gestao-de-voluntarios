"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { initialReminderMarks } from "@/lib/reminders";

export type ParticipationResult = { error?: string } | undefined;

function revalidateEventPages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/eventos/novo");
}

/** Volunteer takes one spot (vaga) in the event, alone or together with their spouse. */
export async function joinEvent(
  eventId: string,
  helpMode: "INDIVIDUAL" | "COUPLE" = "INDIVIDUAL",
  spouseNameInput = "",
): Promise<ParticipationResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sessão expirada, faça login novamente" };
  const userId = session.user.id;

  const spouseName = helpMode === "COUPLE" ? spouseNameInput.trim().slice(0, 120) : "";
  if (helpMode === "COUPLE" && !spouseName) return { error: "Informe o nome do cônjuge" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          capacity: true,
          startsAt: true,
          _count: { select: { enrollments: { where: { status: "CONFIRMED" } } } },
        },
      });
      if (!event) return "Evento não encontrado";

      const existing = await tx.enrollment.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      if (existing?.status === "CONFIRMED") return "Você já está participando deste evento";
      if (event._count.enrollments >= event.capacity) return "Não há mais vagas neste evento";
      const reminderMarks = initialReminderMarks(event.startsAt);

      if (existing) {
        await tx.enrollment.update({
          where: { id: existing.id },
          data: { status: "CONFIRMED", helpMode, spouseName: spouseName || null, ...reminderMarks },
        });
      } else {
        await tx.enrollment.create({
          data: { userId, eventId, status: "CONFIRMED", helpMode, spouseName: spouseName || null, ...reminderMarks },
        });
      }
      // Remember the spouse on the profile so the next signup comes pre-filled.
      if (spouseName) {
        await tx.user.updateMany({ where: { id: userId, spouseName: null }, data: { spouseName } });
      }
      return null;
    });
    if (result) return { error: result };
  } catch {
    return { error: "Não foi possível confirmar sua participação. Tente novamente." };
  }

  revalidateEventPages();
}

/** Volunteer gives the spot back. */
export async function leaveEvent(eventId: string): Promise<ParticipationResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sessão expirada, faça login novamente" };

  try {
    await prisma.enrollment.deleteMany({ where: { userId: session.user.id, eventId } });
  } catch {
    return { error: "Não foi possível cancelar sua participação. Tente novamente." };
  }

  revalidateEventPages();
}

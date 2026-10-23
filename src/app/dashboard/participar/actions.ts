"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { initialReminderMarks, notifyLeadersOfSignup } from "@/lib/notifications";

export type ParticipationResult = { error?: string } | undefined;

function revalidateEventPages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/eventos/novo");
}

/** Volunteer signs up for the event. There is no limit: the event's capacity is only a goal (meta). */
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

  let signedUp: { title: string; startsAt: Date } | null = null;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          title: true,
          startsAt: true,
        },
      });
      if (!event) return "Evento não encontrado";

      const existing = await tx.enrollment.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      if (existing?.status === "CONFIRMED") return "Você já está participando deste evento";
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
      return { event };
    });
    if (typeof result === "string") return { error: result };
    signedUp = result.event;
  } catch {
    return { error: "Não foi possível confirmar sua participação. Tente novamente." };
  }

  if (signedUp) {
    await notifyLeadersOfSignup({
      volunteerName: session.user.name ?? "Um voluntário",
      spouseName: spouseName || null,
      eventId,
      eventTitle: signedUp.title,
      startsAt: signedUp.startsAt,
    });
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

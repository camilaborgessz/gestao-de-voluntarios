"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminActionError } from "@/lib/auth-guards";

const scheduleSchema = z.object({
  heading: z.string().max(80),
  note: z.string().max(1000, "O aviso pode ter no máximo 1000 caracteres"),
  slots: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().trim().min(1, "Toda entrada precisa de um nome").max(80),
        location: z.string().trim().max(120),
        enrollmentIds: z.array(z.string()),
      }),
    )
    .max(30, "Máximo de 30 entradas"),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;

export type SaveScheduleResult =
  | { ok: true; idMap: Record<string, string> }
  | { ok: false; error: string };

/**
 * Saves the whole schedule of an event at once: the event note, the entries (slots)
 * and which volunteer sits in which entry. Slots created on the client come with a
 * temporary `new-…` id; the returned `idMap` translates those to the real ids.
 */
export async function saveSchedule(eventId: string, input: ScheduleInput): Promise<SaveScheduleResult> {
  const denied = await adminActionError();
  if (denied) return { ok: false, error: denied };

  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { note, slots, heading } = parsed.data;

  try {
    const idMap = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({ where: { id: eventId }, select: { id: true } });
        if (!event) throw new Error("EVENT_NOT_FOUND");

        const existing = await tx.eventSlot.findMany({ where: { eventId }, select: { id: true } });
        const existingIds = new Set(existing.map((slot) => slot.id));
        const keptIds = new Set(slots.map((slot) => slot.id).filter((id) => existingIds.has(id)));

        const removedIds = [...existingIds].filter((id) => !keptIds.has(id));
        if (removedIds.length > 0) {
          await tx.eventSlot.deleteMany({ where: { id: { in: removedIds } } });
        }

        const confirmed = await tx.enrollment.findMany({
          where: { eventId, status: "CONFIRMED" },
          select: { id: true },
        });
        const validEnrollments = new Set(confirmed.map((enrollment) => enrollment.id));

        // Everyone goes back to the "not placed" pool, then gets placed again below.
        await tx.enrollment.updateMany({ where: { eventId }, data: { slotId: null, position: 0 } });

        const idMap: Record<string, string> = {};
        const placed = new Set<string>();

        for (const [order, slot] of slots.entries()) {
          const data = { label: slot.label, location: slot.location || null, order };
          let slotId = slot.id;
          if (existingIds.has(slot.id)) {
            await tx.eventSlot.update({ where: { id: slot.id }, data });
          } else {
            const created = await tx.eventSlot.create({ data: { ...data, eventId } });
            slotId = created.id;
            idMap[slot.id] = created.id;
          }

          const ids = slot.enrollmentIds.filter((id) => validEnrollments.has(id) && !placed.has(id));
          for (const [position, enrollmentId] of ids.entries()) {
            placed.add(enrollmentId);
            await tx.enrollment.update({ where: { id: enrollmentId }, data: { slotId, position } });
          }
        }

        await tx.event.update({ where: { id: eventId }, data: { note: note.trim() || null, scheduleTitle: heading.trim() || null } });
        return idMap;
      },
      { timeout: 30_000, maxWait: 10_000 },
    );

    revalidatePath(`/dashboard/escala/${eventId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/agenda");
    return { ok: true, idMap };
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
      return { ok: false, error: "Evento não encontrado" };
    }
    return { ok: false, error: "Não foi possível salvar a escala. Tente novamente." };
  }
}

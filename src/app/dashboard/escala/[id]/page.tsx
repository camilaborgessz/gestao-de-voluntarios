import { notFound } from "next/navigation";
import { BackButton } from "@/components/dashboard/back-button";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth-guards";
import { DEFAULT_SCHEDULE_TITLE, DEFAULT_SLOTS, NEW_SLOT_PREFIX } from "@/lib/schedule-defaults";
import { ScheduleBoard, type SchedulePerson, type ScheduleSlot } from "@/components/dashboard/schedule-board";

export default async function EscalaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      slots: { orderBy: { order: "asc" } },
      enrollments: {
        where: { status: "CONFIRMED" },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: { user: { select: { name: true, spouseName: true } } },
      },
    },
  });
  if (!event) notFound();

  const toPerson = (enrollment: (typeof event.enrollments)[number]): SchedulePerson => ({
    enrollmentId: enrollment.id,
    name: enrollment.user.name,
    couple: enrollment.helpMode === "COUPLE",
    spouseName: enrollment.spouseName ?? enrollment.user.spouseName,
  });

  // Events without a schedule yet start from the default entries; they are only saved on "Salvar".
  const slots: ScheduleSlot[] =
    event.slots.length > 0
      ? event.slots.map((slot) => ({
          id: slot.id,
          label: slot.label,
          location: slot.location ?? "",
          people: event.enrollments.filter((e) => e.slotId === slot.id).map(toPerson),
        }))
      : DEFAULT_SLOTS.map((slot, index) => ({
          id: `${NEW_SLOT_PREFIX}default-${index}`,
          label: slot.label,
          location: slot.location,
          people: [],
        }));

  const slotIds = new Set(event.slots.map((slot) => slot.id));
  const pool = event.enrollments.filter((e) => !e.slotId || !slotIds.has(e.slotId)).map(toPerson);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackButton className="mb-2" />
        <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Gerenciar escala</h1>
      </div>

      <ScheduleBoard
        eventId={event.id}
        title={event.title}
        startsAt={event.startsAt}
        dressCode={event.dressCode}
        initialNote={event.note ?? ""}
        initialHeading={event.scheduleTitle ?? DEFAULT_SCHEDULE_TITLE}
        initialSlots={slots}
        initialPool={pool}
      />
    </div>
  );
}

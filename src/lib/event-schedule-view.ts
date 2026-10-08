import { personChipText } from "@/lib/schedule-image";

/** Read-only view of an event's schedule (escala), shown to volunteers in the event details. */
export interface EventScheduleView {
  label: string;
  location: string;
  people: { text: string; couple: boolean }[];
}

/** Prisma `slots` args that load everything `toScheduleView` needs. */
export const scheduleSlotsArgs = {
  orderBy: { order: "asc" },
  select: {
    label: true,
    location: true,
    enrollments: {
      where: { status: "CONFIRMED" },
      orderBy: { position: "asc" },
      select: {
        helpMode: true,
        spouseName: true,
        user: { select: { name: true, spouseName: true } },
      },
    },
  },
} as const;

interface SlotRow {
  label: string;
  location: string | null;
  enrollments: {
    helpMode: "INDIVIDUAL" | "COUPLE";
    spouseName: string | null;
    user: { name: string; spouseName: string | null };
  }[];
}

/** Only entries that already have someone placed are shown. */
export function toScheduleView(slots: SlotRow[]): EventScheduleView[] {
  return slots
    .filter((slot) => slot.enrollments.length > 0)
    .map((slot) => ({
      label: slot.label,
      location: slot.location ?? "",
      people: slot.enrollments.map((enrollment) => {
        const couple = enrollment.helpMode === "COUPLE";
        return {
          couple,
          text: personChipText({
            name: enrollment.user.name,
            couple,
            spouseName: enrollment.spouseName ?? enrollment.user.spouseName,
          }),
        };
      }),
    }));
}

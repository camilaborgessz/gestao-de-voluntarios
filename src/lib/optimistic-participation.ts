import type { EventRecord } from "@/components/dashboard/event-management";

export interface ParticipationUpdate {
  id: string;
  joined: boolean;
  mode: "INDIVIDUAL" | "COUPLE";
}

/**
 * Shows a volunteer's "Participar" / "cancelar" right away, before the server answers:
 * flips `joined` and moves the filled-spots counter. If the action fails the real data
 * comes back unchanged and the screen returns to what it was.
 */
export function applyParticipation(events: EventRecord[], update: ParticipationUpdate): EventRecord[] {
  return events.map((event) => {
    if (event.id !== update.id || !!event.joined === update.joined) return event;
    return {
      ...event,
      joined: update.joined,
      joinedMode: update.joined ? update.mode : undefined,
      filled: Math.max(0, (event.filled ?? 0) + (update.joined ? 1 : -1)),
    };
  });
}

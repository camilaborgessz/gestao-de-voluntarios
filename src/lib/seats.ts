/** Spots (vagas) an enrollment takes: a couple is two people, so it takes two. */
export const SEATS_PER_MODE = { INDIVIDUAL: 1, COUPLE: 2 } as const;

export type SeatMode = keyof typeof SEATS_PER_MODE;

export function seatsFor(mode: SeatMode | null | undefined) {
  return SEATS_PER_MODE[mode ?? "INDIVIDUAL"];
}

/** Total spots taken by a list of confirmed enrollments. */
export function seatsTaken(enrollments: { helpMode: SeatMode }[]) {
  return enrollments.reduce((sum, enrollment) => sum + seatsFor(enrollment.helpMode), 0);
}

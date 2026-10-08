/** Entradas sugeridas quando o evento ainda não tem escala. A líder pode editar, adicionar e remover. */
export const DEFAULT_SLOTS: { label: string; location: string }[] = [
  { label: "ENTRADA 4 e 5", location: "Nave esquerda" },
  { label: "ENTRADA 6", location: "Nave esquerda/Secretaria" },
  { label: "ENTRADA 7", location: "Nave esquerda/lateral/central" },
  { label: "ENTRADA 8", location: "Nave esquerda/lateral (Coral)" },
];

/** Heading printed at the top of the schedule image unless the leader changes it. */
export const DEFAULT_SCHEDULE_TITLE = "RECEPÇÃO TEMPLO SEDE";

export const NEW_SLOT_PREFIX = "new-";

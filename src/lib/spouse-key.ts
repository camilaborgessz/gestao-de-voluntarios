/** Same spouse, however it was typed: "Melk", " melk ", "MELK" -> "melk" (accents ignored too). */
export function spouseKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

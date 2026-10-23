import { wallClockNow } from "@/lib/event-schedule";
import { VERSES } from "@/lib/verses-arc";

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

/**
 * One verse per day (Almeida Revista e Corrigida), the same for everyone, rotating through the list.
 * The texts are stored in the project, so there is no outside service to fail or change the wording.
 */
export async function getVerseOfTheDay() {
  const { reference, text } = VERSES[dayOfYear(wallClockNow()) % VERSES.length];
  return { verse: text, reference };
}

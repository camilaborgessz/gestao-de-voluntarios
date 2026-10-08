import { wallClockNow } from "@/lib/event-schedule";

const REFERENCES = [
  { book: "josue", chapter: 1, verse: 9, label: "Josué 1:9" },
  { book: "salmos", chapter: 23, verse: 1, label: "Salmos 23:1" },
  { book: "salmos", chapter: 27, verse: 1, label: "Salmos 27:1" },
  { book: "salmos", chapter: 46, verse: 1, label: "Salmos 46:1" },
  { book: "salmos", chapter: 91, verse: 1, label: "Salmos 91:1" },
  { book: "proverbios", chapter: 3, verse: 5, label: "Provérbios 3:5" },
  { book: "isaias", chapter: 41, verse: 10, label: "Isaías 41:10" },
  { book: "isaias", chapter: 40, verse: 31, label: "Isaías 40:31" },
  { book: "jeremias", chapter: 29, verse: 11, label: "Jeremias 29:11" },
  { book: "mateus", chapter: 6, verse: 33, label: "Mateus 6:33" },
  { book: "mateus", chapter: 11, verse: 28, label: "Mateus 11:28" },
  { book: "joao", chapter: 3, verse: 16, label: "João 3:16" },
  { book: "joao", chapter: 14, verse: 27, label: "João 14:27" },
  { book: "romanos", chapter: 8, verse: 28, label: "Romanos 8:28" },
  { book: "romanos", chapter: 12, verse: 2, label: "Romanos 12:2" },
  { book: "filipenses", chapter: 4, verse: 6, label: "Filipenses 4:6" },
  { book: "filipenses", chapter: 4, verse: 13, label: "Filipenses 4:13" },
  { book: "1-corintios", chapter: 13, verse: 4, label: "1 Coríntios 13:4" },
  { book: "2-timoteo", chapter: 1, verse: 7, label: "2 Timóteo 1:7" },
  { book: "tiago", chapter: 1, verse: 5, label: "Tiago 1:5" },
  { book: "1-pedro", chapter: 5, verse: 7, label: "1 Pedro 5:7" },
  { book: "deuteronomio", chapter: 31, verse: 6, label: "Deuteronômio 31:6" },
  { book: "hebreus", chapter: 11, verse: 1, label: "Hebreus 11:1" },
  { book: "hebreus", chapter: 13, verse: 5, label: "Hebreus 13:5" },
  { book: "marcos", chapter: 11, verse: 24, label: "Marcos 11:24" },
  { book: "lucas", chapter: 1, verse: 37, label: "Lucas 1:37" },
  { book: "efesios", chapter: 2, verse: 8, label: "Efésios 2:8" },
  { book: "galatas", chapter: 6, verse: 9, label: "Gálatas 6:9" },
  { book: "apocalipse", chapter: 21, verse: 4, label: "Apocalipse 21:4" },
  { book: "colossenses", chapter: 3, verse: 23, label: "Colossenses 3:23" },
  { book: "atos", chapter: 1, verse: 8, label: "Atos 1:8" },
  { book: "1-joao", chapter: 4, verse: 19, label: "1 João 4:19" },
] as const;

const FALLBACK = {
  verse:
    "Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar",
  reference: "Josué 1:9",
};

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

export async function getVerseOfTheDay() {
  const reference = REFERENCES[dayOfYear(wallClockNow()) % REFERENCES.length];

  try {
    const res = await fetch(
      `https://api.midvash.com/v1/nvi/${reference.book}/${reference.chapter}/${reference.verse}`,
      { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return FALLBACK;

    const { data } = await res.json();
    const text = data?.text?.trim().replace(/^[“"']+|[”"']+$/g, "");
    if (!text) return FALLBACK;

    return { verse: text, reference: reference.label };
  } catch {
    return FALLBACK;
  }
}

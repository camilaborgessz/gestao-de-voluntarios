import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { CalendarGrid, type CalendarDay } from "@/components/dashboard/calendar-grid";

const weeks: CalendarDay[][] = [
  [
    { day: 31, muted: true, weekend: true },
    { day: 1, events: [{ title: "Culto de Ensino", filled: 1, capacity: 10 }] },
    { day: 2 },
    { day: 3, events: [{ title: "Culto de Ensino", filled: 5, capacity: 10 }] },
    { day: 4 },
    { day: 5 },
    { day: 6, weekend: true, events: [{ title: "Culto de Ensino", filled: 10, capacity: 10 }] },
  ],
  [
    { day: 7, weekend: true },
    { day: 8, events: [{ title: "Culto de Ensino", filled: 1, capacity: 10 }] },
    { day: 9 },
    { day: 10, events: [{ title: "Culto de Ensino", filled: 5, capacity: 10 }] },
    { day: 11 },
    { day: 12 },
    { day: 13, weekend: true, events: [{ title: "Culto de Ensino", filled: 10, capacity: 10 }] },
  ],
  [
    { day: 14, weekend: true },
    { day: 15 },
    { day: 16 },
    { day: 17 },
    { day: 18 },
    { day: 19 },
    { day: 20, weekend: true },
  ],
  [
    { day: 21, weekend: true },
    { day: 22 },
    { day: 23 },
    { day: 24 },
    { day: 25 },
    { day: 26 },
    { day: 27, weekend: true },
  ],
  [
    { day: 28, weekend: true },
    { day: 29 },
    { day: 30 },
    { day: 1, muted: true },
    { day: 2, muted: true },
    { day: 3, muted: true },
    { day: 4, muted: true, weekend: true },
  ],
];

export default function AgendaPage() {
  const eventCount = weeks.flat().reduce((sum, day) => sum + (day.events?.length ?? 0), 0);
  const today = new Date().getDate();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Calendário e escalas</h1>
        <button className="flex items-center gap-2 rounded-full border border-ink bg-brand px-5 py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:bg-brand-dark active:scale-95">
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="rounded-[10px] bg-surface p-6 shadow-[0_4px_30px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-semibold text-ink">Abril</h2>
          <button
            title="Mês anterior"
            className="rounded-full p-0.5 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            title="Próximo mês"
            className="rounded-full p-0.5 text-ink/70 transition duration-150 ease-out hover:scale-125 hover:text-ink active:scale-90"
          >
            <ChevronRight size={16} />
          </button>
          <span className="flex size-6 items-center justify-center rounded-full bg-lime-from/70 text-xs font-medium text-brand">
            {eventCount}
          </span>
        </div>

        <CalendarGrid weeks={weeks} today={today} />
      </div>
    </div>
  );
}

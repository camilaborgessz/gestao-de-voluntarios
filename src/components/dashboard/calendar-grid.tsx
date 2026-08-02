import { MoreVertical } from "lucide-react";

export interface CalendarEvent {
  title: string;
  filled: number;
  capacity: number;
}

export interface CalendarDay {
  day: number;
  muted?: boolean;
  weekend?: boolean;
  events?: CalendarEvent[];
}

type Status = "danger" | "warning" | "success";

const statusDot: Record<Status, string> = {
  danger: "from-danger-from to-danger-to",
  warning: "from-warning-from to-warning-to",
  success: "from-success-from to-success-to",
};

function getStatus(filled: number, capacity: number): Status {
  const ratio = filled / capacity;
  if (ratio >= 1) return "success";
  if (ratio >= 0.5) return "warning";
  return "danger";
}

function cornerClass(weekIndex: number, dayIndex: number, weekCount: number) {
  if (weekIndex === 0 && dayIndex === 0) return "rounded-tl-[10px]";
  if (weekIndex === 0 && dayIndex === 6) return "rounded-tr-[10px]";
  if (weekIndex === weekCount - 1 && dayIndex === 0) return "rounded-bl-[10px]";
  if (weekIndex === weekCount - 1 && dayIndex === 6) return "rounded-br-[10px]";
  return "";
}

export function CalendarGrid({ weeks }: { weeks: CalendarDay[][] }) {
  return (
    <div className="grid grid-cols-7">
      {weeks.map((week, weekIndex) =>
        week.map((cell, dayIndex) => (
          <div
            key={`${weekIndex}-${dayIndex}`}
            className={`relative min-h-[190px] border-[0.5px] border-[#a0d0c8] p-2 ${
              cell.weekend ? "bg-[#e5f0ef]" : "bg-[#faf9f9]"
            } ${cell.muted ? "opacity-40" : ""} ${cornerClass(weekIndex, dayIndex, weeks.length)}`}
          >
            <span className="absolute top-2 right-2 z-10 flex size-[26px] items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-sm font-medium text-ink shadow-sm">
              {cell.day}
            </span>

            <div className="mt-8 flex flex-col gap-1.5">
              {cell.events?.map((event, i) => {
                const status = getStatus(event.filled, event.capacity);
                return (
                  <div
                    key={i}
                    className="group relative flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand-dark py-2 pl-2.5 pr-1 transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(2,87,92,0.35)]"
                  >
                    <span className={`size-2 shrink-0 rounded-full bg-gradient-to-b ${statusDot[status]}`} />
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="truncate text-[14px] font-bold leading-tight text-white">{event.title}</p>
                      <p className="truncate text-[12px] font-semibold leading-tight text-white/95">
                        {event.filled}/{event.capacity} voluntários
                      </p>
                    </div>
                    <button
                      title="Opções"
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 transition duration-150 ease-out hover:scale-110 hover:bg-white/10 hover:text-white active:scale-95"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )),
      )}
    </div>
  );
}

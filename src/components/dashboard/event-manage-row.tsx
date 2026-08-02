import { Trash2, Pencil, Eye } from "lucide-react";

export interface EventManageRowProps {
  date: string;
  weekday: string;
  time: string;
  title: string;
  tags: string[];
}

const actions = [
  { label: "Apagar", icon: Trash2 },
  { label: "Editar", icon: Pencil },
  { label: "Visualizar", icon: Eye },
];

export function EventManageRow({ date, weekday, time, title, tags }: EventManageRowProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-brand/[0.17] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] sm:min-h-[106px] sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-4 sm:w-[150px] sm:flex-col sm:items-center sm:gap-2 sm:text-center">
        <p className="font-display text-4xl font-bold leading-none text-ink">{date}</p>
        <span className="rounded-full bg-gradient-to-r from-success-from to-success-to px-4 py-1.5 font-display text-sm font-bold text-white">
          {weekday} - {time}
        </span>
      </div>

      <div className="hidden h-[80px] w-0.5 rounded-full bg-brand sm:block" />

      <div className="flex-1">
        <p className="text-base font-medium text-ink">{title}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-3 py-1.5 text-xs font-semibold text-white"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 justify-center gap-2">
        {actions.map(({ label, icon: Icon }) => (
          <button
            key={label}
            title={label}
            className="flex size-9 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
          >
            <Icon size={18} strokeWidth={2.5} />
          </button>
        ))}
      </div>
    </div>
  );
}

import { Eye } from "lucide-react";

export interface EventManageRowProps {
  date: string;
  weekday: string;
  time: string;
  title: string;
  tags: string[];
  onView?: () => void;
}

export function EventManageRow({
  date,
  weekday,
  time,
  title,
  tags,
  onView,
}: EventManageRowProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-brand/[0.17] bg-surface p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-surface-raised dark:shadow-[0_4px_18px_rgba(0,0,0,0.35)] sm:min-h-[120px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
      <div className="flex items-center gap-4 sm:w-[170px] sm:flex-col sm:items-center sm:gap-2 sm:text-center">
        <p className="font-display text-4xl font-bold leading-none text-ink lg:text-5xl">{date}</p>
        <span className="rounded-full bg-gradient-to-r from-success-from to-success-to px-4 py-1.5 font-display text-sm font-bold text-white lg:text-base">
          {weekday} - {time}
        </span>
      </div>

      <div className="hidden h-[90px] w-0.5 rounded-full bg-brand dark:bg-white/15 sm:block" />

      <div className="min-w-[150px] flex-1">
        <p className="text-lg font-medium text-ink lg:text-xl">{title}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gradient-to-r from-brand to-brand-dark dark:bg-none dark:bg-lime-from/20 dark:text-lime-from px-3 py-1.5 text-xs font-semibold text-white lg:text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full shrink-0 sm:ml-auto sm:w-[170px]">
        <button
              type="button"
              onClick={onView}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-lime-from to-lime-to px-4 text-sm font-bold text-brand shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition duration-150 ease-out hover:scale-[1.03] hover:brightness-95 active:scale-95"
            >
              <Eye size={16} strokeWidth={2.5} />
              Ver detalhes
            </button>
      </div>
    </div>
  );
}

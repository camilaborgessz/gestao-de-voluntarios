import { Download, Trash2, Pencil, Eye } from "lucide-react";

type EventStatus = "danger" | "warning" | "success";

export interface EventCardProps {
  date: string;
  weekday: string;
  time: string;
  title: string;
  tags: string[];
  filled: number;
  capacity: number;
  isAdmin?: boolean;
}

const statusConfig: Record<
  EventStatus,
  { label: string; text: string; bar: string }
> = {
  danger: {
    label: "Faltam voluntários!",
    text: "text-danger-to",
    bar: "from-danger-from to-danger-to",
  },
  warning: {
    label: "Quase lá!",
    text: "text-warning-to",
    bar: "from-warning-from to-warning-to",
  },
  success: {
    label: "Meta batida!",
    text: "text-success-to",
    bar: "from-success-from to-success-to",
  },
};

function getStatus(filled: number, capacity: number): EventStatus {
  const ratio = filled / capacity;
  if (ratio >= 1) return "success";
  if (ratio >= 0.5) return "warning";
  return "danger";
}

const adminActions = [
  { label: "Baixar", icon: Download },
  { label: "Apagar", icon: Trash2 },
  { label: "Editar", icon: Pencil },
  { label: "Visualizar", icon: Eye },
];

export function EventCard({
  date,
  weekday,
  time,
  title,
  tags,
  filled,
  capacity,
  isAdmin = false,
}: EventCardProps) {
  const status = getStatus(filled, capacity);
  const config = statusConfig[status];
  const progress = Math.min(100, (filled / capacity) * 100);

  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-brand/[0.17] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:min-h-[120px] sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-4 sm:w-[170px] sm:flex-col sm:items-center sm:gap-2 sm:text-center">
        <p className="font-display text-4xl font-bold leading-none text-ink lg:text-5xl">
          {date}
        </p>
        <span className="rounded-full bg-gradient-to-r from-success-from to-success-to px-4 py-1.5 font-display text-sm font-bold text-white lg:text-base">
          {weekday} - {time}
        </span>
      </div>

      <div className="hidden h-[90px] w-0.5 rounded-full bg-brand sm:block" />

      <div className="flex-1">
        <p className="text-lg font-medium text-ink lg:text-xl">{title}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-3 py-1.5 text-xs font-semibold text-white lg:text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-1.5 sm:w-[170px]">
        <span className={`text-xs font-medium lg:text-sm ${config.text}`}>
          {config.label}
        </span>
        <div className="relative h-5 w-full overflow-hidden rounded-full bg-track">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${config.bar}`}
            style={{ width: `${progress}%` }}
          />
          <span className="absolute inset-y-0 left-2 flex items-center font-display text-xs font-semibold text-white lg:text-sm">
            {filled}/{capacity}
          </span>
        </div>
        {isAdmin ? (
          <div className="mt-1 flex w-full justify-between">
            {adminActions.map(({ label, icon: Icon }) => (
              <button
                key={label}
                title={label}
                className="flex size-9 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand shadow-[0_2px_6px_rgba(0,0,0,0.12)] hover:brightness-95"
              >
                <Icon size={18} strokeWidth={2.5} />
              </button>
            ))}
          </div>
        ) : (
          <button className="mt-1 w-full rounded-full border border-brand-dark bg-brand py-1.5 text-sm font-semibold text-white hover:bg-brand-dark lg:text-base">
            Participar
          </button>
        )}
      </div>
    </div>
  );
}

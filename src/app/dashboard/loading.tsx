import { Loader2 } from "lucide-react";

/** Shown instantly while any dashboard page is being opened, so a click never looks like nothing happened. */
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-6">
      <div className="h-10 w-72 animate-pulse rounded-full bg-ink/10" />
      <div className="relative flex min-h-[260px] items-center justify-center rounded-[10px] bg-surface shadow-[0_4px_37px_rgba(0,0,0,0.1)]">
        <Loader2 size={32} className="animate-spin text-brand dark:text-lime-from" />
      </div>
    </div>
  );
}

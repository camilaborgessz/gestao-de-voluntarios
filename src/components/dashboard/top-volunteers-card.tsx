"use client";

import { useState } from "react";
import { ShowMoreToggle } from "./show-more-toggle";
import type { TopVolunteer } from "@/lib/leaderboard";

const medal = ["bg-lime-from text-brand", "bg-brand/15 text-brand dark:bg-white/15 dark:text-ink", "bg-warning-from/30 text-ink"];

export function TopVolunteersCard({ volunteers, initialCount = 5 }: { volunteers: TopVolunteer[]; initialCount?: number }) {
  const [expanded, setExpanded] = useState(false);

  const collapsible = volunteers.length > initialCount;
  const visible = collapsible && !expanded ? volunteers.slice(0, initialCount) : volunteers;

  return (
    <div className="flex flex-col gap-3 rounded-[10px] bg-surface p-5 shadow-[0_4px_37px_rgba(0,0,0,0.1)]">
      {volunteers.length === 0 && <p className="text-sm text-ink/60">Ainda sem serviços realizados.</p>}

      <ol id="dashboard-top-volunteers" className="flex flex-col gap-2">
        {visible.map((volunteer) => (
          <li
            key={volunteer.id}
            className="flex items-center gap-3 rounded-[10px] border border-brand/[0.17] px-4 py-2.5 dark:border-white/10"
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                medal[volunteer.rank - 1] ?? "bg-brand/10 text-ink dark:bg-white/10"
              }`}
              title={`${volunteer.rank}º lugar`}
            >
              {volunteer.rank}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{volunteer.name}</span>
            <span className="shrink-0 text-sm font-medium text-ink/70">
              {volunteer.services} {volunteer.services === 1 ? "serviço" : "serviços"}
            </span>
          </li>
        ))}
      </ol>

      {collapsible && (
        <ShowMoreToggle
          expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          moreLabel={`Ver mais (${volunteers.length - initialCount})`}
          controls="dashboard-top-volunteers"
        />
      )}
    </div>
  );
}

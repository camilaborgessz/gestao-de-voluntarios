"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ShowMoreToggle } from "./show-more-toggle";

export interface Notice {
  id?: string;
  message: string;
  postedAt: string;
  author: string;
}

export function NoticesCard({
  notices,
  editable = false,
  initialCount,
  onEdit,
  onDelete,
}: {
  notices: Notice[];
  editable?: boolean;
  /** When set, only this many notices show until the reader expands the list. */
  initialCount?: number;
  onEdit?: (notice: Notice) => void;
  onDelete?: (notice: Notice) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const collapsible = initialCount != null && notices.length > initialCount;
  const visibleNotices = collapsible && !expanded ? notices.slice(0, initialCount) : notices;
  const hiddenCount = notices.length - visibleNotices.length;

  return (
    <div className="flex flex-col gap-3 rounded-[10px] bg-gradient-to-b from-lime-from to-lime-to p-5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] dark:bg-none dark:bg-surface dark:border dark:border-white/10">
      {notices.length === 0 && <p className="text-sm text-ink">Nenhum aviso no momento.</p>}

      <div id="dashboard-notices" className="flex flex-col gap-3">
        {visibleNotices.map((notice, index) => (
          <div
            key={notice.id ?? index}
            className="flex gap-3 rounded-[10px] border border-[#f2f2f2] bg-surface p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-surface-raised dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
          >
            <div className="w-[3px] shrink-0 rounded-full bg-gradient-to-b from-brand to-brand-dark dark:from-lime-from dark:to-lime-to" />
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-sm leading-snug text-ink lg:text-base">{notice.message}</p>
              <p className="text-xs text-ink lg:text-sm">
                <span className="font-bold">Postado em: </span>
                {notice.postedAt}
                <span className="ml-4 font-bold">Autor: </span>
                {notice.author}
              </p>
            </div>
            {editable && (
              <div className="flex shrink-0 items-start gap-1.5">
                <button
                  title="Apagar"
                  onClick={() => onDelete?.(notice)}
                  className="flex size-7 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  title="Editar"
                  onClick={() => onEdit?.(notice)}
                  className="flex size-7 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {collapsible && (
        <ShowMoreToggle
          expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          moreLabel={`Ver mais (${hiddenCount})`}
          controls="dashboard-notices"
        />
      )}
    </div>
  );
}

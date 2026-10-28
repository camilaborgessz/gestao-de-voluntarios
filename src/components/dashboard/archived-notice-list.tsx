"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { formatShortDate } from "@/lib/event-schedule";
import { ConfirmDialog } from "./confirm-dialog";
import { deleteNotice } from "@/app/dashboard/eventos/novo/actions";

export interface ArchivedNotice {
  id: string;
  message: string;
  visibleUntil: Date;
  daysLeft: number;
}

const rowClass =
  "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-brand/[0.17] bg-surface px-4 py-3 dark:border-white/10 dark:bg-surface-raised";

function ExpiryPill({ days }: { days: number }) {
  const soon = days <= 3;
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        soon ? "bg-warning-from/30 text-ink" : "bg-brand/10 text-brand dark:bg-white/10 dark:text-lime-from"
      }`}
    >
      {days <= 1 ? "Some em breve" : `Some em ${days} dias`}
    </span>
  );
}

/** Archived notices, each with a button to delete it for good. */
export function ArchivedNoticeList({ notices }: { notices: ArchivedNotice[] }) {
  const [deleting, setDeleting] = useState<ArchivedNotice | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    const { id } = deleting;
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteNotice(id);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleting(null);
    });
  }

  return (
    <>
      {notices.map((notice) => (
        <div key={notice.id} className={rowClass}>
          <div className="w-20 shrink-0 text-center">
            <p className="text-xs text-ink/60">até</p>
            <p className="font-display text-lg font-bold leading-tight text-ink">{formatShortDate(notice.visibleUntil)}</p>
          </div>
          <div className="hidden h-10 w-0.5 shrink-0 rounded-full bg-brand/60 sm:block dark:bg-white/15" />
          <p className="line-clamp-2 min-w-0 flex-1 basis-36 text-sm text-ink">{notice.message}</p>
          <ExpiryPill days={notice.daysLeft} />
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeleting(notice);
            }}
            title="Excluir definitivamente"
            aria-label="Excluir aviso definitivamente"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-danger-from text-danger-text transition duration-150 ease-out hover:scale-110 hover:bg-danger-from/10 active:scale-95"
          >
            <Trash2 size={17} strokeWidth={2.5} />
          </button>
        </div>
      ))}

      {deleting && (
        <ConfirmDialog
          title="Excluir definitivamente?"
          description="Este aviso será apagado para sempre."
          confirmLabel="Excluir"
          loadingLabel="Excluindo..."
          isLoading={isDeleting}
          error={deleteError}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}

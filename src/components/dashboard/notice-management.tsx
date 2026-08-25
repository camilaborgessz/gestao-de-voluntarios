"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { NoticesCard, type Notice } from "./notices-card";
import { NoticeFormDialog } from "./notice-form-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { deleteNotice } from "@/app/dashboard/eventos/novo/actions";
import { formatShortDate } from "@/lib/event-schedule";

export interface NoticeRecord {
  id: string;
  message: string;
  author: string;
  createdAt: Date;
  visibleFrom: Date;
  visibleUntil: Date;
}

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; notice: NoticeRecord }
  | { mode: "delete"; notice: NoticeRecord };

export function NoticeManagement({ notices }: { notices: NoticeRecord[] }) {
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [isDeleting, startDeleteTransition] = useTransition();

  function confirmDelete() {
    if (dialog.mode !== "delete") return;
    const { notice } = dialog;
    startDeleteTransition(async () => {
      await deleteNotice(notice.id);
      setDialog({ mode: "closed" });
    });
  }

  const displayNotices: Notice[] = notices.map((notice) => ({
    id: notice.id,
    message: notice.message,
    author: notice.author,
    postedAt: formatShortDate(notice.createdAt),
  }));

  function findRecord(id: string | undefined) {
    return notices.find((n) => n.id === id) ?? null;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-medium text-ink lg:text-2xl">Avisos</h2>
        <button
          title="Novo aviso"
          onClick={() => setDialog({ mode: "create" })}
          className="flex size-6 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>

      <NoticesCard
        notices={displayNotices}
        editable
        onEdit={(notice) => {
          const record = findRecord(notice.id);
          if (record) setDialog({ mode: "edit", notice: record });
        }}
        onDelete={(notice) => {
          const record = findRecord(notice.id);
          if (record) setDialog({ mode: "delete", notice: record });
        }}
      />

      {(dialog.mode === "create" || dialog.mode === "edit") && (
        <NoticeFormDialog
          notice={dialog.mode === "edit" ? dialog.notice : null}
          onClose={() => setDialog({ mode: "closed" })}
        />
      )}

      {dialog.mode === "delete" && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir esse aviso?"
          isLoading={isDeleting}
          onCancel={() => setDialog({ mode: "closed" })}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { UserTable, type UserRecord } from "./user-table";
import { UserFormDialog } from "./user-form-dialog";
import { UserViewDialog } from "./user-view-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { deleteUser } from "@/app/dashboard/voluntarios/actions";

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; user: UserRecord }
  | { mode: "view"; user: UserRecord }
  | { mode: "delete"; user: UserRecord };

export function UserManagement({ users }: { users: UserRecord[] }) {
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [isDeleting, startDeleteTransition] = useTransition();

  function confirmDelete() {
    if (dialog.mode !== "delete") return;
    const { user } = dialog;
    startDeleteTransition(async () => {
      await deleteUser(user.id);
      setDialog({ mode: "closed" });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Gerenciar usuários</h1>
        <button
          onClick={() => setDialog({ mode: "create" })}
          className="flex items-center gap-2 rounded-full border border-ink bg-brand px-5 py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:bg-brand-dark active:scale-95"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      <UserTable
        users={users}
        onEdit={(user) => setDialog({ mode: "edit", user })}
        onView={(user) => setDialog({ mode: "view", user })}
        onDelete={(user) => setDialog({ mode: "delete", user })}
      />

      {(dialog.mode === "create" || dialog.mode === "edit") && (
        <UserFormDialog
          user={dialog.mode === "edit" ? dialog.user : null}
          onClose={() => setDialog({ mode: "closed" })}
        />
      )}

      {dialog.mode === "view" && (
        <UserViewDialog
          user={dialog.user}
          onClose={() => setDialog({ mode: "closed" })}
          onEdit={() => setDialog({ mode: "edit", user: dialog.user })}
        />
      )}

      {dialog.mode === "delete" && (
        <ConfirmDialog
          message={`Tem certeza que deseja excluir "${dialog.user.name}"?`}
          isLoading={isDeleting}
          onCancel={() => setDialog({ mode: "closed" })}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

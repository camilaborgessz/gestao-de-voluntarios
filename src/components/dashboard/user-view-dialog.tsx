"use client";

import { X, Pencil } from "lucide-react";
import type { UserRecord } from "./user-table";

const roleLabel: Record<UserRecord["role"], string> = {
  ADMIN: "Líder",
  VOLUNTEER: "Voluntário",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export function UserViewDialog({
  user,
  onClose,
  onEdit,
}: {
  user: UserRecord;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[15px] bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Detalhes do usuário</h2>
          <button onClick={onClose} title="Fechar" className="text-ink/60 transition-colors hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="font-medium text-ink/60">Nome completo</dt>
            <dd className="text-ink">{user.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink/60">Email</dt>
            <dd className="text-ink">{user.email}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="font-medium text-ink/60">Nascimento</dt>
              <dd className="text-ink">{formatDate(user.birthDate)}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink/60">Telefone</dt>
              <dd className="text-ink">{user.phone ?? "—"}</dd>
            </div>
          </div>
          <div>
            <dt className="font-medium text-ink/60">Perfil</dt>
            <dd className="text-ink">{roleLabel[user.role]}</dd>
          </div>
        </dl>

        <button
          onClick={onEdit}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-[1.02] active:scale-95"
        >
          <Pencil size={16} />
          Editar
        </button>
      </div>
    </div>
  );
}

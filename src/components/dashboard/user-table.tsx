import { Trash2, Pencil, Eye } from "lucide-react";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  birthDate: Date | null;
  role: "ADMIN" | "VOLUNTEER";
}

const roleLabel: Record<UserRecord["role"], string> = {
  ADMIN: "Líder",
  VOLUNTEER: "Voluntário",
};

const columns = "grid-cols-[1.2fr_1fr_1.3fr_1.6fr_1fr_0.9fr]";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export function UserTable({
  users,
  onEdit,
  onView,
  onDelete,
}: {
  users: UserRecord[];
  onEdit: (user: UserRecord) => void;
  onView: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-brand bg-surface/[0.57] dark:border-white/10 dark:bg-surface">
      <div
        className={`grid ${columns} gap-2 bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-bold text-white`}
      >
        <span>Nome</span>
        <span>Nascimento</span>
        <span>Telefone</span>
        <span>Email</span>
        <span>Perfil</span>
        <span />
      </div>

      <div className="divide-y divide-brand/40 dark:divide-white/10">
        {users.length === 0 && (
          <p className="px-6 py-6 text-sm text-ink/60">Nenhum usuário cadastrado ainda.</p>
        )}

        {users.map((user) => (
          <div
            key={user.id}
            className={`grid ${columns} items-center gap-2 px-6 py-4 transition-colors duration-150 hover:bg-brand/5 dark:hover:bg-white/5`}
          >
            <span className="truncate text-sm font-semibold text-ink">{user.name}</span>
            <span className="truncate text-sm font-medium text-ink">{formatDate(user.birthDate)}</span>
            <span className="truncate text-sm font-medium text-ink">{user.phone ?? "—"}</span>
            <span className="truncate text-sm font-medium text-ink">{user.email}</span>
            <span className="truncate text-sm font-medium text-ink">{roleLabel[user.role]}</span>
            <div className="flex justify-end gap-2">
              <button
                title="Apagar"
                onClick={() => onDelete(user)}
                className="flex size-8 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
              >
                <Trash2 size={15} strokeWidth={2.5} />
              </button>
              <button
                title="Editar"
                onClick={() => onEdit(user)}
                className="flex size-8 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
              >
                <Pencil size={15} strokeWidth={2.5} />
              </button>
              <button
                title="Visualizar"
                onClick={() => onView(user)}
                className="flex size-8 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
              >
                <Eye size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

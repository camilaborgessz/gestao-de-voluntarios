import { Trash2, Pencil, Eye } from "lucide-react";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  birthDate: Date | null;
  role: "ADMIN" | "VOLUNTEER";
  /** Invited, but has not created a password yet. */
  pending: boolean;
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

const actionClass =
  "flex size-8 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95";

function RowActions({
  user,
  onEdit,
  onView,
  onDelete,
}: {
  user: UserRecord;
  onEdit: (user: UserRecord) => void;
  onView: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button title="Apagar" onClick={() => onDelete(user)} className={actionClass}>
        <Trash2 size={15} strokeWidth={2.5} />
      </button>
      <button title="Editar" onClick={() => onEdit(user)} className={actionClass}>
        <Pencil size={15} strokeWidth={2.5} />
      </button>
      <button title="Visualizar" onClick={() => onView(user)} className={actionClass}>
        <Eye size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}

const pendingBadge = (
  <span className="rounded-full bg-warning-from/25 px-2 py-0.5 text-xs font-semibold text-ink">Pendente</span>
);

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
    <>
      {/* Phones: one card per person */}
      <div className="flex flex-col gap-3 md:hidden">
        {users.length === 0 && <p className="text-sm text-ink/60">Nenhum usuário cadastrado</p>}
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-col gap-3 rounded-[10px] border border-brand/40 bg-surface p-4 dark:border-white/10"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-ink">{user.name}</span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-ink dark:bg-white/10">
                {roleLabel[user.role]}
              </span>
              {user.pending && pendingBadge}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-ink/60">Email</dt>
              <dd className="min-w-0 break-words text-ink">{user.email}</dd>
              <dt className="text-ink/60">Telefone</dt>
              <dd className="text-ink">{user.phone ?? "—"}</dd>
              <dt className="text-ink/60">Nascimento</dt>
              <dd className="text-ink">{formatDate(user.birthDate)}</dd>
            </dl>
            <RowActions user={user} onEdit={onEdit} onView={onView} onDelete={onDelete} />
          </div>
        ))}
      </div>

      {/* md and up: the table */}
      <div className="hidden overflow-x-auto rounded-[10px] border border-brand bg-surface/[0.57] dark:border-white/10 dark:bg-surface md:block">
        <div className="min-w-[760px]">
          <div
            className={`grid ${columns} gap-2 bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-bold text-white dark:bg-none dark:bg-surface-raised dark:text-lime-from`}
          >
            <span>Nome</span>
            <span>Nascimento</span>
            <span>Telefone</span>
            <span>Email</span>
            <span>Perfil</span>
            <span />
          </div>

          <div className="divide-y divide-brand/40 dark:divide-white/10">
            {users.length === 0 && <p className="px-6 py-6 text-sm text-ink/60">Nenhum usuário cadastrado</p>}

            {users.map((user) => (
              <div
                key={user.id}
                className={`grid ${columns} items-center gap-2 px-6 py-4 transition-colors duration-150 hover:bg-brand/5 dark:hover:bg-white/5`}
              >
                <span className="truncate text-sm font-semibold text-ink">{user.name}</span>
                <span className="truncate text-sm font-medium text-ink">{formatDate(user.birthDate)}</span>
                <span className="truncate text-sm font-medium text-ink">{user.phone ?? "—"}</span>
                <span className="truncate text-sm font-medium text-ink">{user.email}</span>
                <span className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                  {roleLabel[user.role]}
                  {user.pending && pendingBadge}
                </span>
                <RowActions user={user} onEdit={onEdit} onView={onView} onDelete={onDelete} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

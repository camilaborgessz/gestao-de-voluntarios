import { Trash2, Pencil, Eye } from "lucide-react";

export interface UserRow {
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  role: "Administrador" | "Voluntário";
}

const columns = "grid-cols-[1.2fr_1fr_1.3fr_1.6fr_1fr_0.9fr]";

const rowActions = [
  { label: "Apagar", icon: Trash2 },
  { label: "Editar", icon: Pencil },
  { label: "Visualizar", icon: Eye },
];

export function UserTable({ users }: { users: UserRow[] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-brand bg-white/[0.57]">
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

      <div className="divide-y divide-brand/40">
        {users.map((user, index) => (
          <div key={index} className={`grid ${columns} items-center gap-2 px-6 py-4`}>
            <span className="truncate text-sm font-semibold text-ink">{user.name}</span>
            <span className="truncate text-sm font-medium text-ink">{user.birthDate}</span>
            <span className="truncate text-sm font-medium text-ink">{user.phone}</span>
            <span className="truncate text-sm font-medium text-ink">{user.email}</span>
            <span className="truncate text-sm font-medium text-ink">{user.role}</span>
            <div className="flex justify-end gap-2">
              {rowActions.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  title={label}
                  className="flex size-8 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand shadow-[0_2px_6px_rgba(0,0,0,0.12)] hover:brightness-95"
                >
                  <Icon size={15} strokeWidth={2.5} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Plus } from "lucide-react";
import { UserTable, type UserRow } from "@/components/dashboard/user-table";

const users: UserRow[] = [
  { name: "Rafaela Silva", birthDate: "12/03/2005", phone: "+55 69 98765-4321", email: "rafaela.silva@gmail.com", role: "Administrador" },
  { name: "João Pereira", birthDate: "22/07/1998", phone: "+55 69 99123-4567", email: "joao.pereira@gmail.com", role: "Voluntário" },
  { name: "Camila Borges", birthDate: "09/11/1990", phone: "+55 69 98234-1122", email: "camila.borges@gmail.com", role: "Administrador" },
  { name: "Vanessa Alves", birthDate: "03/05/1994", phone: "+55 69 99876-5432", email: "vanessa.alves@gmail.com", role: "Voluntário" },
  { name: "Lucas Martins", birthDate: "18/09/2000", phone: "+55 69 98345-2211", email: "lucas.martins@gmail.com", role: "Voluntário" },
  { name: "Beatriz Souza", birthDate: "27/01/1997", phone: "+55 69 99456-3344", email: "beatriz.souza@gmail.com", role: "Voluntário" },
];

export default function VoluntariosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Gerenciar usuários</h1>
        <button className="flex items-center gap-2 rounded-full border border-ink bg-brand px-5 py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:bg-brand-dark active:scale-95">
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      <UserTable users={users} />
    </div>
  );
}

import { Pencil } from "lucide-react";
import { auth } from "@/auth";

export default async function PerfilPage() {
  const session = await auth();
  const name = session?.user?.name ?? "Camila Borges";
  const email = session?.user?.email ?? "borgescamila@gmail.com";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-ink lg:text-4xl">Gerenciar perfil</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-medium text-ink lg:text-2xl">Perfil</h2>

          <div className="flex flex-col gap-4 rounded-[15px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <label className="flex flex-col gap-1.5">
              <span className="text-base font-medium text-ink">Nome Completo</span>
              <input
                type="text"
                defaultValue={name}
                className="rounded-[5px] border border-[#6e9193] bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-base font-medium text-ink">Email</span>
              <input
                type="email"
                defaultValue={email}
                className="rounded-[5px] border border-[#6e9193] bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-base font-medium text-ink">Nascimento</span>
                <input
                  type="date"
                  defaultValue="2005-03-16"
                  className="rounded-[5px] border border-[#6e9193] bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-base font-medium text-ink">Telefone</span>
                <input
                  type="tel"
                  defaultValue="(69) 99239-0000"
                  className="rounded-[5px] border border-[#6e9193] bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-brand"
                />
              </label>
            </div>
          </div>

          <button className="mt-4 ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:brightness-110 active:scale-95">
            <Pencil size={16} />
            Editar Perfil
          </button>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-medium text-ink lg:text-2xl">Senha</h2>

          <div className="flex flex-col gap-4 rounded-[15px] bg-gradient-to-b from-brand to-brand-dark p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <label className="flex flex-col gap-1.5">
              <span className="text-base font-semibold text-white">Senha atual</span>
              <input
                type="password"
                defaultValue="password123"
                className="rounded-[5px] border border-[#6e9193] bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-lime-from"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-base font-semibold text-white">Nova senha</span>
              <input
                type="password"
                placeholder="***********"
                className="rounded-[5px] border border-[#6e9193] bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-lime-from"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-base font-semibold text-white">Confirmar nova senha</span>
              <input
                type="password"
                placeholder="***********"
                className="rounded-[5px] border border-[#6e9193] bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-lime-from"
              />
            </label>
          </div>

          <button className="mt-4 ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-bold text-white transition duration-150 ease-out hover:scale-105 hover:brightness-110 active:scale-95">
            <Pencil size={16} />
            Alterar Senha
          </button>
        </section>
      </div>
    </div>
  );
}

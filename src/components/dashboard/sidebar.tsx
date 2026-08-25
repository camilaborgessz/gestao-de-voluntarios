"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  PainelIcon,
  AgendaIcon,
  NovoEventoIcon,
  VoluntariosIcon,
  PerfilIcon,
  LogoutIcon,
} from "./sidebar-icons";
import { NavLinkSpinner } from "./nav-link-spinner";

const navItems = [
  { href: "/dashboard", label: "Painel", icon: PainelIcon },
  { href: "/dashboard/agenda", label: "Agenda", icon: AgendaIcon },
  { href: "/dashboard/eventos/novo", label: "Novo evento", icon: NovoEventoIcon },
  { href: "/dashboard/voluntarios", label: "Voluntários", icon: VoluntariosIcon },
  { href: "/dashboard/perfil", label: "Perfil", icon: PerfilIcon },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-[89px] bottom-0 z-20 flex w-[76px] flex-col items-center text-brand"
      style={{ viewTransitionName: "dash-sidebar" }}
    >
      <div className="flex w-[76px] flex-1 flex-col justify-center">
        <Image src="/sidebar-cap-top.png" alt="" width={76} height={129} className="block" unoptimized />

        <nav className="flex w-full -ml-px flex-col items-center gap-4 bg-brand">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`relative flex size-11 items-center justify-center rounded-2xl transition-all duration-200 ease-out hover:scale-110 active:scale-95 ${
                  active
                    ? "bg-gradient-to-b from-lime-from to-lime-to text-[#1d2326] shadow-md"
                    : "text-lime-from hover:text-lime-to"
                }`}
              >
                <Icon size={22} />
                <NavLinkSpinner />
              </Link>
            );
          })}
        </nav>

        <Image src="/sidebar-cap-bottom.png" alt="" width={76} height={129} className="block" unoptimized />
      </div>

      <button
        title="Sair"
        className="mb-10 flex size-11 items-center justify-center rounded-full bg-success-from/25 text-ink transition-all duration-200 ease-out hover:scale-110 hover:bg-success-from/40 active:scale-95"
      >
        <LogoutIcon size={22} />
      </button>
    </aside>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
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
import { createPortal } from "react-dom";
import { logout } from "@/app/login/actions";
import { ConfirmDialog } from "./confirm-dialog";

const navItems = [
  { href: "/dashboard", label: "Painel", icon: PainelIcon, adminOnly: false },
  { href: "/dashboard/agenda", label: "Calendário e escalas", icon: AgendaIcon, adminOnly: false },
  { href: "/dashboard/eventos/novo", label: "Gestão", icon: NovoEventoIcon, adminOnly: true },
  { href: "/dashboard/voluntarios", label: "Gerenciar usuários", icon: VoluntariosIcon, adminOnly: true },
  { href: "/dashboard/perfil", label: "Gerenciar perfil", icon: PerfilIcon, adminOnly: false },
] as const;

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => role === "ADMIN" || !item.adminOnly);

  // The schedule page has no menu item of its own: keep highlighting the section the user came from.
  const isScheduleRoute = pathname.startsWith("/dashboard/escala");
  const [lastSection, setLastSection] = useState(isScheduleRoute ? "/dashboard/agenda" : pathname);
  if (!isScheduleRoute && lastSection !== pathname) setLastSection(pathname);
  const activePath = isScheduleRoute ? lastSection : pathname;

  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();

  return (
    <aside
      className="fixed left-0 top-[89px] bottom-0 z-20 flex w-[76px] flex-col items-center text-brand"
      style={{ viewTransitionName: "dash-sidebar" }}
    >
      <div className="flex w-[76px] flex-1 flex-col justify-center">
        <Image src="/sidebar-cap-top.png" alt="" width={76} height={129} className="block" unoptimized />

        <nav className="flex w-full -ml-px flex-col items-center gap-4 bg-brand">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = activePath === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
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
        type="button"
        onClick={() => setConfirmingLogout(true)}
        title="Sair"
        aria-label="Sair"
        className="mb-10 flex size-11 items-center justify-center rounded-full bg-success-from/25 text-ink transition-all duration-200 ease-out hover:scale-110 hover:bg-success-from/40 active:scale-95"
      >
        <LogoutIcon size={22} />
      </button>

      {confirmingLogout &&
        createPortal(
        <ConfirmDialog
          title="Sair da conta?"
          description="Você precisará entrar novamente para acessar o sistema."
          confirmLabel="Sair"
          cancelLabel="Cancelar"
          loadingLabel="Saindo..."
          tone="default"
          isLoading={isLoggingOut}
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={() => startLogout(async () => { await logout(); })}
        />,
        document.body,
      )}
    </aside>
  );
}

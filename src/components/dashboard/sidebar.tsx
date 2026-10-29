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
    <>
    <aside
      className="fixed left-0 top-16 bottom-0 z-20 hidden w-[76px] flex-col items-center text-brand tall:top-[89px] side:flex"
      style={{ viewTransitionName: "dash-sidebar" }}
    >
      <div className="flex min-h-0 w-[76px] flex-1 flex-col justify-center overflow-y-auto [scrollbar-width:none]">
        <Image src="/sidebar-cap-top.png" alt="" width={76} height={129} className="hidden tall:block" unoptimized />

        <nav className="flex w-full -ml-px flex-col items-center gap-4 rounded-r-3xl bg-brand py-4 tall:rounded-none tall:py-0">
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

        <Image src="/sidebar-cap-bottom.png" alt="" width={76} height={129} className="hidden tall:block" unoptimized />
      </div>

      <button
        type="button"
        onClick={() => setConfirmingLogout(true)}
        title="Sair"
        aria-label="Sair"
        className="mb-4 flex size-11 shrink-0 items-center justify-center rounded-full tall:mb-10 bg-success-from/25 text-ink transition-all duration-200 ease-out hover:scale-110 hover:bg-success-from/40 active:scale-95"
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

    {/* Phones: the menu becomes a bar at the bottom of the screen */}
    <nav
      aria-label="Menu"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around rounded-t-[22px] bg-brand px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.2)] side:hidden"
    >
      {visibleItems.map(({ href, label, icon: Icon }) => {
        const active = activePath === href;
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            className={`relative flex size-11 items-center justify-center rounded-2xl transition-all duration-200 ease-out active:scale-95 ${
              active ? "bg-gradient-to-b from-lime-from to-lime-to text-[#1d2326] shadow-md" : "text-lime-from"
            }`}
          >
            <Icon size={22} />
            <NavLinkSpinner />
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => setConfirmingLogout(true)}
        title="Sair"
        aria-label="Sair"
        className="flex size-11 items-center justify-center rounded-2xl text-lime-from transition-all duration-200 ease-out active:scale-95"
      >
        <LogoutIcon size={22} />
      </button>
    </nav>
    </>
  );
}

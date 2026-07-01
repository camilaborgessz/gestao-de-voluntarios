"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Grid2x2,
  CalendarPlus,
  Users,
  CircleUser,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Painel", icon: CalendarDays },
  { href: "/dashboard/agenda", label: "Agenda", icon: Grid2x2 },
  { href: "/dashboard/eventos/novo", label: "Novo evento", icon: CalendarPlus },
  { href: "/dashboard/voluntarios", label: "Voluntários", icon: Users },
  { href: "/dashboard/perfil", label: "Perfil", icon: CircleUser },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-[89px] bottom-0 z-20 flex w-[76px] flex-col items-center text-brand">
      <div className="flex w-[76px] flex-1 flex-col justify-center">
        <Image src="/sidebar-cap-top.png" alt="" width={76} height={129} className="block" />

        <nav className="flex w-full -ml-px flex-col items-center gap-4 bg-brand">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`flex size-11 items-center justify-center rounded-2xl transition-colors ${
                  active
                    ? "bg-gradient-to-b from-lime-from to-lime-to text-brand shadow-md"
                    : "text-lime-from hover:text-lime-to"
                }`}
              >
                <Icon size={22} strokeWidth={2} />
              </Link>
            );
          })}
        </nav>

        <Image src="/sidebar-cap-bottom.png" alt="" width={76} height={129} className="block" />
      </div>

      <button
        title="Sair"
        className="mb-10 flex size-11 items-center justify-center rounded-2xl text-brand hover:bg-brand/10"
      >
        <LogOut size={22} strokeWidth={2} />
      </button>
    </aside>
  );
}

import Image from "next/image";
import { CircleHelp } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";

export function Topbar() {
  return (
    <header
      className="sticky top-0 z-30 flex h-[89px] w-full items-center justify-between bg-surface px-10 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:bg-brand"
      style={{ viewTransitionName: "dash-topbar" }}
    >
      <Image
        src="/logo.png"
        alt="Koinonia"
        width={183}
        height={61}
        priority
        unoptimized
        className="dark:hidden"
      />
      <Image
        src="/logo-dark.png"
        alt="Koinonia"
        width={183}
        height={61}
        priority
        unoptimized
        className="hidden dark:block"
      />

      <div className="flex items-center gap-3">
        <NotificationBell />
        <ThemeToggle />
        <button className="flex size-10 items-center justify-center rounded-full bg-lime-from/40 text-brand dark:bg-white/10 dark:text-lime-from transition duration-150 ease-out hover:scale-110 hover:bg-lime-from/60 dark:hover:bg-white/20 active:scale-95">
          <CircleHelp size={20} />
        </button>
      </div>
    </header>
  );
}

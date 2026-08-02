import Image from "next/image";
import { Bell, CircleHelp } from "lucide-react";

export function Topbar() {
  return (
    <header
      className="sticky top-0 z-30 flex h-[89px] w-full items-center justify-between bg-white px-10 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
      style={{ viewTransitionName: "dash-topbar" }}
    >
      <Image src="/logo.png" alt="Koinonia" width={183} height={61} priority />

      <div className="flex items-center gap-3">
        <button className="flex size-10 items-center justify-center rounded-full bg-lime-from/40 text-brand transition duration-150 ease-out hover:scale-110 hover:bg-lime-from/60 active:scale-95">
          <Bell size={20} />
        </button>
        <button className="flex size-10 items-center justify-center rounded-full bg-lime-from/40 text-brand transition duration-150 ease-out hover:scale-110 hover:bg-lime-from/60 active:scale-95">
          <CircleHelp size={20} />
        </button>
      </div>
    </header>
  );
}

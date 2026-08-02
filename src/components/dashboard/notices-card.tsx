import { Pencil, Trash2 } from "lucide-react";

export interface Notice {
  message: string;
  postedAt: string;
  author: string;
}

export function NoticesCard({ notices, editable = false }: { notices: Notice[]; editable?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] bg-gradient-to-b from-lime-from to-lime-to p-5 shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      {notices.map((notice, index) => (
        <div
          key={index}
          className="flex gap-3 rounded-[10px] border border-[#f2f2f2] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          <div className="w-[3px] shrink-0 rounded-full bg-gradient-to-b from-brand to-brand-dark" />
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm leading-snug text-ink lg:text-base">{notice.message}</p>
            <p className="text-xs text-ink lg:text-sm">
              <span className="font-bold">Postado em: </span>
              {notice.postedAt}
              <span className="ml-4 font-bold">Autor: </span>
              {notice.author}
            </p>
          </div>
          {editable && (
            <div className="flex shrink-0 items-start gap-1.5">
              <button
                title="Apagar"
                className="flex size-7 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
              >
                <Trash2 size={14} />
              </button>
              <button
                title="Editar"
                className="flex size-7 items-center justify-center rounded-full bg-gradient-to-b from-lime-from to-lime-to text-brand transition duration-150 ease-out hover:scale-110 hover:brightness-95 active:scale-95"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>
      ))}

      <button className="self-end rounded-full bg-white px-5 py-1.5 text-xs font-medium text-ink transition duration-150 ease-out hover:scale-105 hover:bg-white/80 active:scale-95 lg:text-sm">
        Ver mais
      </button>
    </div>
  );
}

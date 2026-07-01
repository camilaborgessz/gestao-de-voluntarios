export interface Notice {
  message: string;
  postedAt: string;
  author: string;
}

export function NoticesCard({ notices }: { notices: Notice[] }) {
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
        </div>
      ))}

      <button className="self-end rounded-full bg-white px-5 py-1.5 text-xs font-medium text-ink hover:bg-white/80 lg:text-sm">
        Ver mais
      </button>
    </div>
  );
}

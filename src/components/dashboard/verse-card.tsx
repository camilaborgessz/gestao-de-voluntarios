export interface VerseCardProps {
  verse: string;
  reference: string;
}

export function VerseCard({ verse, reference }: VerseCardProps) {
  return (
    <div className="rounded-[10px] bg-gradient-to-r from-brand to-brand-dark p-6 shadow-[0_4px_16px_rgba(0,0,0,0.15)] dark:bg-none dark:bg-surface dark:border dark:border-white/10">
      <p className="text-sm leading-relaxed text-white/85 lg:text-base">&ldquo;{verse}&rdquo;</p>
      <p className="mt-4 text-sm font-semibold text-white lg:text-base">{reference}</p>
    </div>
  );
}

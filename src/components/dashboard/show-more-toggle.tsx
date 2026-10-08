"use client";

import { ChevronDown } from "lucide-react";

/**
 * Shared "show more / show less" affordance. Rendered as a subtle text link
 * (not a filled button) so it stays visually quiet inside a card.
 */
export function ShowMoreToggle({
  expanded,
  onClick,
  moreLabel,
  lessLabel = "Ver menos",
  controls,
}: {
  expanded: boolean;
  onClick: () => void;
  moreLabel: string;
  lessLabel?: string;
  controls?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={controls}
      className="mt-1 inline-flex items-center gap-1 self-center text-sm font-medium text-brand underline-offset-4 transition-colors hover:text-brand-dark hover:underline dark:text-lime-from dark:hover:text-lime-to"
    >
      {expanded ? lessLabel : moreLabel}
      <ChevronDown
        size={15}
        className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      />
    </button>
  );
}

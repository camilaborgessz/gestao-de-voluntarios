"use client";

import { useState } from "react";
import { ShowMoreToggle } from "./show-more-toggle";

/** On phones long lists show this many rows at a time; "Ver mais" reveals the next batch. */
export const PHONE_STEP = 3;

/**
 * Phone-only paging for a list of `total` rows. Rows past `shown` get `hiddenOnPhone(index)` classes
 * (`hidden sm:...`), so wider screens always see the whole list.
 */
export function usePhoneChunks(total: number, step = PHONE_STEP) {
  const [shown, setShown] = useState(step);
  return {
    isHidden: (index: number) => index >= shown,
    remaining: Math.max(0, total - shown),
    needsToggle: total > step,
    showMore: () => setShown((current) => current + step),
    showLess: () => setShown(step),
  };
}

export type PhoneChunks = ReturnType<typeof usePhoneChunks>;

export function PhoneMoreToggle({ chunks, controls }: { chunks: PhoneChunks; controls?: string }) {
  if (!chunks.needsToggle) return null;
  const expanded = chunks.remaining === 0;
  return (
    <div className="flex justify-center sm:hidden">
      <ShowMoreToggle
        expanded={expanded}
        onClick={expanded ? chunks.showLess : chunks.showMore}
        moreLabel={`Ver mais (${chunks.remaining})`}
        controls={controls}
      />
    </div>
  );
}

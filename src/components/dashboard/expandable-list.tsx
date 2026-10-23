"use client";

import { useState, type ReactNode } from "react";
import { ShowMoreToggle } from "./show-more-toggle";

/** A list that shows `initialCount` rows and reveals the rest with "Ver mais". */
export function ExpandableList({
  items,
  initialCount,
  id,
  empty,
}: {
  items: ReactNode[];
  initialCount: number;
  id: string;
  empty: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return <p className="text-sm text-ink/60">{empty}</p>;

  const collapsible = items.length > initialCount;
  const visible = collapsible && !expanded ? items.slice(0, initialCount) : items;

  return (
    <div className="flex flex-col gap-3">
      <ul id={id} className="flex flex-col gap-2">
        {visible}
      </ul>
      {collapsible && (
        <ShowMoreToggle
          expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          moreLabel={`Ver mais (${items.length - initialCount})`}
          controls={id}
        />
      )}
    </div>
  );
}

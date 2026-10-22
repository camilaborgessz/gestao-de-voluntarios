"use client";

import { useLinkStatus } from "next/link";
import { Loader2, type LucideIcon } from "lucide-react";

/**
 * Loading feedback for a <Link> that navigates to a page that takes a moment to open.
 * Both components must be rendered INSIDE the Link (that is how `useLinkStatus` knows which one).
 */

/** The link's icon, replaced by a spinner while the next page is loading. */
export function LinkIcon({
  icon: Icon,
  size = 16,
  strokeWidth,
}: {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
}) {
  const { pending } = useLinkStatus();
  return pending ? (
    <Loader2 size={size} className="animate-spin" aria-hidden />
  ) : (
    <Icon size={size} strokeWidth={strokeWidth} aria-hidden />
  );
}

/** A small spinner shown next to the link text while the next page is loading. */
export function LinkSpinner({ size = 14 }: { size?: number }) {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 size={size} className="animate-spin" aria-hidden /> : null;
}

"use client";

import { useLinkStatus } from "next/link";

export function NavLinkSpinner() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span
      aria-hidden
      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/15"
    >
      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </span>
  );
}

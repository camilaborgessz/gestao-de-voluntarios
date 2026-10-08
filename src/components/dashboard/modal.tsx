"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Open modals, bottom to top: only the last one handles the keyboard. */
const modalStack: object[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal shell: renders a backdrop + a labelled `role="dialog"` box.
 * Closes on Escape and on backdrop click, traps Tab focus, restores focus to the
 * previously focused element, and locks background scroll while open.
 */
export function Modal({
  onClose,
  children,
  labelledBy,
  className = "",
  closeOnBackdrop = true,
}: {
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  className?: string;
  closeOnBackdrop?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the setup effect on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const token = {};
    modalStack.push(token);

    function handleKeyDown(event: KeyboardEvent) {
      if (modalStack[modalStack.length - 1] !== token) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const box = boxRef.current;
      if (!box) return;
      const focusables = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !box.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const box = boxRef.current;
    const preferred = box?.querySelector<HTMLElement>("[data-autofocus]");
    const firstFocusable = preferred ?? box?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? box)?.focus();

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      modalStack.splice(modalStack.indexOf(token), 1);
      body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

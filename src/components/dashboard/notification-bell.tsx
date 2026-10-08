"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

const POLL_MS = 60_000;

const relativeTime = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

function timeAgo(iso: string) {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 1) return "agora";
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeTime.format(hours, "hour");
  return relativeTime.format(Math.round(hours / 24), "day");
}

/** Bell in the top bar: unread badge + the last 7 days of notifications. */
export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  // Which items were unread when the panel opened, so they stay highlighted while it is open.
  const [highlighted, setHighlighted] = useState<ReadonlySet<string>>(() => new Set());
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { items: NotificationItem[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // Offline or server restarting: keep what is on screen and try again on the next tick.
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setHighlighted(new Set(items.filter((item) => !item.readAt).map((item) => item.id)));
    setOpen(true);
    if (unread > 0) {
      setUnread(0);
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "read-all" }),
        });
      } catch {
        void load();
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notificações (${unread} novas)` : "Notificações"}
        title="Notificações"
        className="relative flex size-10 items-center justify-center rounded-full bg-lime-from/40 text-brand transition duration-150 ease-out hover:scale-110 hover:bg-lime-from/60 active:scale-95 dark:bg-white/10 dark:text-lime-from dark:hover:bg-white/20"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-danger-to px-1 text-[11px] font-bold leading-5 text-white ring-2 ring-surface dark:ring-brand">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-brand/15 bg-surface shadow-[0_12px_36px_rgba(0,0,0,0.2)] dark:border-white/10 dark:bg-surface-raised"
        >
          <div className="border-b border-brand/10 px-4 py-3 dark:border-white/10">
            <p className="text-base font-semibold text-ink">Notificações</p>
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-ink/60">
                <BellOff size={24} />
                Nenhuma notificação por enquanto.
              </div>
            ) : (
              <ul>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`flex gap-3 border-b border-brand/10 px-4 py-3 last:border-b-0 dark:border-white/10 ${
                      highlighted.has(item.id) ? "bg-lime-from/30 dark:bg-lime-from/10" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${
                        highlighted.has(item.id) ? "bg-brand dark:bg-lime-from" : "bg-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 text-sm text-ink/80">{item.message}</p>
                      <p className="mt-1 text-xs text-ink/50">{timeAgo(item.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

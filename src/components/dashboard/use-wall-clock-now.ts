"use client";

import { useEffect, useState } from "react";
import { wallClockNow } from "@/lib/event-schedule";

/**
 * The current moment as wall-clock milliseconds (see `wallClockNow`), refreshed every 15 seconds, so an event
 * switches to "finalizado" by itself when its start time arrives, without reloading the page.
 * `initialIso` comes from the server so the first render matches the server's.
 */
export function useWallClockNow(initialIso: string) {
  const [now, setNow] = useState(() => new Date(initialIso).getTime());
  useEffect(() => {
    const tick = () => setNow(wallClockNow().getTime());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

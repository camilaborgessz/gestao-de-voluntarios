/**
 * Small in-memory limiter (per server process): enough to slow down password guessing and form abuse.
 * Behind several servers each keeps its own count, which is still a useful brake.
 */
const hits = new Map<string, number[]>();

/** Counts one attempt for `key`. Returns false when it exceeded `max` attempts within `windowMs`. */
export function allowAttempt(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5_000) {
    for (const [name, times] of hits) if (times.every((time) => now - time >= windowMs)) hits.delete(name);
  }
  return true;
}

export function clearAttempts(key: string) {
  hits.delete(key);
}

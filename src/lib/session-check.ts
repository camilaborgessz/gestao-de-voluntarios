import { prisma } from "@/lib/prisma";

/**
 * A session (JWT) remembers when the password was last changed. If the password changes afterwards
 * (reset link, new invite), the old sessions stop working. The lookup is cached for a few seconds
 * because `auth()` runs several times per request.
 */
const CACHE_MS = 15_000;
const cache = new Map<string, { value: number | null; at: number }>();

/** `passwordChangedAt` as milliseconds (0 = never changed), or null when the user no longer exists. */
export async function currentPasswordStamp(userId: string): Promise<number | null> {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordChangedAt: true } });
  const value = user ? (user.passwordChangedAt?.getTime() ?? 0) : null;
  cache.set(userId, { value, at: Date.now() });
  return value;
}

export function forgetPasswordCheck(userId: string) {
  cache.delete(userId);
}

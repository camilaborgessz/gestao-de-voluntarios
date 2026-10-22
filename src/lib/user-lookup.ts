import { prisma } from "@/lib/prisma";

/**
 * Finds a user by what they typed on the login screen: an email or a phone number
 * ("(69) 99999-9999", "69999999999", "+55 69 99999-9999"…). Returns null when nothing —
 * or more than one account — matches.
 */
export async function findUserByIdentifier(identifier: string) {
  const value = identifier.trim();
  if (!value) return null;

  if (value.includes("@")) {
    return prisma.user.findFirst({ where: { email: { equals: value, mode: "insensitive" } } });
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const national = digits.slice(-11); // drops the country code (55) when present

  const candidates = await prisma.user.findMany({ where: { phone: { not: null } } });
  const matches = candidates.filter((user) => (user.phone ?? "").replace(/\D/g, "").slice(-11) === national);
  return matches.length === 1 ? matches[0] : null;
}

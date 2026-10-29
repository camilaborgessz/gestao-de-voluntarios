import { prisma } from "@/lib/prisma";

/**
 * One key per real mailbox: "Camila+jeova@Gmail.com", "camila@googlemail.com" and "c.amila@gmail.com" are all the
 * same inbox, so they get the same key. A "+tag" in the part before the @ is dropped for every provider, and dots
 * are ignored for Gmail (which ignores them too).
 */
export function emailKey(email: string) {
  const [localPart = "", domainPart = ""] = email.trim().toLowerCase().split("@");
  const domain = domainPart === "googlemail.com" ? "gmail.com" : domainPart;
  let local = localPart.split("+")[0];
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

/** An existing user whose mailbox is the same as `email` (another `excludeId` is ignored, e.g. the person being edited). */
export async function findUserWithSameMailbox(email: string, excludeId?: string) {
  const key = emailKey(email);
  const domain = key.split("@")[1];
  const domains = domain === "gmail.com" ? ["gmail.com", "googlemail.com"] : [domain];
  const candidates = await prisma.user.findMany({
    where: { OR: domains.map((value) => ({ email: { endsWith: `@${value}`, mode: "insensitive" as const } })) },
    select: { id: true, email: true },
  });
  return candidates.find((user) => user.id !== excludeId && emailKey(user.email) === key) ?? null;
}

export const EMAIL_IN_USE_MESSAGE = "Já existe um usuário com esse email";

import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { forgetPasswordCheck } from "@/lib/session-check";

/** How long each kind of link works. */
export const TOKEN_TTL_MS = { INVITE: 72 * 3_600_000, RESET: 30 * 60_000 } as const;
export const TOKEN_TTL_LABEL = { INVITE: "72 horas", RESET: "30 minutos" } as const;

export const MIN_PASSWORD_LENGTH = 8;

type Purpose = keyof typeof TOKEN_TTL_MS;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Creates a one-time link token. Only its SHA-256 is stored; the raw value exists just in the email.
 * Any older unused link of the same person stops working ("Reenviar convite").
 */
export async function issuePasswordToken(userId: string, purpose: Purpose) {
  const token = randomBytes(32).toString("base64url");
  // Plain statements instead of a transaction: if the second one fails, the only effect is an extra valid link.
  const created = await prisma.passwordToken.create({
    data: { userId, purpose, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]) },
    select: { id: true },
  });
  await prisma.passwordToken.deleteMany({ where: { userId, usedAt: null, id: { not: created.id } } });
  return token;
}

/** The link to put in the email. Uses APP_URL when set, otherwise the address of the current request. */
export async function passwordLink(token: string) {
  let base = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (!base) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
    const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    base = `${protocol}://${host}`;
  }
  return `${base}/definir-senha?token=${encodeURIComponent(token)}`;
}

export type TokenLookup =
  | { ok: true; purpose: Purpose; userName: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

export async function lookupPasswordToken(token: string | undefined): Promise<TokenLookup> {
  if (!token || token.length < 20 || token.length > 200) return { ok: false, reason: "invalid" };
  const record = await prisma.passwordToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { name: true } } },
  });
  if (!record) return { ok: false, reason: "invalid" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, purpose: record.purpose, userName: record.user.name };
}

/**
 * Spends the token (single use) and saves the new password hash. Every other open link of the person is
 * dropped and `passwordChangedAt` moves forward, which signs out the sessions opened with the old password.
 */
export async function consumePasswordToken(token: string, password: string): Promise<boolean> {
  const passwordHash = await bcrypt.hash(password, 10);
  const tokenHash = hashToken(token);

  const record = await prisma.passwordToken.findUnique({ where: { tokenHash }, select: { userId: true } });
  if (!record) return false;

  // The atomic "claim" is what makes the link single-use, even if two requests arrive together.
  const spent = await prisma.passwordToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (spent.count === 0) return false;

  const userId = record.userId;
  await prisma.user.update({ where: { id: userId }, data: { passwordHash, passwordChangedAt: new Date() } });
  await prisma.passwordToken.deleteMany({ where: { userId, usedAt: null } });

  forgetPasswordCheck(userId);
  return true;
}

// ---- password rules: length first (NIST SP 800-63B), no composition rules

const COMMON_PASSWORDS = new Set([
  "12345678", "123456789", "1234567890", "87654321", "11111111", "00000000", "senha123", "senha1234", "mudar123",
  "password", "password1", "qwerty123", "qwertyui", "abc12345", "abcd1234", "iloveyou", "admin123", "admin1234",
  "brasil123", "deusefiel", "deus12345", "jesus123", "jesuscristo", "aleluia123", "koinonia", "koinonia123",
]);

/** Returns an error message, or null when the password is acceptable. */
export async function passwordProblem(password: string): Promise<string | null> {
  if (password.length < MIN_PASSWORD_LENGTH) return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`;
  if (password.length > 72) return "A senha pode ter no máximo 72 caracteres";
  if (COMMON_PASSWORDS.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) return "Essa senha é muito comum. Escolha outra.";
  if (await isLeaked(password)) return "Essa senha apareceu em vazamentos de dados. Escolha outra.";
  return null;
}

/** Have I Been Pwned range API (k-anonymity: only the first 5 hash characters leave the server). Fails open. */
async function isLeaked(password: string) {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const response = await fetch(`https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(2_500),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const suffix = sha1.slice(5);
    return (await response.text()).split("\n").some((line) => {
      const [hash, count] = line.trim().split(":");
      return hash === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}

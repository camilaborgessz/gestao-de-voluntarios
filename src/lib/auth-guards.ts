import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type AppRole = "ADMIN" | "VOLUNTEER";

/** Session for server components/pages: sends visitors without a session to the login page. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

/** Page-level guard for admin-only screens: volunteers are sent back to the dashboard. */
export async function requireAdminPage() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

/** Guard for server actions: returns an error message instead of throwing/redirecting. */
export async function adminActionError(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return "Sessão expirada, faça login novamente";
  if (session.user.role !== "ADMIN") return "Você não tem permissão para fazer isso";
  return null;
}

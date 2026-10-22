import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Checked here (not in the proxy): a leftover cookie of an ended session must not bounce between /login and /dashboard.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return <LoginForm />;
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** There is no landing page: the app opens straight on the login (or on the dashboard when already signed in). */
export default async function Home() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/login");
}

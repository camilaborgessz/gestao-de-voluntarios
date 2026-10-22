import type { NextAuthConfig } from "next-auth";

const ADMIN_ONLY_PATHS = ["/dashboard/voluntarios", "/dashboard/eventos", "/dashboard/escala"];

function isAdminOnlyPath(pathname: string) {
  return ADMIN_ONLY_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export const authConfig = {
  // Without this, `next start` (production) rejects every request with
  // "There was a problem with the server configuration" unless AUTH_URL is set.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/dashboard")) {
        if (!auth?.user) return false;
        // Volunteers never reach the admin screens (each page also checks, this stops them at the door).
        if (isAdminOnlyPath(pathname) && auth.user.role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

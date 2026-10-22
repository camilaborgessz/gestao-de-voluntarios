import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { findUserByIdentifier } from "@/lib/user-lookup";
import { allowAttempt, clearAttempts } from "@/lib/rate-limit";
import { currentPasswordStamp } from "@/lib/session-check";

const credentialsSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;
        // Brake for password guessing: 8 failed tries per account every 15 minutes.
        const limitKey = `login:${identifier.trim().toLowerCase()}`;
        if (!allowAttempt(limitKey, 8, 15 * 60_000)) return null;

        const user = await findUserByIdentifier(identifier);
        // Invited people without a password yet (passwordHash null) cannot sign in until they use the link.
        if (!user?.passwordHash) return null;

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) return null;
        clearAttempts(limitKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          passwordStamp: user.passwordChangedAt?.getTime() ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.passwordStamp = user.passwordStamp;
        return token;
      }
      // Sessions opened before the last password change (or of deleted users) end here.
      if (!token.sub) return null;
      const stamp = await currentPasswordStamp(token.sub);
      if (stamp === null || stamp !== (token.passwordStamp ?? 0)) return null;
      return token;
    },
  },
});

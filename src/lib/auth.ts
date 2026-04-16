import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || user.status !== "ACTIVE") return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          const attempts = user.failedAttempts + 1;
          const updateData: { failedAttempts: number; lockedUntil?: Date } = {
            failedAttempts: attempts,
          };

          if (attempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: 0, lockedUntil: null },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: user.isSuperAdmin,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { isSuperAdmin?: boolean }).isSuperAdmin =
          token.isSuperAdmin as boolean;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});

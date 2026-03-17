import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: { id: true, name: true, email: true, password: true, role: true }
        } as any);

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email, role: (user as any).role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("SIGN IN CALLBACK START:", { email: user.email, provider: account?.provider });
        if (account?.provider === "google") {
          if (!user.email) {
            console.error("SIGN IN FAILED: No email provided by Google");
            return false;
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            console.log("CREATING NEW OAUTH USER:", user.email);
            await prisma.user.create({
              data: {
                name: user.name || "Google User",
                email: user.email,
                role: "USER",
              } as any,
            });
          } else {
            console.log("EXISTING USER SIGNING IN VIA OAUTH:", user.email);
          }
        }
        return true;
      } catch (error) {
        console.error("SIGN IN CALLBACK ERROR:", error);
        return false; // This triggers AccessDenied
      }
    },
    async jwt({ token, user, account }) {
      try {
        if (user) {
          token.id = user.id;
          // If user object has role (from Credentials), use it
          if ((user as any).role) {
            token.role = (user as any).role;
          } else {
            console.log("FETCHING ROLE FOR OAUTH USER:", token.email);
            // For OAuth, fetch role from DB
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email! },
              select: { role: true } as any
            });
            token.role = (dbUser as any)?.role || "USER";
          }
        }
        return token;
      } catch (error) {
        console.error("JWT CALLBACK ERROR:", error);
        return token;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
});

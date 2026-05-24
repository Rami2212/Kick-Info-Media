import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import {
  getUserById,
  getUserByEmail,
  upsertGoogleUser,
  verifyUserPassword,
} from "@/lib/users";

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (process.env.NODE_ENV === "production" && !authSecret) {
  console.error(
    "[auth] Missing secret. Set AUTH_SECRET or NEXTAUTH_SECRET in production.",
  );
}

const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: authSecret || undefined,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = String(credentials?.email || "").trim().toLowerCase();
          const password = String(credentials?.password || "");
          if (!email || !password) return null;

          const user = await verifyUserPassword(email, password);
          if (!user) return null;

          return {
            id: user.id,
            name: user.displayName || user.username,
            email: user.email,
            image: user.profileImageUrl || null,
            username: user.username,
          };
        } catch (error) {
          console.error("[auth] Credentials authorize failed", error);
          return null;
        }
      },
    }),
    ...(googleId && googleSecret
      ? [
          Google({
            clientId: googleId,
            clientSecret: googleSecret,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider !== "google") return true;
        if (!user.email) return false;

        const synced = await upsertGoogleUser({
          email: user.email,
          name: user.name,
          image: user.image,
          googleId: account.providerAccountId,
        });

        user.id = synced.id;
        user.name = synced.displayName || synced.username;
        user.image = synced.profileImageUrl || null;
        (user as { username?: string }).username = synced.username;
        return true;
      } catch (error) {
        console.error("[auth] signIn callback failed", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.sub = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
          token.username = (user as { username?: string }).username;
        }

        if (!token.username && token.email) {
          const dbUser = await getUserByEmail(String(token.email));
          if (dbUser) {
            token.sub = dbUser.id;
            token.username = dbUser.username;
            token.name = dbUser.displayName || dbUser.username;
            token.picture = dbUser.profileImageUrl || null;
          }
        }

        return token;
      } catch (error) {
        console.error("[auth] jwt callback failed", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (!session.user) return session;
        session.user.id = String(token.sub || "");
        session.user.username = String(token.username || "");

        if (!session.user.username && session.user.id) {
          const dbUser = await getUserById(session.user.id);
          if (dbUser) {
            session.user.username = dbUser.username;
            session.user.name = dbUser.displayName || dbUser.username;
            session.user.image = dbUser.profileImageUrl || null;
            session.user.email = dbUser.email;
          }
        }

        return session;
      } catch (error) {
        console.error("[auth] session callback failed", error);
        return session;
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

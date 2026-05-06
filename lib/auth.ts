import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { env } from "./env"

// DEMO ONLY: single-admin credential. Replace with a real user table /
// OAuth provider before any multi-tenant or production use.
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "SecQuest AI",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.username === env.ADMIN_USERNAME &&
          credentials?.password === env.ADMIN_PASSWORD
        ) {
          return {
            id: "1",
            name: "SecQuest Admin",
            email: "admin@secquest.ai",
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})

import { compare } from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  logger: {
    error(code, metadata) {
      // Suppress noisy JWT decryption errors (stale/corrupted cookies)
      if (code === "JWT_SESSION_ERROR") return
      console.error(`[next-auth][error][${code}]`, metadata)
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        id: { label: "ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const id = credentials?.id?.trim()
        const password = credentials?.password

        if (!id || !password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { id },
        })

        if (!user) {
          return null
        }

        const passwordMatches = await compare(password, user.password)

        if (!passwordMatches) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id
      }

      return session
    },
  },
}

export function getSession() {
  return getServerSession(authOptions)
}

export async function requireAuthUser() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return session.user
}

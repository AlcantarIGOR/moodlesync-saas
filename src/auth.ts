import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { getMoodleToken, mCall } from "@/lib/moodle"
import type { MoodleSiteInfo } from "@/types"

declare module "next-auth" {
  interface Session {
    moodleToken: string
    moodleUserId: number
    user: {
      id: string
    } & DefaultSession["user"]
  }

  interface User {
    moodleToken?: string
    moodleUserId?: number
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Número de control" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string
        const password = credentials?.password as string

        if (!username || !password) return null

        const token = await getMoodleToken(username, password)
        if (!token) return null

        const siteInfo: MoodleSiteInfo = await mCall(
          token,
          "core_webservice_get_site_info"
        )

        if (!siteInfo?.userid) return null

        const moodleEmail = siteInfo.useremail ?? null

        const user = await db.user.upsert({
          where: { moodleUsername: siteInfo.username },
          update: {
            name: siteInfo.fullname,
            moodleUserId: siteInfo.userid,
            // Only set email if we got one from Moodle and user hasn't manually set one
            ...(moodleEmail ? { email: moodleEmail } : {}),
          },
          create: {
            moodleUsername: siteInfo.username,
            moodleUserId: siteInfo.userid,
            name: siteInfo.fullname,
            email: moodleEmail,
          },
        })

        return {
          id: user.id,
          name: user.name,
          moodleToken: token,
          moodleUserId: siteInfo.userid,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        ;(token as Record<string, unknown>).moodleToken = user.moodleToken
        ;(token as Record<string, unknown>).moodleUserId = user.moodleUserId
      }
      return token
    },
    session({ session, token }) {
      const tok = token as {
        sub?: string
        moodleToken?: string
        moodleUserId?: number
      }
      session.user.id = tok.sub ?? ""
      session.moodleToken = tok.moodleToken ?? ""
      session.moodleUserId = tok.moodleUserId ?? 0
      return session
    },
  },
})

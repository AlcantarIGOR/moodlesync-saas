"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { headers } from "next/headers"
import { checkRateLimit } from "@/lib/rate-limit"

export type LoginState = { error: string | null }

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  // Rate limit check: 5 attempts per minute per IP
  const headerList = await headers()
  const ip = headerList.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1"
  const { success } = checkRateLimit(`login:${ip}`, 5, 60 * 1000)
  if (!success) {
    return { error: "Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en un minuto." }
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard",
    })
    return { error: null }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Usuario o contraseña incorrectos. Verifica tus credenciales del ITCG." }
    }
    throw error // re-throw NEXT_REDIRECT para que Next.js navegue al dashboard
  }
}

"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export type LoginState = { error: string | null }

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

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

"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard/tareas",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=SIGNIN_ERROR")
    }
    // Re-throw NEXT_REDIRECT (not an AuthError)
    throw error
  }
}

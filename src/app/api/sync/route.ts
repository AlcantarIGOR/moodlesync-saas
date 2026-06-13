import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { syncUserTasks } from "@/lib/sync"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST() {
  const session = await auth()

  if (!session?.user?.id || !session.moodleToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limit check: 3 syncs per minute per user
  const { success } = checkRateLimit(`sync:${session.user.id}`, 3, 60 * 1000)
  if (!success) {
    return NextResponse.json({ error: "Demasiadas solicitudes de sincronización. Por favor, espera un minuto." }, { status: 429 })
  }

  if (!session.moodleUserId) {
    return NextResponse.json({ error: "Missing Moodle user ID" }, { status: 400 })
  }

  try {
    const synced = await syncUserTasks(
      session.user.id,
      session.moodleToken,
      session.moodleUserId
    )
    return NextResponse.json({ synced })
  } catch (err) {
    let message = err instanceof Error ? err.message : "Unknown sync error"
    if (
      message.includes("Ficha (token) no válida") ||
      message.includes("token no encontrada") ||
      message.includes("Invalid token")
    ) {
      message = "Tu sesión de Moodle ha expirado. Por favor, cierra sesión e inicia sesión de nuevo para renovarla."
    }
    console.error("[sync] syncUserTasks failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { encryptPassword } from "@/lib/crypto"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const email: string | undefined = body.email

  const update: Record<string, unknown> = {}

  if (email !== undefined) {
    if (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    update.email = email === "" ? null : email
  }

  const mindboxPassword: string | undefined = body.mindboxPassword
  if (mindboxPassword !== undefined) {
    update.mindboxPassword = mindboxPassword === "" ? null : encryptPassword(mindboxPassword)
  }

  if (Object.keys(update).length > 0) {
    await db.user.update({ where: { id: session.user.id }, data: update })
  }

  return NextResponse.json({ ok: true })
}

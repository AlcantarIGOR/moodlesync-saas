import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

// POST /api/push/subscribe — save a push subscription
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { endpoint, keys } = body as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/push/subscribe — remove a push subscription
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { endpoint } = await req.json() as { endpoint: string }

  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })

  await db.pushSubscription.deleteMany({
    where: { userId: session.user.id, endpoint },
  })

  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendReminderEmail } from "@/lib/email"
import { sendPush } from "@/lib/push"

// Vercel Cron calls this endpoint. Protect it with a secret header.
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 14 * * *" }] }
// Schedule: 14:00 UTC = 08:00 CST (hora de México)

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const isDev  = process.env.NODE_ENV === "development"
  if (!isDev) {
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // Find tasks due in the next 24-26h that are still PENDING
  const now = new Date()
  const windowStart = new Date(now.getTime() + 23 * 3600 * 1000)   // 23h from now
  const windowEnd   = new Date(now.getTime() + 26 * 3600 * 1000)   // 26h from now

  const tasks = await db.task.findMany({
    where: {
      status: "PENDING",
      dueDate: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, pushSubs: true } },
    },
    orderBy: { dueDate: "asc" },
  })

  if (tasks.length === 0) {
    return NextResponse.json({ sent: 0, message: "No tasks in window" })
  }

  // Group by user
  const byUser = new Map<string, typeof tasks>()
  for (const task of tasks) {
    const userId = task.user.id
    if (!byUser.has(userId)) byUser.set(userId, [])
    byUser.get(userId)!.push(task)
  }

  let sent = 0
  let skipped = 0
  let pushSent = 0
  const processedIds: string[] = []

  for (const [, userTasks] of byUser) {
    const user = userTasks[0].user

    // Email reminder
    if (user.email) {
      const ok = await sendReminderEmail(
        user.email,
        user.name,
        userTasks.map((t) => ({
          title: t.title,
          courseName: t.courseName,
          dueDate: t.dueDate!,
        }))
      )
      if (ok) sent++
      else skipped++
    } else {
      skipped++
    }

    // Push notifications — one push per subscription covering all tasks
    if (user.pushSubs.length > 0) {
      const firstTask = userTasks[0]
      const moreCount = userTasks.length - 1
      const body = moreCount > 0
        ? `${firstTask.title} y ${moreCount} tarea${moreCount !== 1 ? "s" : ""} más vencen mañana`
        : `"${firstTask.title}" vence mañana`

      const expiredEndpoints: string[] = []

      await Promise.all(
        user.pushSubs.map(async (sub) => {
          const result = await sendPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            { title: "MoodleSync — Recordatorio", body, url: "/dashboard/tareas" }
          )
          if (result === "expired") expiredEndpoints.push(sub.endpoint)
          else if (result === "ok") pushSent++
        })
      )

      // Only delete confirmed-expired/revoked subscriptions (410/404)
      if (expiredEndpoints.length > 0) {
        await db.pushSubscription.deleteMany({
          where: { endpoint: { in: expiredEndpoints } },
        })
      }
    }

    processedIds.push(...userTasks.map((t) => t.id))
  }

  if (processedIds.length > 0) {
    await db.task.updateMany({
      where: { id: { in: processedIds } },
      data: { reminderSentAt: new Date() },
    })
  }

  console.log(`[cron/reminders] email sent=${sent} skipped=${skipped} push=${pushSent} window=${windowStart.toISOString()}–${windowEnd.toISOString()}`)

  return NextResponse.json({ sent, skipped, pushSent, users: byUser.size })
}

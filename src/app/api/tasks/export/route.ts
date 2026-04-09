import { auth } from "@/auth"
import { db } from "@/lib/db"

function escapeIcs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const tasks = await db.task.findMany({
    where: {
      userId: session.user.id,
      status: { not: "ARCHIVED" },
      dueDate: { not: null },
    },
    orderBy: { dueDate: "asc" },
  })

  const now = toIcsDate(new Date())

  const events = tasks
    .filter((t) => t.dueDate !== null)
    .map((t) => {
      const uid = `moodlesync-${t.id}@onyxinc.mx`
      const due = toIcsDate(t.dueDate!)
      const title = escapeIcs(t.title)
      const course = t.courseName ? `\\n${escapeIcs(t.courseName)}` : ""
      const status = t.status === "DONE" ? "COMPLETED" : "NEEDS-ACTION"

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${due}`,
        `DTEND:${due}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:MoodleSync${course}`,
        `STATUS:${status}`,
        "END:VEVENT",
      ].join("\r\n")
    })

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ONYX Inc.//MoodleSync//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:MoodleSync — Tareas ITCG",
    "X-WR-TIMEZONE:America/Mexico_City",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n")

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="moodlesync-tareas.ics"`,
      "Cache-Control": "no-store",
    },
  })
}

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { scrapeGradesAndSchedule } from "@/lib/mindbox"
import { decryptPassword } from "@/lib/crypto"
import type { Prisma } from "@prisma/client"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "No autenticado" }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { moodleUsername: true, mindboxPassword: true },
  })

  if (!user?.mindboxPassword) {
    return Response.json(
      { error: "Configura tu contraseña de Mindbox en Configuración primero" },
      { status: 400 }
    )
  }

  const ncontrol = user.moodleUsername.replace(/^[a-zA-Z]+/, "")
  const plainPassword = decryptPassword(user.mindboxPassword)

  try {
    // Single login — grades + schedule scraped sharing one session
    const { grades, sessions } = await scrapeGradesAndSchedule(ncontrol, plainPassword)

    // Upsert grades in parallel (eliminates N+1 sequential awaits)
    await Promise.all(grades.map((g) => db.grade.upsert({
      where: { userId_period_subjectCode: { userId: session.user.id, period: g.period, subjectCode: g.subjectCode } },
      create: {
        userId: session.user.id,
        period: g.period,
        periodName: g.periodName,
        subjectCode: g.subjectCode,
        subjectName: g.subjectName,
        group: g.group,
        credits: g.credits,
        finalGrade: g.finalGrade,
        evalType: g.evalType,
        partialGrades: g.partialGrades as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      },
      update: {
        periodName: g.periodName,
        subjectName: g.subjectName,
        group: g.group,
        credits: g.credits,
        finalGrade: g.finalGrade,
        evalType: g.evalType,
        partialGrades: g.partialGrades as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      },
    })))
    const syncedGrades = grades.length

    // Replace schedule atomically — delete + insert in a transaction
    // to avoid losing schedule data if createMany fails
    await db.$transaction([
      db.classSession.deleteMany({ where: { userId: session.user.id } }),
      ...(sessions.length > 0 ? [db.classSession.createMany({
        data: sessions.map((s) => ({
          userId: session.user.id,
          dayOfWeek: s.dayOfWeek,
          subjectName: s.subjectName,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          professor: s.professor,
          group: s.group,
          syncedAt: new Date(),
        })),
      })] : []),
    ])

    return Response.json({
      ok: true,
      grades: syncedGrades,
      schedule: sessions.length,
      periods: [...new Set(grades.map((g) => g.periodName))],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido"
    return Response.json({ error: msg }, { status: 500 })
  }
}

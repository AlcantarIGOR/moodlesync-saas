import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sendReminderEmail } from "@/lib/email"

// Solo para desarrollo — prueba el sistema de email con datos reales del usuario
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  if (!user?.email) {
    return NextResponse.json({
      error: "Sin email configurado. Ve a Configuración y agrega tu correo primero.",
    }, { status: 400 })
  }

  // Usa tareas reales del usuario con dueDate próximo, o datos de muestra si no hay
  const realTasks = await db.task.findMany({
    where: { userId: session.user.id, status: "PENDING", dueDate: { not: null } },
    orderBy: { dueDate: "asc" },
    take: 3,
  })

  const tasks = realTasks.length > 0
    ? realTasks.map((t) => ({
        title: t.title,
        courseName: t.courseName,
        dueDate: t.dueDate!,
      }))
    : [
        {
          title: "Proyecto Final — Inteligencia Artificial",
          courseName: "Inteligencia Artificial — 4° Semestre",
          dueDate: new Date(Date.now() + 20 * 3600 * 1000),
        },
        {
          title: "Práctica 3 — Redes de Computadoras",
          courseName: "Redes de Computadoras — 4° Semestre",
          dueDate: new Date(Date.now() + 25 * 3600 * 1000),
        },
      ]

  const ok = await sendReminderEmail(user.email, user.name, tasks)

  if (!ok) {
    return NextResponse.json({
      error: "Falló el envío — revisa los logs del servidor (terminal del dev server) para ver el error exacto de Resend",
    }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    sentTo: user.email,
    tasks: tasks.length,
    note: realTasks.length > 0 ? "Usó tareas reales de tu cuenta" : "Usó tareas de muestra",
  })
}

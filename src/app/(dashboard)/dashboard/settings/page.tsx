import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { EmailForm } from "@/components/dashboard/email-form"
import { MindboxForm } from "@/components/dashboard/mindbox-form"
import { PushToggle } from "@/components/dashboard/push-toggle"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, plan: true, moodleUsername: true, moodleUserId: true, mindboxPassword: true },
  })

  if (!user) redirect("/login")

  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  const isPremium = true // todos los usuarios tienen acceso completo por ahora

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div
        className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "var(--bg-glass)", backdropFilter: "blur(10px)" }}
      >
        <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>
          Configuración
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto space-y-4">

          {/* Profile card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
              <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Perfil
              </p>
            </div>
            <div className="px-4 py-4 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-base font-bold"
                style={{ background: "var(--blue-d)", border: "1px solid var(--blue-b)", color: "var(--blue)", fontFamily: "var(--mono)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--tx)" }}>{user.name}</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                  {user.moodleUsername}
                </p>
              </div>
              <span
                className="text-[10px] rounded px-2 py-1 shrink-0 font-semibold"
                style={{
                  fontFamily: "var(--mono)",
                  background: isPremium ? "var(--blue-d)" : "var(--s3)",
                  color: isPremium ? "var(--blue)" : "var(--tx2)",
                  border: `1px solid ${isPremium ? "var(--blue-b)" : "var(--b1)"}`,
                }}
              >
                {isPremium ? "PREMIUM" : "FREE"}
              </span>
            </div>
          </div>

          {/* Notifications card */}
          <div data-tour="settings-email" className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                  Recordatorios por email
                </p>
                <span
                  className="text-[9px] rounded px-1.5 py-0.5 font-semibold"
                  style={{
                    fontFamily: "var(--mono)",
                    background: user.email ? "var(--green-d)" : "var(--s3)",
                    color: user.email ? "var(--green)" : "var(--tx2)",
                    border: `1px solid ${user.email ? "var(--green-b)" : "var(--b1)"}`,
                  }}
                >
                  {user.email ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>
            </div>
            <div className="px-4 py-4">
              <p className="text-[11px] mb-3" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Recibirás un email diario a las 8:00 AM cuando alguna tarea venza en las próximas 24 horas.
              </p>
              <EmailForm initial={user.email} />
            </div>
          </div>

          {/* Push notifications card */}
          <div data-tour="settings-push" className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
              <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Notificaciones Push
              </p>
            </div>
            <div className="px-4 py-4 flex items-start justify-between gap-4">
              <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Recibe alertas en tu dispositivo aunque la app esté cerrada — 24h antes de cada entrega.
              </p>
              <div className="shrink-0">
                <PushToggle />
              </div>
            </div>
          </div>

          {/* Mindbox card */}
          <div data-tour="settings-mindbox" className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                  Conexión Mindbox (calificaciones)
                </p>
                <span
                  className="text-[9px] rounded px-1.5 py-0.5 font-semibold"
                  style={{
                    fontFamily: "var(--mono)",
                    background: user.mindboxPassword ? "var(--green-d)" : "var(--s3)",
                    color: user.mindboxPassword ? "var(--green)" : "var(--tx2)",
                    border: `1px solid ${user.mindboxPassword ? "var(--green-b)" : "var(--b1)"}`,
                  }}
                >
                  {user.mindboxPassword ? "CONECTADO" : "NO CONFIGURADO"}
                </span>
              </div>
            </div>
            <div className="px-4 py-4">
              <MindboxForm hasSaved={!!user.mindboxPassword} />
            </div>
          </div>

          {/* Moodle connection card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
              <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Conexión Moodle
              </p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <Row label="Estado" value={session.moodleToken ? "Conectado" : "No conectado"} valueColor={session.moodleToken ? "var(--green)" : "var(--red)"} />
              <Row label="Número de control" value={user.moodleUsername} />
              <Row label="Usuario ID" value={String(user.moodleUserId)} mono />
            </div>
            <div className="px-4 pb-4">
              <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Para cambiar tu contraseña de Moodle, cierra sesión e inicia de nuevo.
              </p>
            </div>
          </div>

          {/* Plan card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
              <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Plan actual
              </p>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--tx)" }}>
                  {isPremium ? "Premium" : "Gratuito"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                  {isPremium ? "Acceso completo a todas las funciones" : "Hasta 3 tareas manuales"}
                </p>
              </div>
              {!isPremium && (
                <a
                  href="/dashboard/upgrade"
                  className="h-9 px-4 rounded-lg text-xs font-semibold flex items-center"
                  style={{ background: "var(--blue-d)", border: "1px solid var(--blue-b)", color: "var(--blue)", textDecoration: "none" }}
                >
                  Actualizar
                </a>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--red-b)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--red-b)", background: "var(--red-d)" }}>
              <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--red)" }}>
                Zona peligrosa
              </p>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--tx)" }}>Cerrar sesión</p>
                <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                  Cierra tu sesión en este dispositivo
                </p>
              </div>
              <a
                href="/api/auth/signout"
                className="h-9 px-4 rounded-lg text-xs font-semibold flex items-center"
                style={{ background: "var(--red-d)", border: "1px solid var(--red-b)", color: "var(--red)", textDecoration: "none" }}
              >
                Salir
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function Row({ label, value, valueColor, mono }: { label: string; value: string; valueColor?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>{label}</span>
      <span className="text-[11px] font-medium" style={{ fontFamily: mono ? "var(--mono)" : undefined, color: valueColor ?? "var(--tx)" }}>
        {value}
      </span>
    </div>
  )
}

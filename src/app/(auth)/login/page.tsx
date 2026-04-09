import { LoginForm } from "@/components/dashboard/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const hasError = params.error === "SIGNIN_ERROR"

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Left branding panel ── */}
      <div className="hidden md:flex w-1/2 flex-col justify-center px-14 py-16 relative overflow-hidden"
        style={{ background: "var(--card)", borderRight: "1px solid var(--b1)" }}>
        {/* Grid background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(to right,#4b8cf8 1px,transparent 1px),linear-gradient(to bottom,#4b8cf8 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          opacity: .025,
        }} />
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(75,140,248,.08) 0%,transparent 65%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-12 relative z-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "var(--blue)" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="4" fill="white"/>
              <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.8"/>
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight" style={{ color: "var(--tx)" }}>MoodleSync</div>
            <div className="text-[9px]" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>by ONYX Inc.</div>
          </div>
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4 relative z-10"
          style={{ color: "var(--tx)", letterSpacing: "-.8px" }}>
          Organiza tu vida<br />
          <em className="not-italic" style={{ color: "var(--blue)" }}>académica.</em>
        </h1>
        <p className="text-[15px] leading-relaxed mb-10 relative z-10 max-w-[380px]" style={{ color: "var(--tx2)" }}>
          Sincroniza tus tareas del ITCG automáticamente. Nunca más pierdas una fecha de entrega.
        </p>

        <div className="flex flex-col gap-3 relative z-10">
          {[
            "Sincronización automática con Moodle",
            "Organización por semestre y materia",
            "Vista kanban, lista y calificaciones",
            "Funciona en cualquier dispositivo",
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--tx2)" }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--blue)" }} />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-10">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--blue)" }}>
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" fill="white"/>
                <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.8"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: "var(--tx)" }}>MoodleSync</div>
              <div className="text-[9px]" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>by ONYX Inc.</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--tx)", letterSpacing: "-.5px" }}>
              Bienvenido de vuelta
            </h2>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--tx2)" }}>
              Gestiona todas tus tareas del ITCG en un solo lugar.<br />
              Organizado, claro, sin excusas.
            </p>
          </div>

          <LoginForm hasError={hasError} />

          <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid var(--b1)" }}>
            <p className="text-[11px] leading-relaxed" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Mismas credenciales del portal ITCG<br />
              <span style={{ color: "var(--tx)" }}>TecNM Ciudad Guzmán</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

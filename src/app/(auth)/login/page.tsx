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

        {/* Animated accent lines — H */}
        <div className="absolute pointer-events-none" style={{
          left: 0, right: 0, top: "26%", height: "1px",
          background: "linear-gradient(to right, transparent 0%, rgba(75,140,248,0.55) 35%, rgba(75,140,248,0.55) 65%, transparent 100%)",
          animation: "line-h 1.1s cubic-bezier(.4,0,.2,1) 0.2s both",
        }} />
        <div className="absolute pointer-events-none" style={{
          left: 0, right: 0, top: "72%", height: "1px",
          background: "linear-gradient(to right, transparent 0%, rgba(75,140,248,0.35) 30%, rgba(75,140,248,0.35) 70%, transparent 100%)",
          animation: "line-h 1.2s cubic-bezier(.4,0,.2,1) 0.45s both",
        }} />

        {/* Animated accent lines — V */}
        <div className="absolute pointer-events-none" style={{
          top: 0, bottom: 0, left: "35%", width: "1px",
          background: "linear-gradient(to bottom, transparent 0%, rgba(75,140,248,0.4) 30%, rgba(75,140,248,0.4) 70%, transparent 100%)",
          animation: "line-v 1.3s cubic-bezier(.4,0,.2,1) 0.35s both",
        }} />
        <div className="absolute pointer-events-none" style={{
          top: 0, bottom: 0, left: "72%", width: "1px",
          background: "linear-gradient(to bottom, transparent 0%, rgba(75,140,248,0.25) 20%, rgba(75,140,248,0.25) 80%, transparent 100%)",
          animation: "line-v 1.4s cubic-bezier(.4,0,.2,1) 0.5s both",
        }} />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(75,140,248,.09) 0%,transparent 65%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-12 relative z-10 login-brand-h1"
          style={{ animationDelay: "0s" }}>
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

        <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4 relative z-10 login-brand-h1"
          style={{ letterSpacing: "-.8px" }}>
          <span style={{ color: "var(--tx)" }}>Organiza tu vida</span><br />
          <span className="gradient-text">académica.</span>
        </h1>
        <p className="text-[15px] leading-relaxed mb-10 relative z-10 max-w-[380px] login-brand-sub"
          style={{ color: "var(--tx2)" }}>
          Sincroniza tus tareas del ITCG automáticamente. Nunca más pierdas una fecha de entrega.
        </p>

        <div className="flex flex-col gap-3 relative z-10">
          {[
            { text: "Sincronización automática con Moodle", delay: "0.45s" },
            { text: "Organización por semestre y materia", delay: "0.55s" },
            { text: "Vista kanban, lista y calificaciones", delay: "0.65s" },
            { text: "Funciona en cualquier dispositivo", delay: "0.75s" },
          ].map(({ text, delay }) => (
            <div key={text} className="flex items-center gap-2.5 text-[13px] login-brand-feat"
              style={{ color: "var(--tx2)", animationDelay: delay }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--blue)" }} />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-10 relative"
        style={{ background: "var(--bg)" }}>

        {/* Subtle radial behind the form */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(75,140,248,.05) 0%, transparent 60%)" }} />

        <div className="w-full max-w-[380px] relative z-10">

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

          {/* Glass card */}
          <div className="rounded-2xl p-7"
            style={{
              background: "rgba(17,17,19,0.7)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(75,140,248,0.15)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.4)",
            }}>

            <div className="mb-7">
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
    </div>
  )
}

"use client"

import { useState, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { loginAction, type LoginState } from "@/app/(auth)/login/actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="submit-glow-btn w-full h-11 rounded-lg text-sm font-semibold text-white mt-1 cursor-pointer disabled:cursor-default"
      style={{ opacity: pending ? 0.72 : 1 }}
    >
      {pending ? "Verificando…" : "Iniciar sesión"}
    </button>
  )
}

export function LoginForm({ hasError }: { hasError: boolean }) {
  const initial: LoginState = { error: hasError ? "Usuario o contraseña incorrectos." : null }
  const [state, action] = useActionState(loginAction, initial)
  const [showPw, setShowPw] = useState(false)

  return (
    <form action={action} className="space-y-4">
      {/* Username */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1.5"
          style={{ fontFamily: "var(--mono)", color: "var(--tx2)", letterSpacing: ".1em" }}>
          Usuario ITCG
        </label>
        <input
          name="username"
          type="text"
          placeholder="ej. L25291016"
          autoComplete="username"
          required
          className="login-input w-full h-11 rounded-lg px-3.5 text-sm outline-none border transition-all"
          style={{ background: "rgba(26,26,29,0.32)", borderColor: "rgba(255,255,255,0.06)", color: "var(--tx)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-1.5"
          style={{ fontFamily: "var(--mono)", color: "var(--tx2)", letterSpacing: ".1em" }}>
          Contraseña
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••••"
            autoComplete="current-password"
            required
            className="login-input w-full h-11 rounded-lg px-3.5 pr-11 text-sm outline-none border transition-all"
            style={{ background: "rgba(26,26,29,0.32)", borderColor: "rgba(255,255,255,0.06)", color: "var(--tx)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded transition-all"
            style={{ background: "none", border: "none", color: "var(--tx2)", cursor: "pointer" }}
            tabIndex={-1}
            aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPw ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M6.5 6.56A2 2 0 0 0 9.44 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M4.2 4.27C2.8 5.18 1.8 6.5 1.5 8c.8 3.2 3.5 5.5 6.5 5.5 1.3 0 2.5-.4 3.5-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M12.5 11.2C13.6 10.2 14.3 9.2 14.5 8c-.8-3.2-3.5-5.5-6.5-5.5-.8 0-1.6.15-2.3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1.5 8C2.3 4.8 5 2.5 8 2.5S13.7 4.8 14.5 8c-.8 3.2-3.5 5.5-6.5 5.5S2.3 11.2 1.5 8z" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
          style={{ background: "var(--red-d)", border: "1px solid var(--red-b)" }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 mt-0.5">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="var(--red)" strokeWidth="1.2"/>
            <path d="M6.5 4v3.5M6.5 9.5v.2" stroke="var(--red)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <p className="text-xs leading-relaxed" style={{ fontFamily: "var(--mono)", color: "var(--red)" }}>
            {state.error}
          </p>
        </div>
      )}

      <SubmitButton />
    </form>
  )
}

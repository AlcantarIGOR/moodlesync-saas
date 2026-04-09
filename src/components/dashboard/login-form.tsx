"use client"

import { useState } from "react"
import { loginAction } from "@/app/(auth)/login/actions"

export function LoginForm({ hasError }: { hasError: boolean }) {
  const [showPw, setShowPw] = useState(false)

  return (
    <form action={loginAction} className="space-y-4">
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
          className="login-input w-full h-11 rounded-lg px-3.5 text-sm outline-none transition-all"
          style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx)" }}
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
            className="login-input w-full h-11 rounded-lg px-3.5 pr-11 text-sm outline-none transition-all"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx)" }}
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
              /* Eye-off */
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M6.5 6.56A2 2 0 0 0 9.44 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M4.2 4.27C2.8 5.18 1.8 6.5 1.5 8c.8 3.2 3.5 5.5 6.5 5.5 1.3 0 2.5-.4 3.5-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M12.5 11.2C13.6 10.2 14.3 9.2 14.5 8c-.8-3.2-3.5-5.5-6.5-5.5-.8 0-1.6.15-2.3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            ) : (
              /* Eye */
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1.5 8C2.3 4.8 5 2.5 8 2.5S13.7 4.8 14.5 8c-.8 3.2-3.5 5.5-6.5 5.5S2.3 11.2 1.5 8z" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {hasError && (
        <div className="rounded-lg px-3.5 py-2.5 text-xs"
          style={{ background: "var(--red-d)", border: "1px solid var(--red-b)", color: "var(--red)", fontFamily: "var(--mono)" }}>
          Usuario o contraseña incorrectos.
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.98] mt-1"
        style={{ background: "var(--blue)", border: "none" }}
      >
        Iniciar sesión
      </button>
    </form>
  )
}

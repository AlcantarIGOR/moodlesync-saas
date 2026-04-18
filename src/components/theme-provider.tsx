"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const saved = localStorage.getItem("ms-theme") as Theme | null
    const initial = saved ?? "dark"
    setTheme(initial)
    if (initial === "light") document.documentElement.classList.add("light")
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      if (next === "light") document.documentElement.classList.add("light")
      else document.documentElement.classList.remove("light")
      localStorage.setItem("ms-theme", next)
      return next
    })
  }

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)

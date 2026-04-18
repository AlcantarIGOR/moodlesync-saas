"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { usePathname } from "next/navigation"

gsap.registerPlugin(useGSAP)

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const pathname = usePathname()

  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.38, ease: "power2.out", clearProps: "transform" }
    )
  }, { dependencies: [pathname], scope: ref })

  return (
    <main ref={ref} className="flex-1 overflow-y-auto" style={{ opacity: 0 }}>
      {children}
    </main>
  )
}

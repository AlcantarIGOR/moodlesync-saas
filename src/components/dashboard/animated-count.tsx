"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

gsap.registerPlugin(useGSAP)

export function AnimatedCount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const el = ref.current
    if (!el || value === 0) {
      if (el) el.textContent = String(value)
      return
    }
    const obj = { v: 0 }
    gsap.to(obj, {
      v: value,
      duration: 0.75,
      ease: "power1.out",
      delay: 0.2,
      onUpdate() {
        if (el) el.textContent = String(Math.round(obj.v))
      },
    })
  }, { dependencies: [value] })

  return <span ref={ref}>{value}</span>
}

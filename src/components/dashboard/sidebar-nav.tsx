"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { AnimatedCount } from "@/components/dashboard/animated-count"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
  accent?: boolean
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const sem = searchParams.get("sem")
  const currentFilter = searchParams.get("filter") ?? ""

  function buildHref(href: string) {
    // Preserve ?sem param when navigating between dashboard pages
    if (!sem) return href
    const [base, qs] = href.split("?")
    const params = new URLSearchParams(qs ?? "")
    params.set("sem", sem)
    return `${base}?${params.toString()}`
  }

  function isActive(href: string): boolean {
    const [hrefBase, hrefQs] = href.split("?")
    if (pathname !== hrefBase && !(hrefBase !== "/dashboard" && pathname.startsWith(hrefBase))) return false
    // If the link has a filter param, the current filter must match
    const linkFilter = new URLSearchParams(hrefQs ?? "").get("filter") ?? ""
    return linkFilter === currentFilter
  }

  return (
    <div className="space-y-0.5">
      {items.map(({ href, label, icon, badge, accent }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={buildHref(href)}
            className="flex items-center gap-2 px-2 py-[7px] rounded-lg text-[13px] transition-all group"
            style={{
              background: active ? "var(--blue-d)" : "transparent",
              color: active ? "var(--blue)" : accent ? "var(--blue)" : "var(--tx2)",
              border: active ? "1px solid var(--blue-b)" : "1px solid transparent",
            }}
          >
            <span className="w-[15px] h-[15px] shrink-0" style={{ opacity: active ? 1 : accent ? 1 : 0.65 }}>
              {icon}
            </span>
            <span className="flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className="text-[10px] rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                style={{
                  fontFamily: "var(--mono)",
                  background: active ? "rgba(75,140,248,.2)" : "var(--s2)",
                  color: active ? "var(--blue)" : "var(--tx2)",
                }}
              >
                <AnimatedCount value={badge} />
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

export function SidebarSection({ label }: { label: string }) {
  return (
    <div
      className="px-2 pt-3 pb-1 text-[9px] uppercase tracking-[.12em]"
      style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}
    >
      {label}
    </div>
  )
}

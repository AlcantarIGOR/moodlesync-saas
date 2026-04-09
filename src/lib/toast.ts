export type ToastType = "success" | "error" | "info"

export function toast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("moodlesync:toast", { detail: { message, type } })
  )
}

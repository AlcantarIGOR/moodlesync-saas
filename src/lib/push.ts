import webpush from "web-push"

let vapidReady = false

function initVapid() {
  if (vapidReady) return true
  const subject = process.env.VAPID_SUBJECT
  const pub     = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv    = process.env.VAPID_PRIVATE_KEY
  if (!subject || !pub || !priv) {
    console.warn("[push] VAPID env vars not set — push notifications disabled")
    return false
  }
  webpush.setVapidDetails(subject, pub, priv)
  vapidReady = true
  return true
}

export type PushPayload = {
  title: string
  body: string
  url?: string
}

type PushError = { statusCode?: number }

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<"ok" | "expired" | "disabled"> {
  if (!initVapid()) return "disabled"
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload)
    )
    return "ok"
  } catch (err: unknown) {
    const status = (err as PushError)?.statusCode
    // 404/410 = subscription expired or revoked — caller should delete it
    if (status === 410 || status === 404) return "expired"
    console.error("[push] sendPush error:", err)
    // Transient error — do NOT delete the subscription
    return "ok"
  }
}

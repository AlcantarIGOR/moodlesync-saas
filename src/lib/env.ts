const REQUIRED_PROD_ENV = [
  "DATABASE_URL",
  "MOODLE_BASE_URL",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
] as const

let validated = false

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0)
}

export function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
}

function hasValidEncryptionKey(): boolean {
  const key = process.env.MINDBOX_ENCRYPTION_KEY
  return typeof key === "string" && /^[0-9a-f]{64}$/i.test(key)
}

export function validateRequiredEnv(): void {
  if (validated || process.env.NODE_ENV !== "production") return

  const missing: string[] = REQUIRED_PROD_ENV.filter(
    (name) => !hasValue(process.env[name])
  )

  if (!hasValue(getAuthSecret())) {
    missing.push("AUTH_SECRET (or NEXTAUTH_SECRET)")
  }

  if (!hasValidEncryptionKey()) {
    missing.push("MINDBOX_ENCRYPTION_KEY (64-char hex)")
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing or invalid production environment variables: ${missing.join(", ")}`
    )
  }

  validated = true
}

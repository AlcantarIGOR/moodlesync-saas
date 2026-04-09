import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGO = "aes-256-gcm"
const ENCRYPTED_PREFIX = "enc1:"  // version marker to detect encrypted values

function getKey(): Buffer {
  const hex = process.env.MINDBOX_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error("MINDBOX_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)")
  }
  return Buffer.from(hex, "hex")
}

export function encryptPassword(plaintext: string): string {
  const key = getKey()
  const iv  = randomBytes(12)                          // 96-bit IV for GCM
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag   = cipher.getAuthTag()
  // Format: enc1:<iv_b64>:<tag_b64>:<data_b64>
  return `${ENCRYPTED_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`
}

export function decryptPassword(stored: string): string {
  // Transparent migration: if not encrypted yet, return as-is
  if (!stored.startsWith(ENCRYPTED_PREFIX)) return stored

  const parts = stored.slice(ENCRYPTED_PREFIX.length).split(":")
  if (parts.length !== 3) throw new Error("Invalid encrypted password format")

  const [ivB64, tagB64, dataB64] = parts
  const key      = getKey()
  const iv       = Buffer.from(ivB64, "base64")
  const authTag  = Buffer.from(tagB64, "base64")
  const data     = Buffer.from(dataB64, "base64")
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(data) + decipher.final("utf8")
}

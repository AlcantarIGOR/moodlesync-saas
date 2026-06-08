import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { encryptPassword, decryptPassword } from "./crypto"

const VALID_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" // 64 hex chars (32 bytes)

describe("crypto.ts - Cifrado y Descifrado", () => {
  const originalEnvKey = process.env.MINDBOX_ENCRYPTION_KEY

  beforeEach(() => {
    // Limpiar env antes de cada test
    delete process.env.MINDBOX_ENCRYPTION_KEY
  })

  afterEach(() => {
    // Restaurar env original
    process.env.MINDBOX_ENCRYPTION_KEY = originalEnvKey
  })

  it("debe lanzar un error si MINDBOX_ENCRYPTION_KEY no está configurada al cifrar", () => {
    expect(() => encryptPassword("supersecret")).toThrowError(
      "MINDBOX_ENCRYPTION_KEY must be a 64-char hex string"
    )
  })

  it("debe lanzar un error si MINDBOX_ENCRYPTION_KEY no es válida (ej. longitud incorrecta)", () => {
    process.env.MINDBOX_ENCRYPTION_KEY = "1234"
    expect(() => encryptPassword("supersecret")).toThrowError(
      "MINDBOX_ENCRYPTION_KEY must be a 64-char hex string"
    )
  })

  it("debe cifrar y descifrar correctamente con una clave válida", () => {
    process.env.MINDBOX_ENCRYPTION_KEY = VALID_KEY
    const plaintext = "mi_password_secreta_123"

    const encrypted = encryptPassword(plaintext)
    expect(encrypted.startsWith("enc1:")).toBe(true)
    expect(encrypted).not.toContain(plaintext)

    const decrypted = decryptPassword(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it("debe retornar el texto plano directamente si no tiene el prefijo de cifrado (migración transparente)", () => {
    process.env.MINDBOX_ENCRYPTION_KEY = VALID_KEY
    const plaintext = "password_plano_viejo"

    const decrypted = decryptPassword(plaintext)
    expect(decrypted).toBe(plaintext)
  })

  it("debe lanzar un error si el formato del texto cifrado es inválido", () => {
    process.env.MINDBOX_ENCRYPTION_KEY = VALID_KEY
    const invalidEncrypted = "enc1:algo_incompleto:sin_partes"

    expect(() => decryptPassword(invalidEncrypted)).toThrow()
  })

  it("debe fallar la autenticación/descifrado si se altera el authTag o los datos cifrados", () => {
    process.env.MINDBOX_ENCRYPTION_KEY = VALID_KEY
    const encrypted = encryptPassword("password")
    
    // El formato es enc1:iv:tag:data
    const parts = encrypted.split(":")
    // Modificar el primer carácter del tag para alterar los bytes decodificados
    parts[2] = (parts[2].startsWith("A") ? "B" : "A") + parts[2].substring(1)
    const corrupted = parts.join(":")

    expect(() => decryptPassword(corrupted)).toThrow()
  })
})

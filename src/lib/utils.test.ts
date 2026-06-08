import { describe, it, expect } from "vitest"
import { detectSem } from "./utils"
import { stripHtml } from "./moodle"

describe("utils.ts - detectSem (Detección de Semestres)", () => {
  it("debe retornar Semestre 1 para materias con palabras clave de primer semestre", () => {
    expect(detectSem("Fundamentos de Programación")).toBe(1)
    expect(detectSem("Cálculo Diferencial")).toBe(1)
    expect(detectSem("Desarrollo Sustentable")).toBe(1)
    expect(detectSem("Química General")).toBe(1)
  })

  it("debe retornar Semestre 2 para materias con palabras clave de segundo semestre", () => {
    expect(detectSem("Programación Orientada a Objetos")).toBe(2)
    expect(detectSem("Bases de Datos")).toBe(2)
    expect(detectSem("Taller de Ética")).toBe(2)
    expect(detectSem("Cálculo Integral")).toBe(2)
  })

  it("debe retornar Semestre 3 para materias de tercer semestre", () => {
    expect(detectSem("Estructuras de Datos")).toBe(3)
    expect(detectSem("Métodos Numéricos")).toBe(3)
    expect(detectSem("Ingeniería de Software")).toBe(3)
  })

  it("debe retornar Semestre 4 para materias de cuarto semestre", () => {
    expect(detectSem("Inteligencia Artificial")).toBe(4)
    expect(detectSem("Robótica Industrial")).toBe(4)
    expect(detectSem("Señales y Sistemas")).toBe(4)
  })

  it("debe retornar Semestre 5 para materias de quinto semestre", () => {
    expect(detectSem("Tópicos Avanzados de Programación")).toBe(5)
    expect(detectSem("Sistemas Distribuidos")).toBe(5)
    expect(detectSem("Proyecto Integrador I")).toBe(5)
  })

  it("debe retornar Semestre 6 para residencia o actividades finales", () => {
    expect(detectSem("Residencia Profesional")).toBe(6)
    expect(detectSem("Seminario de Tesis")).toBe(6)
  })

  it("debe retornar 0 para materias sin coincidencias", () => {
    expect(detectSem("Materia Desconocida X")).toBe(0)
  })

  it("debe ser insensible a mayúsculas/minúsculas", () => {
    expect(detectSem("BASES DE DATOS")).toBe(2)
    expect(detectSem("cálculo integral")).toBe(2)
  })
})

describe("moodle.ts - stripHtml (Limpieza de HTML)", () => {
  it("debe remover etiquetas HTML simples", () => {
    expect(stripHtml("<p>Hola Mundo</p>")).toBe("Hola Mundo")
  })

  it("debe decodificar entidades HTML comunes", () => {
    expect(stripHtml("Hola&nbsp;Mundo &amp; Todos")).toBe("Hola Mundo & Todos")
    expect(stripHtml("Menor &lt; Mayor &gt;")).toBe("Menor < Mayor >")
    expect(stripHtml("&quot;Comillas&quot; y &#39;Apostrofe&#39;")).toBe('"Comillas" y \'Apostrofe\'')
  })

  it("debe colapsar múltiples espacios consecutivos en uno solo", () => {
    expect(stripHtml("<p>Hola    \n   Mundo</p>")).toBe("Hola Mundo")
  })
})

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SEM_KW: Record<number, string[]> = {
  1: ["fundamentos","desarrollo sustentable","sustentable","calculo diferencial","diferencial",
      "algebra lineal basica","algebra basica","matematicas discretas","discreta",
      "algoritmos","logica","cle1","liderazgo i","programacion basica","taller de programacion",
      "introduccion a","sistemas digitales","electricidad"],
  2: ["calculo integral","integral","probabilidad","estadistica","estadística",
      "poo","orientada a objetos","bases de datos","base de datos",
      "cle2","liderazgo ii","taller de etica","etica",
      "sistemas operativos","redes","arquitectura"],
  3: ["estructuras de datos","metodos numericos","métodos numéricos",
      "algebra lineal avanzada","investigacion de operaciones",
      "ingenieria de software","desarrollo web"],
  4: ["inteligencia artificial","machine learning","aprendizaje automatico",
      "redes neuronales","vision computacional","procesamiento de lenguaje",
      "mineria de datos","big data"],
  5: ["topicos avanzados","sistemas distribuidos","seguridad informatica","proyecto integrador i"],
  6: ["residencia","estadia","estadía","proyecto terminal","seminario","proyecto final"],
}

/** Detecta el semestre de un curso por su nombre. Retorna 0 si no se puede determinar. */
export function detectSem(courseName: string): number {
  const lower = courseName.toLowerCase()
  for (const [sem, keywords] of Object.entries(SEM_KW)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return parseInt(sem)
    }
  }
  return 0
}

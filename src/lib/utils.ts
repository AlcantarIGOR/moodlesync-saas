import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SEM_KW: Record<number, string[]> = {
  1: [
    // ISC / común a todas las carreras
    "fundamentos","desarrollo sustentable","sustentable","calculo diferencial","diferencial",
    "algebra lineal basica","algebra basica","matematicas discretas","discreta",
    "algoritmos","logica","cle1","liderazgo i","programacion basica","taller de programacion",
    "introduccion a","sistemas digitales","electricidad",
    // Industrial / Mecatrónica / Electrónica
    "dibujo","expresion grafica","metrologia","metrología","quimica","química",
    "procesos de manufactura i","manufactura i",
    // Bioquímica
    "biologia celular","bioquimica general","bioquímica general","quimica organica","orgánica",
    // Administración
    "contabilidad","fundamentos de administracion","administracion i",
  ],
  2: [
    // ISC / común
    "calculo integral","integral","probabilidad","estadistica","estadística",
    "poo","orientada a objetos","bases de datos","base de datos",
    "cle2","liderazgo ii","taller de etica","etica",
    "sistemas operativos","redes","arquitectura",
    // Industrial / Mecatrónica
    "estática","estatica","dinamica","dinámica","termodinamica","termodinámica",
    "procesos de manufactura ii","manufactura ii","materiales","resistencia",
    // Electrónica
    "circuitos","electronica analogica","electrónica analógica","electronica digital",
    // Bioquímica
    "microbiologia","microbiología","bioquimica metabolica","fisiologia",
    // Administración
    "contabilidad de costos","matematicas financieras","mercadotecnia","microeconomia",
  ],
  3: [
    // ISC
    "estructuras de datos","metodos numericos","métodos numéricos",
    "algebra lineal avanzada","investigacion de operaciones",
    "ingenieria de software","desarrollo web",
    // Industrial / Mecatrónica
    "control","automatizacion","automatización","manufactura avanzada",
    "mecanismos","diseño mecanico","mecánico","hidraulica","hidráulica","neumatica",
    // Electrónica
    "sistemas de control","microcontroladores","microprocesadores","programacion de sistemas",
    // Bioquímica
    "biotecnologia","biotecnología","genetica","genética","biologia molecular",
    // Administración
    "administracion de operaciones","finanzas","recursos humanos","derecho empresarial",
  ],
  4: [
    // ISC
    "inteligencia artificial","machine learning","aprendizaje automatico",
    "redes neuronales","vision computacional","procesamiento de lenguaje",
    "mineria de datos","big data",
    // Industrial / Mecatrónica
    "robotica","robótica","sistemas embebidos","manufactura integrada","plc","scada",
    "gestion de calidad","gestión de calidad","lean","six sigma",
    // Electrónica
    "telecomunicaciones","antenas","señales","procesamiento de señales",
    // Bioquímica
    "bioprocesos","ingenieria de bioprocesos","bioreactores","inmunologia",
    // Administración
    "administracion estrategica","comportamiento organizacional","logistica","supply chain",
  ],
  5: [
    // ISC
    "topicos avanzados","sistemas distribuidos","seguridad informatica","proyecto integrador i",
    // Industrial / Mecatrónica / Electrónica
    "proyecto integrador","gestion de proyectos","gestión de proyectos",
    "produccion","producción","mantenimiento","simulacion","simulación",
    // Bioquímica
    "formulacion de proyectos","formulación","analisis instrumental","análisis instrumental",
    // Administración
    "plan de negocios","emprendimiento","auditoria","auditoría",
  ],
  6: [
    "residencia","estadia","estadía","proyecto terminal","seminario","proyecto final",
    "estadía profesional","residencia profesional","memoria","tesis",
  ],
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

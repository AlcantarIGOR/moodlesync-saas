import { vi, describe, it, expect, beforeEach } from "vitest"
import { syncUserTasks } from "./sync"
import { db } from "./db"
import { getEnrolledCourses, getCourseAssignments, getSubmissionStatuses } from "./moodle"

// Mock the database client
vi.mock("./db", () => ({
  db: {
    task: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

// Mock the moodle api helper
vi.mock("./moodle", () => ({
  getEnrolledCourses: vi.fn(),
  getCourseAssignments: vi.fn(),
  getSubmissionStatuses: vi.fn(),
}))

describe("sync.ts - Sincronización de tareas Moodle -> DB", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.task.findMany).mockImplementation(async (args: any) => {
      if (args?.where?.status === "DONE") return []
      return []
    })
  })

  it("debe retornar 0 si no hay cursos visibles", async () => {
    // getEnrolledCourses retorna arreglo vacío o con cursos no visibles (visible === 0)
    vi.mocked(getEnrolledCourses).mockResolvedValue([
      { id: 101, fullname: "Matemáticas Discretas", shortname: "MD1", visible: 0 },
    ])

    const count = await syncUserTasks("user_123", "moodle_token_xyz", 999)

    expect(count).toBe(0)
    expect(getCourseAssignments).not.toHaveBeenCalled()
    expect(db.task.findMany).not.toHaveBeenCalled()
  })

  it("debe crear nuevas tareas si no existen en la base de datos", async () => {
    // 1. Mock de cursos matriculados y visibles
    vi.mocked(getEnrolledCourses).mockResolvedValue([
      { id: 101, fullname: "Bases de Datos", shortname: "BD1", visible: 1 },
      { id: 102, fullname: "Cálculo Integral", shortname: "CI2", visible: 1 },
    ])

    // 2. Mock de tareas de Moodle
    vi.mocked(getCourseAssignments).mockResolvedValue([
      {
        id: 5001,
        course: 101,
        name: "Proyecto Final SQL",
        intro: "Hacer 29 consultas en SQL Server",
        duedate: 1770000000, // timestamp futuro
        cmid: 901,
        introattachments: [],
      },
      {
        id: 5002,
        course: 102,
        name: "Ejercicios Métodos de Integración",
        intro: "Subir PDF resuelto",
        duedate: 1770000000,
        cmid: 902,
        introattachments: [],
      },
    ])

    // 3. Mock de estados de entrega (ninguno entregado)
    const submissionMap = new Map<number, boolean>()
    submissionMap.set(5001, false)
    submissionMap.set(5002, false)
    vi.mocked(getSubmissionStatuses).mockResolvedValue(submissionMap)

    // 4. Mock de base de datos vacía (no hay tareas preexistentes)
    // Usará el mockImplementation por defecto definido en el beforeEach

    // Ejecutar
    const count = await syncUserTasks("user_123", "moodle_token_xyz", 999)

    // Aseverar
    expect(count).toBe(2)
    expect(getEnrolledCourses).toHaveBeenCalledWith("moodle_token_xyz", 999)
    expect(getCourseAssignments).toHaveBeenCalledWith("moodle_token_xyz", [101, 102])
    expect(db.task.createMany).toHaveBeenCalledOnce()

    const createCallArgs = vi.mocked(db.task.createMany).mock.calls[0][0]
    expect(createCallArgs.data).toHaveLength(2)
    
    // Validar detección de semestre
    const basesTask = createCallArgs.data.find(t => t.moodleAssignmentId === 5001)
    const calculoTask = createCallArgs.data.find(t => t.moodleAssignmentId === 5002)

    // 'bases de datos' clave mapea a Semestre 2
    expect(basesTask?.semester).toBe(2)
    // 'calculo integral' o 'integral' clave mapea a Semestre 2
    expect(calculoTask?.semester).toBe(2)
    
    expect(basesTask?.status).toBe("PENDING")
  })

  it("debe omitir la creación/actualización de tareas que no han cambiado", async () => {
    vi.mocked(getEnrolledCourses).mockResolvedValue([
      { id: 101, fullname: "Bases de Datos", shortname: "BD1", visible: 1 },
    ])

    const duedateTimestamp = 1770000000
    const duedateDate = new Date(duedateTimestamp * 1000)

    vi.mocked(getCourseAssignments).mockResolvedValue([
      {
        id: 5001,
        course: 101,
        name: "Proyecto Final SQL",
        intro: "Hacer 29 consultas en SQL Server",
        duedate: duedateTimestamp,
        cmid: 901,
        introattachments: [],
      },
    ])

    const submissionMap = new Map<number, boolean>()
    submissionMap.set(5001, false)
    vi.mocked(getSubmissionStatuses).mockResolvedValue(submissionMap)

    // La tarea ya existe en la BD con exactamente los mismos valores
    vi.mocked(db.task.findMany).mockImplementation(async (args: any) => {
      if (args?.where?.status === "DONE") return []
      return [
        {
          moodleAssignmentId: 5001,
          title: "Proyecto Final SQL",
          courseId: 101,
          courseName: "Bases de Datos",
          semester: 2,
          dueDate: duedateDate,
          status: "PENDING",
          description: "Hacer 29 consultas en SQL Server",
          attachments: null,
        } as any,
      ]
    })

    await syncUserTasks("user_123", "moodle_token_xyz", 999)

    expect(db.task.createMany).not.toHaveBeenCalled()
    expect(db.task.updateMany).not.toHaveBeenCalled()
  })

  it("debe actualizar el estado a DONE si Moodle marca la tarea como entregada", async () => {
    vi.mocked(getEnrolledCourses).mockResolvedValue([
      { id: 101, fullname: "Bases de Datos", shortname: "BD1", visible: 1 },
    ])

    const duedateTimestamp = 1770000000
    const duedateDate = new Date(duedateTimestamp * 1000)

    vi.mocked(getCourseAssignments).mockResolvedValue([
      {
        id: 5001,
        course: 101,
        name: "Proyecto Final SQL",
        intro: "Hacer 29 consultas en SQL Server",
        duedate: duedateTimestamp,
        cmid: 901,
        introattachments: [],
      },
    ])

    // Moodle dice que SÍ está enviada (submitted: true)
    const submissionMap = new Map<number, boolean>()
    submissionMap.set(5001, true)
    vi.mocked(getSubmissionStatuses).mockResolvedValue(submissionMap)

    // Pero en la base de datos está como PENDING
    vi.mocked(db.task.findMany).mockImplementation(async (args: any) => {
      if (args?.where?.status === "DONE") return []
      return [
        {
          moodleAssignmentId: 5001,
          title: "Proyecto Final SQL",
          courseId: 101,
          courseName: "Bases de Datos",
          semester: 2,
          dueDate: duedateDate,
          status: "PENDING",
          description: "Hacer 29 consultas en SQL Server",
          attachments: null,
        } as any,
      ]
    })

    await syncUserTasks("user_123", "moodle_token_xyz", 999)

    expect(db.task.createMany).not.toHaveBeenCalled()
    expect(db.task.updateMany).toHaveBeenCalledOnce()
    
    const updateCall = vi.mocked(db.task.updateMany).mock.calls[0][0]
    expect(updateCall.data.status).toBe("DONE")
  })
})

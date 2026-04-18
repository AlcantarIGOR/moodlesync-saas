"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Task } from "@prisma/client"
import { toast } from "@/lib/toast"

type SubmitState = "idle" | "compressing" | "uploading" | "success" | "error"

// ── PDF compression (client-side) ──────────────────────────────────────────
// Renders each page to canvas, encodes as JPEG 75%, rebuilds with pdf-lib.
// Works entirely in the browser — no server needed, bypasses Vercel body limit.
async function compressPdf(
  file: File,
  onProgress: (page: number, total: number) => void
): Promise<File> {
  const pdfjsLib = await import("pdfjs-dist")
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const { PDFDocument } = await import("pdf-lib")

  const arrayBuffer = await file.arrayBuffer()
  const srcDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  const numPages = srcDoc.numPages
  const newPdf = await PDFDocument.create()

  for (let i = 1; i <= numPages; i++) {
    onProgress(i, numPages)
    const page = await srcDoc.getPage(i)

    // Cap width at 1200 px to reduce resolution for scan-heavy PDFs
    const baseVp = page.getViewport({ scale: 1 })
    const maxW = 1200
    const scale = baseVp.width > maxW ? maxW / baseVp.width : 1
    const vp = page.getViewport({ scale })

    const canvas = document.createElement("canvas")
    canvas.width = vp.width
    canvas.height = vp.height
    const ctx = canvas.getContext("2d")!
    await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise

    // JPEG 75%
    const dataUrl = canvas.toDataURL("image/jpeg", 0.75)
    const b64 = dataUrl.split(",")[1]
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j)

    const img = await newPdf.embedJpg(bytes)
    const pdfPage = newPdf.addPage([vp.width, vp.height])
    pdfPage.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height })

    // Free canvas memory immediately
    canvas.width = 0
    canvas.height = 0
  }

  const out = await newPdf.save()
  const name = file.name.replace(/\.pdf$/i, "") + "_comprimido.pdf"
  return new File([out.buffer as ArrayBuffer], name, { type: "application/pdf" })
}

function fmtMB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function PendingFilePanel({
  file, limit, onConfirm, onChangePick, onCancel,
}: {
  file: File
  limit: number
  onConfirm: () => void
  onChangePick: () => void
  onCancel: () => void
}) {
  const needsCompress = file.size > limit
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${needsCompress ? "var(--amber-b)" : "var(--b1)"}` }}>
      <div className="flex items-center gap-3 px-3 py-2.5"
        style={{ background: needsCompress ? "var(--amber-d)" : "var(--s2)" }}>
        <span className="text-base shrink-0">📕</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] truncate" style={{ color: "var(--tx)", fontFamily: "var(--mono)" }}>
            {file.name}
          </p>
          <p className="text-[10px]" style={{ color: needsCompress ? "var(--amber)" : "var(--tx3)", fontFamily: "var(--mono)" }}>
            {fmtMB(file.size)}{needsCompress ? " · supera el límite de 4 MB" : ""}
          </p>
        </div>
      </div>
      <div className="flex gap-2 px-3 py-2.5" style={{ background: "var(--s2)", borderTop: "1px solid var(--b1)" }}>
        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold transition-all"
          style={{ background: "var(--blue)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--mono)" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 9V3M3 6l3-3 3 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 10h10" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {needsCompress ? "Comprimir y entregar" : "Entregar"}
        </button>
        <button
          onClick={onChangePick}
          className="h-8 px-3 rounded-lg text-[11px] transition-all"
          style={{ background: "var(--s3)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer", fontFamily: "var(--mono)" }}
        >
          Cambiar
        </button>
        <button
          onClick={onCancel}
          className="h-8 px-3 rounded-lg text-[11px] transition-all"
          style={{ background: "transparent", border: "1px solid var(--b1)", color: "var(--tx3)", cursor: "pointer", fontFamily: "var(--mono)" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

interface MoodleFile {
  filename: string
  fileurl: string
  filesize: number
  mimetype?: string
}

function fileIcon(mimetype?: string) {
  if (!mimetype) return "📄"
  if (mimetype.includes("pdf")) return "📕"
  if (mimetype.includes("image")) return "🖼️"
  if (mimetype.includes("word") || mimetype.includes("document")) return "📝"
  if (mimetype.includes("zip") || mimetype.includes("compressed")) return "📦"
  if (mimetype.includes("spreadsheet") || mimetype.includes("excel")) return "📊"
  return "📄"
}

function formatSize(bytes: number): string {
  if (bytes === 0) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(date: Date | null): string {
  if (!date) return "Sin fecha"
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function taskStatus(task: Task): "completada" | "vencida" | "urgente" | "pendiente" {
  if (task.status === "DONE") return "completada"
  if (task.status === "ARCHIVED") return "pendiente"
  if (!task.dueDate) return "pendiente"
  const now = Date.now()
  const due = new Date(task.dueDate).getTime()
  if (due < now) return "vencida"
  if (due - now < 3 * 86400000) return "urgente"
  return "pendiente"
}

const STATUS_STYLE = {
  vencida:    { label: "VENCIDA",    bg: "var(--red-d)",   color: "var(--red)",   border: "var(--red-b)" },
  urgente:    { label: "URGENTE",    bg: "var(--amber-d)", color: "var(--amber)", border: "var(--amber-b)" },
  pendiente:  { label: "PENDIENTE",  bg: "var(--blue-d)",  color: "var(--blue)",  border: "var(--blue-b)" },
  completada: { label: "COMPLETADA", bg: "var(--green-d)", color: "var(--green)", border: "var(--green-b)" },
}

interface Props {
  task: Task
  onClose: () => void
  moodleBaseUrl?: string
}

function SafeHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function sanitize() {
      if (!ref.current) return
      const DOMPurify = (await import("dompurify")).default
      ref.current.innerHTML = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["p","br","strong","b","em","i","u","ul","ol","li","h1","h2","h3","h4","a","img","span","div","pre","code","blockquote","table","thead","tbody","tr","th","td"],
        ALLOWED_ATTR: ["href","src","alt","title","target","rel","class","style"],
      })
    }
    sanitize()
  }, [html])

  return (
    <div
      ref={ref}
      className="moodle-html text-[12px] leading-relaxed"
      style={{ color: "var(--tx2)" }}
    />
  )
}

export function TaskDetailModal({ task, onClose, moodleBaseUrl }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [compressProgress, setCompressProgress] = useState<{ page: number; total: number } | null>(null)
  const [sizeInfo, setSizeInfo] = useState<{ before: number; after: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const status = taskStatus(task)
  const st = STATUS_STYLE[status]
  const done = status === "completada"
  const canSubmit = !!task.moodleAssignmentId
  const LIMIT = 4 * 1024 * 1024

  // Parse attachments from JSON
  const attachments: MoodleFile[] = Array.isArray(task.attachments)
    ? (task.attachments as unknown as MoodleFile[])
    : []

  async function toggle() {
    setLoading(true)
    const newStatus = done ? "PENDING" : "DONE"
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      toast(done ? "Marcada como pendiente" : "¡Tarea completada!", done ? "info" : "success")
      router.refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = useCallback(async (file: File, originalSize?: number) => {
    setSubmitState("uploading")
    setSubmitError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`/api/submit/${task.moodleAssignmentId}`, {
        method: "POST",
        body: formData,
      })

      const data: { ok?: boolean; error?: string } = await res.json()

      if (!res.ok || !data.ok) {
        const msg = data.error ?? "Error al entregar la tarea"
        setSubmitState("error")
        setSubmitError(msg)
        toast(msg, "error")
        return
      }

      if (originalSize) setSizeInfo({ before: originalSize, after: file.size })
      setSubmitState("success")
      toast("¡Tarea enviada a Moodle!", "success")
      router.refresh()
    } catch {
      setSubmitState("error")
      setSubmitError("Error de conexión")
      toast("Error de conexión al enviar", "error")
    }
  }, [task.moodleAssignmentId, router])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !task.moodleAssignmentId) return
    e.target.value = ""

    if (file.type !== "application/pdf") {
      toast("Solo se aceptan archivos PDF", "error")
      return
    }

    // Always show confirmation panel first
    setSizeInfo(null)
    setSubmitError(null)
    setSubmitState("idle")
    setPendingFile(file)
  }, [task.moodleAssignmentId, LIMIT, uploadFile])

  const handleCompressAndUpload = useCallback(async () => {
    if (!pendingFile) return
    const originalSize = pendingFile.size

    setSubmitState("compressing")
    setCompressProgress({ page: 0, total: 0 })

    try {
      const compressed = await compressPdf(pendingFile, (page, total) => {
        setCompressProgress({ page, total })
      })
      setPendingFile(null)
      await uploadFile(compressed, originalSize)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al comprimir"
      setSubmitState("error")
      setSubmitError(msg)
      toast(msg, "error")
    } finally {
      setCompressProgress(null)
    }
  }, [pendingFile, uploadFile])

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  // Moodle direct link (uses cmid if available)
  const moodleLink = task.moodleCmId && moodleBaseUrl
    ? `${moodleBaseUrl}/mod/assign/view.php?id=${task.moodleCmId}`
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col animate-fadein"
        style={{ background: "var(--card)", border: "1px solid var(--b1)", maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--b1)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--tx)" }}>
              {task.title}
            </p>
            {task.courseName && (
              <p className="text-[11px] mt-1 truncate" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                {task.courseName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Status + date row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[.06em]"
              style={{ fontFamily: "var(--mono)", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {st.label}
            </span>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 5h10" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 0.5v2M8 0.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {fmtDate(task.dueDate)}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {task.semester ? (
              <span className="rounded px-2 py-0.5 text-[10px]"
                style={{ fontFamily: "var(--mono)", background: "var(--s3)", color: "var(--tx2)", border: "1px solid var(--b1)" }}>
                {task.semester}° semestre
              </span>
            ) : null}
            {task.isManual && (
              <span className="rounded px-2 py-0.5 text-[10px]"
                style={{ fontFamily: "var(--mono)", background: "var(--s3)", color: "var(--tx3)", border: "1px solid var(--b1)" }}>
                manual
              </span>
            )}
          </div>

          {/* Description */}
          {task.description ? (
            <div>
              <p className="text-[10px] uppercase tracking-[.1em] mb-2"
                style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Descripción
              </p>
              <div className="rounded-xl p-3.5"
                style={{ background: "var(--s2)", border: "1px solid var(--b1)" }}>
                <SafeHtml html={task.description} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-3.5 text-center text-[11px]"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", fontFamily: "var(--mono)", color: "var(--tx3)" }}>
              Sin descripción
            </div>
          )}

          {/* PDF Submission */}
          {canSubmit && (
            <div>
              <p className="text-[10px] uppercase tracking-[.1em] mb-2"
                style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Entrega
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* ── Success ── */}
              {submitState === "success" ? (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--green-b)" }}>
                  <div className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: "var(--green-d)" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="var(--green)" strokeWidth="1.3"/>
                      <path d="M4 7l2 2 4-4" stroke="var(--green)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[12px]" style={{ fontFamily: "var(--mono)", color: "var(--green)" }}>
                      Entregado correctamente
                    </span>
                  </div>
                  {sizeInfo && (
                    <div className="px-3 py-2 flex items-center gap-2"
                      style={{ background: "var(--s2)" }}>
                      <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                        {fmtMB(sizeInfo.before)}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6h8M7 3l3 3-3 3" stroke="var(--green)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[11px] font-semibold" style={{ fontFamily: "var(--mono)", color: "var(--green)" }}>
                        {fmtMB(sizeInfo.after)}
                      </span>
                      <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                        (−{Math.round((1 - sizeInfo.after / sizeInfo.before) * 100)}%)
                      </span>
                    </div>
                  )}
                </div>

              /* ── Compression needed: show pending file panel ── */
              ) : pendingFile && submitState !== "compressing" && submitState !== "uploading" ? (
                <PendingFilePanel
                  file={pendingFile}
                  limit={LIMIT}
                  onConfirm={pendingFile.size > LIMIT ? handleCompressAndUpload : () => { void uploadFile(pendingFile) }}
                  onChangePick={() => { setPendingFile(null); fileInputRef.current?.click() }}
                  onCancel={() => setPendingFile(null)}
                />

              /* ── Compressing / Uploading progress ── */
              ) : submitState === "compressing" || submitState === "uploading" ? (
                <div className="px-3 py-3 rounded-xl"
                  style={{ background: "var(--s2)", border: "1px solid var(--b1)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="animate-spin shrink-0">
                      <circle cx="6.5" cy="6.5" r="5" stroke="var(--blue)" strokeWidth="1.3" strokeDasharray="9 6"/>
                    </svg>
                    <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                      {submitState === "compressing"
                        ? compressProgress && compressProgress.total > 0
                          ? `Comprimiendo… página ${compressProgress.page} de ${compressProgress.total}`
                          : "Comprimiendo…"
                        : "Subiendo a Moodle…"}
                    </span>
                  </div>
                  {submitState === "compressing" && compressProgress && compressProgress.total > 0 && (
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((compressProgress.page / compressProgress.total) * 100)}%`,
                          background: "var(--blue)",
                        }}
                      />
                    </div>
                  )}
                </div>

              /* ── Default: select button ── */
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[12px] font-medium transition-all"
                  style={{
                    background: "var(--s2)",
                    border: submitState === "error" ? "1.5px dashed var(--red)" : "1.5px dashed var(--b2)",
                    color: submitState === "error" ? "var(--red)" : "var(--tx2)",
                    cursor: "pointer",
                    fontFamily: "var(--mono)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 10V4M4 7l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  {submitState === "error" ? `Reintentar — ${submitError}` : "Seleccionar PDF y entregar"}
                </button>
              )}

              <p className="text-[10px] mt-1.5" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                {pendingFile && submitState === "idle"
                  ? "Se comprimirá el PDF antes de subir · sin pérdida visual significativa"
                  : "PDFs hasta 20 MB · compresión automática si supera 4 MB"}
              </p>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[.1em] mb-2"
                style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Archivos adjuntos · {attachments.length}
              </p>
              <div className="space-y-1.5">
                {attachments.map((file) => (
                  <a
                    key={file.fileurl}
                    href={`/api/moodle/file?url=${encodeURIComponent(file.fileurl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                    style={{ background: "var(--s2)", border: "1px solid var(--b1)", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--b2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--b1)")}
                  >
                    <span className="text-base shrink-0">{fileIcon(file.mimetype)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12px] truncate" style={{ color: "var(--tx)" }}>
                        {file.filename}
                      </span>
                      {file.filesize > 0 && (
                        <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                          {formatSize(file.filesize)}
                        </span>
                      )}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                      <path d="M2 10l8-8M10 2H4M10 2v6" stroke="var(--blue)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 flex items-center gap-2 shrink-0"
          style={{ borderTop: "1px solid var(--b1)" }}>
          {moodleLink && (
            <a
              href={moodleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs transition-all"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", textDecoration: "none" }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 9.5l8-8M9.5 1.5H4M9.5 1.5v5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ver en Moodle
            </a>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-xs transition-all"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
          >
            Cerrar
          </button>
          <button
            onClick={toggle}
            disabled={loading}
            className="h-9 px-4 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              background: done ? "var(--s2)" : "var(--green)",
              border: done ? "1px solid var(--b1)" : "none",
              color: done ? "var(--tx2)" : "#fff",
              cursor: "pointer",
            }}
          >
            {loading ? "..." : done ? "Marcar pendiente" : "Marcar como hecha"}
          </button>
        </div>
      </div>
    </div>
  )
}

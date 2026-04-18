import { auth } from "@/auth"
import { mCall } from "@/lib/moodle"
import { NextRequest, NextResponse } from "next/server"

const MAX_SIZE = 4 * 1024 * 1024 // 4 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignId: string }> }
) {
  const session = await auth()
  if (!session?.moodleToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { assignId: assignIdStr } = await params
  const assignId = parseInt(assignIdStr, 10)
  if (isNaN(assignId)) {
    return NextResponse.json({ error: "Invalid assignId" }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo supera el límite de 4 MB" }, { status: 400 })
  }

  const moodleBase = process.env.MOODLE_BASE_URL
  if (!moodleBase) {
    return NextResponse.json({ error: "MOODLE_BASE_URL not configured" }, { status: 500 })
  }

  // ── Step 1: Upload file to Moodle draft area ──────────────────────────────
  const uploadForm = new FormData()
  uploadForm.append("token", session.moodleToken)
  uploadForm.append("filearea", "draft")
  uploadForm.append("file", file, file.name)

  let draftItemId: number
  try {
    const uploadRes = await fetch(`${moodleBase}/webservice/upload.php`, {
      method: "POST",
      body: uploadForm,
    })

    const uploadData: unknown = await uploadRes.json()

    if (
      !Array.isArray(uploadData) ||
      uploadData.length === 0 ||
      typeof uploadData[0]?.itemid !== "number"
    ) {
      const msg = (uploadData as { error?: string })?.error ?? "Upload failed"
      return NextResponse.json({ error: `Moodle upload: ${msg}` }, { status: 502 })
    }

    draftItemId = uploadData[0].itemid as number
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload error"
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // ── Step 2: Save submission (attach draft file) ───────────────────────────
  try {
    await mCall(session.moodleToken, "mod_assign_save_submission", {
      assignmentid: assignId,
      "plugindata[files_filemanager]": draftItemId,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Save submission failed"
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // ── Step 3: Submit for grading ────────────────────────────────────────────
  try {
    await mCall(session.moodleToken, "mod_assign_submit_for_grading", {
      assignmentid: assignId,
      acceptsubmissionstatement: 0,
    })
  } catch (err) {
    // Some Moodle configs don't require this step — log but don't fail
    console.warn("mod_assign_submit_for_grading warning:", err)
  }

  return NextResponse.json({ ok: true })
}

import { auth } from "@/auth"
import { NextResponse } from "next/server"

const MOODLE_BASE = process.env.MOODLE_BASE_URL ?? ""

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.moodleToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const fileUrl = searchParams.get("url")

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  // Only allow proxying URLs from the configured Moodle instance
  try {
    const parsedFileUrl = new URL(fileUrl)
    const parsedBaseUrl = new URL(MOODLE_BASE)
    if (parsedFileUrl.protocol !== parsedBaseUrl.protocol || parsedFileUrl.host !== parsedBaseUrl.host) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
  }

  const fullUrl = `${fileUrl}?token=${session.moodleToken}`
  const upstream = await fetch(fullUrl)
  if (!upstream.ok) {
    return NextResponse.json({ error: "File not found" }, { status: upstream.status })
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"
  const disposition = upstream.headers.get("content-disposition")
  const headers: Record<string, string> = { "content-type": contentType }
  if (disposition) headers["content-disposition"] = disposition

  return new NextResponse(upstream.body, { headers })
}

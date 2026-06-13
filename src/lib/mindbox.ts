/**
 * Mindbox scraper — fetches grade boletas from itcdguzman.mindbox.app
 * Uses Node.js built-in fetch (Next.js 15+) with manual cookie handling.
 */

const BASE = "https://itcdguzman.mindbox.app"

interface MindboxSession {
  xsrf: string
  session: string
  ingress: string
}

export interface MindboxClassSession {
  dayOfWeek: number   // 0=Mon … 6=Sun
  subjectName: string
  startTime: string   // "13:00"
  endTime: string     // "15:00"
  room: string | null
  professor: string | null
  group: string | null
}

export interface MindboxGrade {
  period: string
  periodName: string
  subjectCode: string
  subjectName: string
  group: string
  credits: number
  finalGrade: number | null
  evalType: string | null
  partialGrades: (number | null)[]
}

function extractCookie(headers: Headers, name: string): string {
  const all = headers.getSetCookie ? headers.getSetCookie() : [headers.get("set-cookie") ?? ""]
  for (const line of all) {
    const match = line.match(new RegExp(`${name}=([^;]+)`))
    if (match) return match[1]
  }
  return ""
}

function extractToken(html: string): string {
  const m = html.match(/name="_token" value="([^"]+)"/)
  return m ? m[1] : ""
}

// ES2017-compatible: replace dotall /gs with pre-processing
function splitTables(html: string): string[] {
  const results: string[] = []
  let start = html.indexOf("<table")
  while (start !== -1) {
    const end = html.indexOf("</table>", start)
    if (end === -1) break
    results.push(html.slice(start, end + 8))
    start = html.indexOf("<table", end)
  }
  return results
}

function splitRows(tableHtml: string): string[] {
  const results: string[] = []
  let start = tableHtml.indexOf("<tr")
  while (start !== -1) {
    const end = tableHtml.indexOf("</tr>", start)
    if (end === -1) break
    results.push(tableHtml.slice(start, end + 5))
    start = tableHtml.indexOf("<tr", end)
  }
  return results
}

function splitCells(rowHtml: string): string[] {
  const results: string[] = []
  let pos = 0
  while (pos < rowHtml.length) {
    const tdStart = rowHtml.indexOf("<td", pos)
    const thStart = rowHtml.indexOf("<th", pos)
    let cellStart = -1
    let closeTag = ""
    if (tdStart === -1 && thStart === -1) break
    if (tdStart === -1) { cellStart = thStart; closeTag = "</th>" }
    else if (thStart === -1) { cellStart = tdStart; closeTag = "</td>" }
    else if (tdStart < thStart) { cellStart = tdStart; closeTag = "</td>" }
    else { cellStart = thStart; closeTag = "</th>" }
    const cellEnd = rowHtml.indexOf(closeTag, cellStart)
    if (cellEnd === -1) break
    const inner = rowHtml.slice(cellStart, cellEnd + closeTag.length)
    // Strip tags
    const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    results.push(text)
    pos = cellEnd + closeTag.length
  }
  return results
}

async function login(ncontrol: string, password: string): Promise<MindboxSession> {
  // Step 1: GET login page — server sets INGRESSCOOKIE + XSRF-TOKEN + mbid_21_session
  const r1 = await fetch(`${BASE}/login/alumno`)
  const loginHtml = await r1.text()
  const formToken = extractToken(loginHtml)

  if (!formToken) throw new Error("No se pudo obtener token CSRF de Mindbox")

  // Extract all three cookies the GET sets
  const ingress1 = extractCookie(r1.headers, "INGRESSCOOKIE")
  const xsrf1    = extractCookie(r1.headers, "XSRF-TOKEN")
  const sess1    = extractCookie(r1.headers, "mbid_21_session")

  // Step 2: POST credentials — send back ALL cookies from step 1
  const postBody = new URLSearchParams({ ncontrol, password, _token: formToken })
  const cookieHeader = [
    ingress1 && `INGRESSCOOKIE=${ingress1}`,
    xsrf1    && `XSRF-TOKEN=${xsrf1}`,
    sess1    && `mbid_21_session=${sess1}`,
  ].filter(Boolean).join("; ")

  const r2 = await fetch(`${BASE}/login/autoriza-alumno`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader,
    },
    body: postBody.toString(),
  })

  if (r2.status !== 302) throw new Error(`Login falló — HTTP ${r2.status}`)

  // Step 3: pick up new session cookies from POST response
  const xsrf2   = extractCookie(r2.headers, "XSRF-TOKEN")   || xsrf1
  const session = extractCookie(r2.headers, "mbid_21_session")

  if (!session) throw new Error("No se recibió sesión de Mindbox — credenciales incorrectas")

  // Step 4: follow redirect to /students to get a fresh INGRESSCOOKIE for the session
  const cookieHeader2 = `INGRESSCOOKIE=${ingress1}; XSRF-TOKEN=${xsrf2}; mbid_21_session=${session}`
  const r3 = await fetch(`${BASE}/students`, {
    redirect: "manual",
    headers: { Cookie: cookieHeader2 },
  })
  const ingress2 = extractCookie(r3.headers, "INGRESSCOOKIE") || ingress1

  return { xsrf: xsrf2, session, ingress: ingress2 }
}

function parseFinalTable(html: string): Map<string, { finalGrade: number | null; evalType: string | null }> {
  const map = new Map<string, { finalGrade: number | null; evalType: string | null }>()

  for (const table of splitTables(html)) {
    if (!table.includes("Calificaci") || !table.includes("Tipo de evaluaci")) continue

    for (const row of splitRows(table)) {
      const cells = splitCells(row)
      if (cells.length < 4) continue

      const codeMatch = cells[0].match(/^([A-Z0-9-]+)\s*\//)
      if (!codeMatch) continue
      const code = codeMatch[1].trim()

      const gradeStr = cells[3]
      const evalType = cells[4] ?? null

      const parsed = parseInt(gradeStr, 10)
      const finalGrade = gradeStr && gradeStr !== "Sin capturar" && !isNaN(parsed) ? parsed : null

      map.set(code, {
        finalGrade,
        evalType: evalType && evalType !== "Sin capturar" ? evalType : null,
      })
    }
    break
  }

  return map
}

function parsePartialTable(html: string): Map<string, (number | null)[]> {
  const map = new Map<string, (number | null)[]>()

  for (const table of splitTables(html)) {
    if (!table.includes("Parciales") || !table.includes("Promedio")) continue

    let pendingCode: string | null = null

    for (const row of splitRows(table)) {
      const cells = splitCells(row)
      if (!cells.length) continue

      const codeMatch = cells[0]?.match(/^([A-Z0-9-]+)\s*\//)
      if (codeMatch) {
        pendingCode = codeMatch[1].trim()
        continue
      }

      if (pendingCode) {
        const partials = cells
          .filter((c) => c !== "" && !isNaN(Number(c)))
          .map((c) => parseInt(c, 10))
        if (partials.length > 0) map.set(pendingCode, partials)
        pendingCode = null
      }
    }
    break
  }

  return map
}

function parsePeriods(html: string): { value: string; name: string }[] {
  const selectMatch = html.match(/<select[^>]*name="period"[^>]*>([\s\S]*?)<\/select>/)
  if (!selectMatch) return []
  const options = selectMatch[1].matchAll(/<option value="(\d+)"[^>]*>([^<]+)<\/option>/g)
  return [...options].map(([, value, name]) => ({ value, name: name.trim() }))
}

async function fetchGradesForPeriod(
  sess: MindboxSession,
  period: string,
  periodName: string
): Promise<MindboxGrade[]> {
  const cookie = `INGRESSCOOKIE=${sess.ingress}; XSRF-TOKEN=${sess.xsrf}; mbid_21_session=${sess.session}`
  const resp = await fetch(`${BASE}/students/historical/notes?period=${period}`, {
    headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0 Chrome/124" },
  })

  if (!resp.ok) throw new Error(`HTTP ${resp.status} al obtener boleta periodo ${period}`)

  const html = await resp.text()
  const finalMap = parseFinalTable(html)
  const partialMap = parsePartialTable(html)

  const grades: MindboxGrade[] = []
  for (const [code, data] of finalMap) {
    grades.push({
      period,
      periodName,
      subjectCode: code,
      subjectName: code,
      group: "",
      credits: 0,
      finalGrade: data.finalGrade,
      evalType: data.evalType,
      partialGrades: partialMap.get(code) ?? [],
    })
  }

  // Fill subject names / group / credits from final table rows
  for (const table of splitTables(html)) {
    if (!table.includes("Calificaci") || !table.includes("Tipo de evaluaci")) continue
    for (const row of splitRows(table)) {
      const cells = splitCells(row)
      if (cells.length < 3) continue
      const codeMatch = cells[0].match(/^([A-Z0-9-]+)\s*\/\s*(.+)/)
      if (!codeMatch) continue
      const code = codeMatch[1].trim()
      const name = codeMatch[2].trim()
      const credits = parseInt(cells[2], 10)
      const existing = grades.find((g) => g.subjectCode === code)
      if (existing) {
        existing.subjectName = name
        existing.group = cells[1]
        existing.credits = isNaN(credits) ? 0 : credits
      }
    }
    break
  }

  return grades
}

export async function scrapeAllGrades(
  ncontrol: string,
  mindboxPassword: string
): Promise<MindboxGrade[]> {
  const sess = await login(ncontrol, mindboxPassword)

  const cookie = `INGRESSCOOKIE=${sess.ingress}; XSRF-TOKEN=${sess.xsrf}; mbid_21_session=${sess.session}`
  const indexResp = await fetch(`${BASE}/students/historical/notes`, {
    headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0 Chrome/124" },
  })
  const indexHtml = await indexResp.text()
  const periods = parsePeriods(indexHtml)

  if (!periods.length) throw new Error("No se encontraron periodos en Mindbox")

  const results = await Promise.allSettled(
    periods.map((p) => fetchGradesForPeriod(sess, p.value, p.name))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<MindboxGrade[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
}

function parseExtra(extra: string): { room: string | null; professor: string | null; group: string | null } {
  const parts = extra.replace(/\t/g, " ").split("/").map((p) => p.trim())
  const room      = parts.find((p) => p.startsWith("Aula:"))?.replace("Aula:", "").trim() ?? null
  const professor = parts.find((p) => p.startsWith("Profesor:"))?.replace("Profesor:", "").trim() ?? null
  const group     = parts.find((p) => p.startsWith("Grupo:"))?.replace("Grupo:", "").trim() ?? null
  return { room, professor, group }
}

/** Shared-session variant — avoids a second login handshake */
export async function scrapeGradesAndSchedule(
  ncontrol: string,
  mindboxPassword: string,
  onlyCurrent: boolean = false
): Promise<{ grades: MindboxGrade[]; sessions: MindboxClassSession[] }> {
  const sess = await login(ncontrol, mindboxPassword)

  const [grades, sessions] = await Promise.all([
    (async () => {
      const cookie = `INGRESSCOOKIE=${sess.ingress}; XSRF-TOKEN=${sess.xsrf}; mbid_21_session=${sess.session}`
      const indexResp = await fetch(`${BASE}/students/historical/notes`, {
        headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0 Chrome/124" },
      })
      const indexHtml = await indexResp.text()
      let periods = parsePeriods(indexHtml)
      if (!periods.length) throw new Error("No se encontraron periodos en Mindbox")

      if (onlyCurrent) {
        periods = [periods[0]]
      }

      const results = await Promise.allSettled(
        periods.map((p) => fetchGradesForPeriod(sess, p.value, p.name))
      )
      return results
        .filter((r): r is PromiseFulfilledResult<MindboxGrade[]> => r.status === "fulfilled")
        .flatMap((r) => r.value)
    })(),
    (async () => {
      try {
        return await scrapeScheduleWithSession(sess)
      } catch (err) {
        console.warn("[mindbox] No se pudo obtener el horario:", err instanceof Error ? err.message : err)
        return []
      }
    })(),
  ])

  return { grades, sessions }
}

async function scrapeScheduleWithSession(sess: MindboxSession): Promise<MindboxClassSession[]> {
  const cookie = `INGRESSCOOKIE=${sess.ingress}; XSRF-TOKEN=${sess.xsrf}; mbid_21_session=${sess.session}`

  const resp = await fetch(`${BASE}/students/courses/index`, {
    headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0 Chrome/124" },
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status} al obtener horario`)

  const html = await resp.text()

  // Schedule is embedded as: <calendar schedule="[[...]]">
  // Use [\s\S] instead of . with /s flag (ES2017 compat)
  const match = html.match(/schedule="(\[\[[\s\S]*?\]\])"/)
    ?? html.match(/schedule='(\[\[[\s\S]*?\]\])'/)

  if (!match) throw new Error("No se encontró el horario en Mindbox")

  // Decode HTML entities (&quot; → ")
  const decoded = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // Remove actual tab/newline control chars inside strings
    .replace(/\t/g, " ")

  let days: { title: string; hour: string; extra: string }[][]
  try {
    days = JSON.parse(decoded)
  } catch {
    throw new Error("No se pudo parsear el horario de Mindbox")
  }

  const sessions: MindboxClassSession[] = []
  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    if (!Array.isArray(day)) continue
    for (const cls of day) {
      const [start, end] = (cls.hour ?? "").split("-").map((t) => t.trim())
      if (!start) continue
      const { room, professor, group } = parseExtra(cls.extra ?? "")
      sessions.push({
        dayOfWeek: i,
        subjectName: cls.title ?? "",
        startTime: start,
        endTime: end ?? start,
        room,
        professor,
        group,
      })
    }
  }

  return sessions
}

import type { MoodleCourse, MoodleAssignment, MoodleGradeItem, MoodleSubmissionStatus } from "@/types"

const MOODLE_BASE_URL = process.env.MOODLE_BASE_URL

export async function mCall(
  token: string,
  wsfunction: string,
  params: Record<string, string | number | (string | number)[]> = {}
) {
  if (!MOODLE_BASE_URL) throw new Error("MOODLE_BASE_URL not configured")

  const body = new URLSearchParams()
  body.append("wstoken", token)
  body.append("wsfunction", wsfunction)
  body.append("moodlewsrestformat", "json")

  for (const [key, val] of Object.entries(params)) {
    if (Array.isArray(val)) {
      val.forEach((item, i) => body.append(`${key}[${i}]`, String(item)))
    } else {
      body.append(key, String(val))
    }
  }

  const res = await fetch(`${MOODLE_BASE_URL}/webservice/rest/server.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Moodle API error: ${res.status}`)
  }

  const data = await res.json()

  if (data?.exception) {
    throw new Error(data.message ?? "Moodle exception")
  }

  return data
}

export async function getMoodleToken(
  username: string,
  password: string
): Promise<string | null> {
  if (!MOODLE_BASE_URL) return null

  const body = new URLSearchParams()
  body.append("username", username)
  body.append("password", password)
  body.append("service", "moodle_mobile_app")

  const res = await fetch(`${MOODLE_BASE_URL}/login/token.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  const data = await res.json()
  return data?.token ?? null
}

export async function getEnrolledCourses(
  token: string,
  userId: number
): Promise<MoodleCourse[]> {
  const data = await mCall(token, "core_enrol_get_users_courses", {
    userid: userId,
  })
  return Array.isArray(data) ? data : []
}

export async function getGradesForCourse(
  token: string,
  courseId: number,
  userId: number
): Promise<MoodleGradeItem[]> {
  const data = await mCall(token, "gradereport_user_get_grade_items", {
    courseid: courseId,
    userid: userId,
  })
  // Response: { usergrades: [{ gradeitems: [...] }] }
  const userGrades: { gradeitems: MoodleGradeItem[] }[] = data?.usergrades ?? []
  return userGrades[0]?.gradeitems ?? []
}

export async function getCourseAssignments(
  token: string,
  courseIds: number[]
): Promise<MoodleAssignment[]> {
  if (courseIds.length === 0) return []

  const data = await mCall(token, "mod_assign_get_assignments", {
    courseids: courseIds,
  })

  // Response: { courses: [{ id, assignments: [...] }] }
  const courses: { assignments: MoodleAssignment[] }[] = data?.courses ?? []
  return courses.flatMap((c) => c.assignments ?? [])
}

/** Strip HTML tags and decode common entities for plain-text storage. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/** Get submission status for a single assignment. Returns true if submitted. */
export async function getSubmissionStatus(
  token: string,
  assignId: number,
  userId: number
): Promise<MoodleSubmissionStatus> {
  try {
    const data = await mCall(token, "mod_assign_get_submission_status", {
      assignid: assignId,
      userid: userId,
    })
    const status: string = data?.lastattempt?.submission?.status ?? "new"
    return { assignId, submitted: status === "submitted" }
  } catch {
    return { assignId, submitted: false }
  }
}

/** Batch fetch submission statuses for multiple assignments in parallel. */
export async function getSubmissionStatuses(
  token: string,
  assignIds: number[],
  userId: number
): Promise<Map<number, boolean>> {
  if (assignIds.length === 0) return new Map()

  const results = await Promise.allSettled(
    assignIds.map((id) => getSubmissionStatus(token, id, userId))
  )

  const map = new Map<number, boolean>()
  for (const r of results) {
    if (r.status === "fulfilled") {
      map.set(r.value.assignId, r.value.submitted)
    }
  }
  return map
}

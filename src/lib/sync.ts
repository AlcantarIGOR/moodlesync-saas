import { db } from "@/lib/db"
import { getEnrolledCourses, getCourseAssignments, getSubmissionStatuses } from "@/lib/moodle"
import { detectSem } from "@/lib/utils"
import type { MoodleFile } from "@/types"

export async function syncUserTasks(
  userId: string,
  moodleToken: string,
  moodleUserId: number
): Promise<number> {
  const courses = await getEnrolledCourses(moodleToken, moodleUserId)
  const visibleCourses = courses.filter((c) => c.visible !== 0)

  if (visibleCourses.length === 0) return 0

  const courseIds = visibleCourses.map((c) => c.id)
  const courseMap = new Map(visibleCourses.map((c) => [c.id, c.fullname]))

  // Fetch assignments first, then submission statuses in parallel per assignment (filtering out tasks already marked as DONE)
  const assignments = await getCourseAssignments(moodleToken, courseIds)
  const assignmentIds = assignments.map((a) => a.id)

  const doneTasks = await db.task.findMany({
    where: {
      userId,
      moodleAssignmentId: { in: assignmentIds },
      status: "DONE",
    },
    select: {
      moodleAssignmentId: true,
    },
  })

  const doneAssignmentIds = new Set(
    doneTasks
      .map((t) => t.moodleAssignmentId)
      .filter((id): id is number => id !== null)
  )

  const idsToCheck = assignmentIds.filter((id) => !doneAssignmentIds.has(id))
  const submissionMap = await getSubmissionStatuses(moodleToken, idsToCheck, moodleUserId)

  const normalized = assignments.map((assignment) => {
    const courseName = courseMap.get(assignment.course) ?? null
    // introattachments = files attached to the assignment description (visible to students)
    // introfiles = files embedded inside the intro HTML (e.g. inline formula images) — already rendered
    const attachments: MoodleFile[] = (assignment.introattachments ?? [])
      .filter((f) => f.filename && f.fileurl)
      .map((f) => ({
        filename: f.filename,
        fileurl: f.fileurl,
        filesize: f.filesize ?? 0,
        mimetype: f.mimetype,
      }))

    return {
      moodleAssignmentId: assignment.id,
      moodleCmId: assignment.cmid,
      title: assignment.name,
      courseId: assignment.course,
      courseName,
      semester: courseName ? detectSem(courseName) : 0,
      dueDate: assignment.duedate > 0 ? new Date(assignment.duedate * 1000) : null,
      description: assignment.intro || null, // stored as raw HTML, sanitized on render
      attachments: attachments.length > 0 ? attachments : null,
      submitted: doneAssignmentIds.has(assignment.id) || (submissionMap.get(assignment.id) ?? false),
    }
  })

  const incomingIds = normalized.map((a) => a.moodleAssignmentId)

  // 1. Fetch existing tasks for this user in the incoming set
  const existingTasks = await db.task.findMany({
    where: {
      userId,
      moodleAssignmentId: { in: incomingIds },
    },
    select: {
      moodleAssignmentId: true,
      title: true,
      courseId: true,
      courseName: true,
      semester: true,
      dueDate: true,
      status: true,
      description: true,
      attachments: true,
    },
  })

  const existingMap = new Map(
    existingTasks.map((t) => [t.moodleAssignmentId, t])
  )

  // 2. Split into create vs update sets
  const toCreate = normalized.filter((a) => !existingMap.has(a.moodleAssignmentId))

  const toUpdate = normalized.filter((a) => {
    const existing = existingMap.get(a.moodleAssignmentId)
    if (!existing) return false
    return (
      existing.title !== a.title ||
      existing.courseId !== a.courseId ||
      existing.courseName !== a.courseName ||
      existing.semester !== a.semester ||
      existing.dueDate?.getTime() !== a.dueDate?.getTime() ||
      // Populate description that was missing before this feature
      (a.description && existing.description === null) ||
      // Self-correct attachments — fixes tasks synced before introfiles → introattachments
      JSON.stringify(existing.attachments ?? null) !== JSON.stringify(a.attachments) ||
      // Auto-mark as DONE if Moodle shows submitted (only upgrade, never downgrade)
      (a.submitted && existing.status === "PENDING")
    )
  })

  // 3. Batch-insert new rows
  if (toCreate.length > 0) {
    await db.task.createMany({
      data: toCreate.map((a) => ({
        userId,
        moodleAssignmentId: a.moodleAssignmentId,
        moodleCmId: a.moodleCmId,
        title: a.title,
        courseId: a.courseId,
        courseName: a.courseName,
        semester: a.semester,
        dueDate: a.dueDate,
        description: a.description,
        attachments: a.attachments ? JSON.parse(JSON.stringify(a.attachments)) : undefined,
        status: a.submitted ? "DONE" : "PENDING",
        isManual: false,
      })),
      skipDuplicates: true,
    })
  }

  // 4. Update changed rows in parallel
  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map((a) => {
        const existing = existingMap.get(a.moodleAssignmentId)
        const newStatus = a.submitted && existing?.status === "PENDING" ? "DONE" : undefined
        return db.task.updateMany({
          where: { userId, moodleAssignmentId: a.moodleAssignmentId },
          data: {
            title: a.title,
            moodleCmId: a.moodleCmId,
            courseId: a.courseId,
            courseName: a.courseName,
            semester: a.semester,
            dueDate: a.dueDate,
            description: a.description,
            attachments: a.attachments ? JSON.parse(JSON.stringify(a.attachments)) : undefined,
            ...(newStatus ? { status: newStatus } : {}),
          },
        })
      })
    )
  }

  return normalized.length
}

export interface MoodleCourse {
  id: number
  fullname: string
  shortname: string
  idnumber: string
  summary: string
  visible: number
}

export interface MoodleFile {
  filename: string
  fileurl: string
  filesize: number
  mimetype?: string
}

export interface MoodleAssignment {
  id: number
  cmid: number
  course: number
  name: string
  duedate: number
  allowsubmissionsfromdate: number
  intro: string
  introfiles: MoodleFile[]
  introattachments?: MoodleFile[]
  configs: unknown[]
}

export interface MoodleSubmissionStatus {
  assignId: number
  submitted: boolean
}

export interface MoodleTask {
  id: number
  title: string
  courseId: number
  courseName: string
  dueDate: Date | null
  semester: number | null
}

export interface MoodleSiteInfo {
  userid: number
  username: string
  fullname: string
  sitename: string
  siteurl: string
  useremail?: string
}

export interface MoodleGradeItem {
  id: number
  itemname: string | null
  itemtype: string
  itemmodule: string | null
  graderaw: number | null
  grademin: number
  grademax: number
  percentageformatted: string | null
  feedback: string | null
}

export interface MoodleCourseGrades {
  courseId: number
  courseName: string
  items: MoodleGradeItem[]
}

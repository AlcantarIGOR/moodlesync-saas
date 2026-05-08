import { Resend } from "resend"

// Sin dominio verificado en Resend usar onboarding@resend.dev
// Una vez verificado moodlesync.app en Resend, cambiar a recordatorios@moodlesync.app
const FROM = process.env.RESEND_FROM_EMAIL ?? "MoodleSync <onboarding@resend.dev>"
const APP_URL = process.env.NEXTAUTH_URL ?? "https://moodlesync.app"

let resendClient: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!resendClient) resendClient = new Resend(key)
  return resendClient
}

export interface ReminderTask {
  title: string
  courseName: string | null
  dueDate: Date
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function hoursLeft(d: Date): number {
  return Math.round((new Date(d).getTime() - Date.now()) / 3600000)
}

function buildHtml(name: string, tasks: ReminderTask[]): string {
  const taskRows = tasks
    .map((t) => {
      const h = hoursLeft(t.dueDate)
      const urgentColor = h <= 12 ? "#ef4444" : h <= 24 ? "#f59e0b" : "#3b82f6"
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #1f1f23;">
            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #f4f4f5;">${escHtml(t.title)}</p>
            ${t.courseName ? `<p style="margin: 0 0 6px; font-size: 11px; color: #71717a; font-family: monospace;">${escHtml(t.courseName)}</p>` : ""}
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-family: monospace; font-weight: 600; background: ${urgentColor}22; color: ${urgentColor}; border: 1px solid ${urgentColor}44;">
              Vence en ${h}h — ${fmtDate(t.dueDate)}
            </span>
          </td>
        </tr>`
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recordatorio MoodleSync</title></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;min-height:100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom: 28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:32px;height:32px;background:#3b82f6;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:16px;font-weight:900;">M</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:15px;font-weight:700;color:#f4f4f5;">MoodleSync</span>
                    <span style="display:block;font-size:9px;font-family:monospace;color:#3b82f6;">by ONYX Inc.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:28px;">

              <!-- Heading -->
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#f4f4f5;letter-spacing:-.4px;">
                ${tasks.length === 1 ? "Tienes una tarea próxima" : `Tienes ${tasks.length} tareas próximas`}
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#71717a;">
                Hola ${name.split(" ")[0]}, esto vence pronto:
              </p>

              <!-- Tasks -->
              <table width="100%" cellpadding="0" cellspacing="0">
                ${taskRows}
              </table>

              <!-- CTA -->
              <div style="margin-top:24px;text-align:center;">
                <a href="${APP_URL}/dashboard/tareas"
                  style="display:inline-block;padding:10px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">
                  Ver mis tareas →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:10px;color:#3f3f46;font-family:monospace;">
                MoodleSync — ITCG · by ONYX Inc.<br>
                Recibes este correo porque tienes tareas próximas a vencer.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendReminderEmail(
  to: string,
  name: string,
  tasks: ReminderTask[]
): Promise<boolean> {
  const resend = getResend()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email")
    return false
  }

  try {
    const count = tasks.length
    const subject =
      count === 1
        ? `⏰ "${tasks[0].title}" vence pronto`
        : `⏰ Tienes ${count} tareas que vencen pronto`

    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: buildHtml(name, tasks),
    })

    if (error) {
      console.error("[email] Resend error:", error)
      return false
    }
    return true
  } catch (err) {
    console.error("[email] Unexpected error:", err)
    return false
  }
}

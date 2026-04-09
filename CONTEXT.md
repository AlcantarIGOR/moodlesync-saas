# MoodleSync — Contexto de Proyecto para Claude

> Pega este archivo completo al inicio de cualquier conversación con Claude para continuar el desarrollo con contexto completo.

---

## ¿Qué es MoodleSync?

SaaS que sincroniza las tareas de Moodle (plataforma educativa del ITCG — Instituto Tecnológico de Ciudad Guzmán) directamente a un dashboard moderno. Los alumnos de ITCG entran con su número de control y contraseña de Moodle, y ven todas sus entregas organizadas, con descripción, archivos adjuntos, estado de entrega, y filtros por semestre.

**Fundador:** Juan Alcántar — ONYX Inc. (agencia de automatización e IA)
**Objetivo inmediato:** Versión presentable para otros alumnos del ITCG, validar base de usuarios, luego monetizar con plan Premium.

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind v4 (CSS vars custom, no tokens de Tailwind) |
| Auth | next-auth v5 beta.30 — JWT strategy, Credentials provider |
| ORM | Prisma 7 con `@prisma/adapter-pg` + `prisma.config.ts` |
| DB | Supabase PostgreSQL |
| Email | Resend (instalado, API key configurada) |
| Deploy target | Vercel (vercel.json con cron configurado) |
| Moodle API | REST WS (`moodle_mobile_app` service) |

---

## Variables de Entorno (`.env.local`)

```env
DATABASE_URL="postgresql://postgres.ljdyoplhxyxavydjgnds:...@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://..."  # Puerto 5432, sin pgbouncer
MOODLE_BASE_URL=https://apps.cdguzman.tecnm.mx/itcg
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=re_W7wpQtqL_37nfEGBqZfwRyVUfMuBoDJEa
RESEND_FROM_EMAIL="MoodleSync <recordatorios@moodlesync.app>"
CRON_SECRET=changeme-generate-a-random-string
```

---

## Estructura de Rutas

```
src/app/
├── page.tsx                          # Landing page pública
├── (auth)/login/page.tsx             # Login con número de control + contraseña
├── (dashboard)/
│   ├── layout.tsx                    # Sidebar + mobile nav
│   └── dashboard/
│       ├── page.tsx                  # Dashboard principal (stats, próximas tareas)
│       ├── tareas/page.tsx           # Lista completa de tareas
│       ├── kanban/page.tsx           # Vista Kanban drag-and-drop
│       ├── calificaciones/page.tsx   # Calificaciones desde Moodle en tiempo real
│       ├── upgrade/page.tsx          # FREE vs Premium
│       └── settings/page.tsx         # Perfil, email para recordatorios, plan
│
src/app/api/
├── sync/route.ts                     # POST — dispara syncUserTasks
├── tasks/route.ts                    # POST — crear tarea manual (freemium gate)
├── tasks/[id]/route.ts               # PATCH (toggle status) + DELETE
├── tasks/export/route.ts             # GET — exportar .ics (Google/Apple Calendar)
├── moodle/file/route.ts              # GET — proxy seguro para archivos adjuntos de Moodle
├── cron/reminders/route.ts           # GET — cron diario de recordatorios por email
└── user/route.ts                     # PATCH — actualizar email del usuario
```

---

## Schema Prisma (actual)

```prisma
model User {
  id             String   @id @default(cuid())
  moodleUsername String   @unique
  moodleUserId   Int
  name           String
  email          String?  // Para recordatorios — se obtiene de Moodle o el usuario lo pone
  plan           Plan     @default(FREE)
  createdAt      DateTime @default(now())
  tasks          Task[]
}

model Task {
  id                 String     @id @default(cuid())
  userId             String
  moodleAssignmentId Int?
  moodleCmId         Int?       // Course Module ID — para links directos a Moodle
  title              String
  courseId           Int?
  courseName         String?
  semester           Int?       // Detectado automáticamente por palabras clave del curso
  dueDate            DateTime?
  description        String?    // HTML de Moodle procesado a texto plano
  attachments        Json?      // MoodleFile[] serializado
  status             TaskStatus @default(PENDING)
  isManual           Boolean    @default(false)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
  user               User       @relation(...)

  @@unique([userId, moodleAssignmentId])
  @@index([userId])
  @@index([userId, status])
  @@index([userId, dueDate])
}

enum Plan { FREE PREMIUM }
enum TaskStatus { PENDING DONE ARCHIVED }
```

---

## Auth — Detalles Críticos

- Login: usuario ingresa `moodleUsername` + `moodlePassword`
- El servidor llama a `MOODLE_BASE_URL/login/token.php` para obtener un token
- Se llama `core_webservice_get_site_info` para obtener `userid`, `fullname`, `useremail`
- Se hace `upsert` en la tabla `User` con esos datos
- El `moodleToken` vive **solo en el JWT** (no en DB) — se renueva en cada login
- `signIn()` lanza `NEXT_REDIRECT` en éxito — siempre re-throw si no es `AuthError`
- Session contiene: `user.id`, `moodleToken`, `moodleUserId`, `plan`

---

## Funcionalidades Implementadas

### Core
- [x] Login con credenciales Moodle (número de control + contraseña)
- [x] Sync automático al primer acceso (cuando DB está vacía)
- [x] Sync manual via botón "Sincronizar"
- [x] Auto-detección de semestre por palabras clave del nombre de materia (`detectSem()`)
- [x] Auto-marcar como DONE si Moodle reporta submission (solo upgrade, nunca downgrade)

### Dashboard de Tareas (`/dashboard/tareas`)
- [x] Lista con secciones: VENCIDAS / URGENTES / PENDIENTES / COMPLETADAS
- [x] Filtros por estado (Todas / Pendientes / Urgentes / Completadas / Archivadas)
- [x] Filtros del sidebar ("Por estado") conectados al URL param `?filter=`
- [x] Filtro por semestre via `?sem=N` (dropdown en sidebar)
- [x] Búsqueda por título o materia
- [x] Modal de detalle: descripción completa, archivos adjuntos, link a Moodle, toggle estado
- [x] Archivos adjuntos: proxy seguro `/api/moodle/file?url=` (appende token en server)
- [x] Tareas manuales: crear, eliminar, freemium gate (FREE = máx 3)
- [x] Exportar `.ics` para Google/Apple Calendar

### Kanban (`/dashboard/kanban`)
- [x] Columnas: Pendientes / Entregadas / Archivadas
- [x] Drag-and-drop sin librerías externas (pointer events nativos)
- [x] Actualiza status via PATCH al soltar

### Calificaciones (`/dashboard/calificaciones`)
- [x] Fetch en tiempo real desde Moodle (`gradereport_user_get_grade_items`)
- [x] Card por materia con calificación total y desglose por actividad
- [x] Colores por rendimiento (verde ≥70%, ámbar ≥50%, rojo <50%)

### Notificaciones por Email
- [x] Resend instalado y configurado
- [x] Template HTML oscuro con branding MoodleSync
- [x] Cron diario `0 14 * * *` (8am CST) — `GET /api/cron/reminders`
- [x] Ventana de detección: tareas que vencen en 23-26h desde ejecución
- [x] Agrupación por usuario (un email con todas las tareas próximas)
- [x] Usuario puede editar su email en Settings
- [x] Email se obtiene de Moodle (`useremail`) al hacer login

### UX / Sidebar
- [x] Active state dinámico en sidebar (pathname + filter param)
- [x] Mobile bottom nav con active state (client component con `usePathname`)
- [x] Semester filter preserva `?sem` al navegar
- [x] Sidebar: Principal / Por estado / Vistas / Sistema
- [x] Settings page: perfil, email, conexión Moodle, plan, logout

---

## Diseño — Sistema de CSS

El proyecto usa **variables CSS custom** (NO los tokens de Tailwind):

```css
--bg        /* Fondo principal */
--card      /* Fondo de tarjetas */
--s2, --s3  /* Fondos secundarios */
--b1, --b2  /* Bordes */
--tx, --tx2, --tx3  /* Texto (primario, secundario, terciario) */
--blue, --blue-d, --blue-b   /* Azul y sus variantes dark/border */
--green, --green-d, --green-b
--amber, --amber-d, --amber-b
--red, --red-d, --red-b
--purple, --purple-d
--mono      /* Font monospace para badges/labels */
```

**Nunca usar** `text-foreground`, `text-muted-foreground`, `bg-background` u otros tokens de Tailwind semánticos — el proyecto los reemplazó por vars custom.

Navbar de cada página: `height: 54px`, `borderBottom: "1px solid var(--b1)"`, `background: "rgba(10,10,11,.85)"`, `backdropFilter: "blur(10px)"`.

---

## Moodle API — Funciones Usadas

| Función WS | Uso |
|-----------|-----|
| `core_webservice_get_site_info` | Login: obtener userid, fullname, useremail |
| `core_enrol_get_users_courses` | Listar materias del alumno |
| `mod_assign_get_assignments` | Obtener tareas de un conjunto de cursos |
| `mod_assign_get_submission_status` | Estado de entrega por tarea |
| `gradereport_user_get_grade_items` | Calificaciones por materia |

Helper `mCall(token, wsfunction, params)` en `src/lib/moodle.ts` — maneja POST con `application/x-www-form-urlencoded`, arrays como `key[0]=val&key[1]=val`.

---

## Freemium Gate

- Plan FREE: máximo 3 tareas manuales (`FREE_MANUAL_LIMIT = 3`)
- API `POST /api/tasks` retorna `403 { error: "LIMIT_REACHED" }` al exceder
- El modal `AddTaskModal` detecta el 403 y muestra link a `/dashboard/upgrade`
- Las tareas de Moodle (sincronizadas) son ilimitadas en todos los planes

---

## Pendiente / Próximas Features

### Alta prioridad
- [ ] **Mindbox** — calificaciones desde el portal de Mindbox (ITCG usa Mindbox para capturar notas que no están en Moodle). El portal usa Laravel con protección de sesión — necesita Playwright headless o scraping de cookies. El scraper original (app HTML) usaba Python + Selenium.
- [ ] **Deploy a Vercel** — configurar env vars en Vercel, apuntar `NEXTAUTH_URL` al dominio real, verificar dominio en Resend para que los emails salgan de `@moodlesync.app`

### Media prioridad
- [ ] **Descripción HTML renderizada** — actualmente `stripHtml()` convierte a texto plano. Debería renderizar HTML sanitizado (DOMPurify) para preservar listas, negritas, imágenes.
- [ ] **Toast de feedback** — cuando marcas tarea como hecha solo hay un `router.refresh()`. Agregar toast de 2s.
- [ ] **Command palette** (`cmd+K`) — búsqueda global de tareas y navegación entre páginas.
- [ ] **Barra de progreso en tarjetas** — visualizar urgencia gráficamente (verde → rojo según tiempo restante).

### Técnico
- [ ] **Error boundaries** — `error.tsx` en cada sub-ruta para manejar cuando Moodle está caído.
- [ ] **Sync chunking** — con muchas materias, los 80+ requests paralelos a `mod_assign_get_submission_status` pueden hacer timeout en Vercel (límite 10s plan gratuito).
- [ ] **Migración formal del schema** — actualmente se usó `prisma db push`. Para producción debería haber migraciones versionadas.

---

## Comandos Útiles

```bash
# Dev server
npm run dev

# Regenerar cliente Prisma (después de cambiar schema)
npx prisma generate

# Push schema a DB (dev rápido)
DATABASE_URL="..." DIRECT_URL="..." npx prisma db push

# Type check
npx tsc --noEmit

# Probar cron de emails manualmente
curl http://localhost:3000/api/cron/reminders
```

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/auth.ts` | Config de next-auth, login con Moodle, JWT callbacks |
| `src/lib/moodle.ts` | Cliente Moodle API (`mCall`, helpers) |
| `src/lib/sync.ts` | Lógica de sincronización (upsert masivo de tareas) |
| `src/lib/email.ts` | Cliente Resend + template HTML de recordatorios |
| `src/lib/utils.ts` | `detectSem()` con diccionario de palabras clave por semestre |
| `src/lib/db.ts` | Singleton de Prisma Client |
| `prisma/schema.prisma` | Schema de BD |
| `src/components/dashboard/task-list.tsx` | Lista principal de tareas (filtros, cards, modales) |
| `src/components/dashboard/task-detail-modal.tsx` | Modal de detalle: descripción, adjuntos, toggle |
| `src/components/dashboard/kanban-board.tsx` | Kanban drag-and-drop sin librerías |
| `src/components/dashboard/sync-button.tsx` | Botón de sync con feedback |
| `src/components/dashboard/sidebar-nav.tsx` | Sidebar con active state dinámico |
| `src/components/dashboard/mobile-nav.tsx` | Bottom nav mobile con active state |
| `src/components/dashboard/email-form.tsx` | Formulario edición de email en Settings |
| `vercel.json` | Cron job: `0 14 * * *` → `/api/cron/reminders` |

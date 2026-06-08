# MoodleSync — Estado del Proyecto

> Pega este archivo al inicio de cualquier conversación con Claude para continuar el desarrollo con contexto completo.

**Última actualización:** 2026-04-13  
**Desarrollado por:** Juan Alcántar — ONYX Inc.  
**Stack:** Next.js 16 (App Router) · React 19 · Prisma 7 · Supabase PostgreSQL · Vercel

---

## URLs

| | |
|---|---|
| **Producción** | https://moodlesync.onyxinc.dev |
| **Repo GitHub** | https://github.com/AlcantarIGOR/moodlesync |
| **DB (Supabase)** | `aws-1-us-east-1.pooler.supabase.com` — proyecto `ljdyoplhxyxavydjgnds` |

---

## Qué es MoodleSync

App web para estudiantes del ITCG (TecNM Ciudad Guzmán). Se conecta al portal Moodle del instituto y centraliza tareas, calificaciones y horario en un dashboard. Autenticación con las mismas credenciales del portal — sin registro extra.

---

## Fases completadas

### Fase 1 — Auth + Moodle proxy
- Login con credenciales ITCG vía Moodle REST API (`core_webservice_get_site_info`)
- next-auth v5 JWT strategy, sin base de datos para sesiones
- Proxy `/api/moodle` con allowlist de 5 wsfunction permitidas (seguridad)
- Proxy `/api/moodle/file` — stream server-side (sin exponer token en URL)

### Fase 2 — Dashboard + Tareas
- Sync automático desde Moodle (`/api/sync`)
- CRUD de tareas manuales (`/api/tasks`, `/api/tasks/[id]`)
- Filtros por estado: Pendientes, Urgentes, Completadas, Archivadas
- Export `.ics` compatible con Google/Apple Calendar
- Badges en sidebar con conteos en tiempo real

### Fase 3 — Vistas adicionales
- **Kanban** drag & drop (3 columnas: PENDING → DONE → ARCHIVED)
- **Horario** semanal (desde scraper Mindbox)
- **Calificaciones** por materia y periodo (desde scraper Mindbox)
- **Calendario** semanal con entregas (desktop 7 cols + mobile lista)
- **Modo Focus / Pomodoro** (25/5/15 min, Web Audio API, notificaciones)
- **Command Palette** (Cmd+K)

### Fase 4 — Infraestructura
- **PWA** completa: `manifest.json` + Service Worker cache-first
- **Web Push** VAPID — suscripción, envío y limpieza de subs expiradas
- **Email recordatorios** con Resend (cron diario 14:00 UTC en Vercel)
- **Cron Vercel** protegido con `CRON_SECRET`

### Fase 5 — Seguridad y optimizaciones
- **AES-256-GCM** para `mindboxPassword` at rest (`src/lib/crypto.ts`)
  - Transparente: valores sin prefijo `enc1:` se leen como plaintext (migración gradual)
- **HTML escaping** en emails (`escHtml()` aplicado a `t.title` / `t.courseName`)
- **Allowlist Moodle** — solo 5 funciones permitidas en el proxy
- **Sesión compartida Mindbox** — `scrapeGradesAndSchedule()` hace 1 login en vez de 2
- **Promise.all** en upsert de calificaciones (elimina N+1 secuencial)
- **Atomic transaction** en sync de horario (delete + createMany)

---

## Arquitectura de archivos clave

```
src/
├── app/
│   ├── (auth)/login/           Login page + Server Action
│   ├── (dashboard)/
│   │   ├── layout.tsx          Sidebar, badges, mobile nav
│   │   └── dashboard/
│   │       ├── page.tsx        Dashboard principal
│   │       ├── tareas/         Lista con filtros
│   │       ├── kanban/         Board drag & drop
│   │       ├── horario/        Horario semanal
│   │       ├── calificaciones/ Notas por materia
│   │       ├── calendario/     Vista semanal de entregas
│   │       ├── focus/          Pomodoro timer
│   │       └── settings/       Config (email, Mindbox, Push)
│   ├── api/
│   │   ├── auth/[...nextauth]/ next-auth handlers
│   │   ├── cron/reminders/     Email + Push recordatorios (cron diario)
│   │   ├── mindbox/sync/       Scraper Mindbox (grades + schedule)
│   │   ├── moodle/             Proxy Moodle con allowlist
│   │   ├── moodle/file/        Proxy archivos (stream, sin token en URL)
│   │   ├── push/subscribe/     Gestión suscripciones Web Push
│   │   ├── sync/               Sync tareas desde Moodle
│   │   ├── tasks/              CRUD tareas + export .ics
│   │   └── user/               PATCH perfil (email, mindboxPassword cifrada)
│   ├── page.tsx                Landing page pública
│   └── layout.tsx              Root layout (PWA meta, SW register)
├── auth.ts                     next-auth config (JWT, Credentials provider)
├── lib/
│   ├── crypto.ts               AES-256-GCM encrypt/decrypt
│   ├── db.ts                   Prisma client singleton (PrismaPg adapter)
│   ├── email.ts                Resend email con escHtml
│   ├── mindbox.ts              Scraper Mindbox (login, grades, schedule)
│   ├── moodle.ts               Moodle REST API client
│   ├── push.ts                 Web Push VAPID (lazy init, expired cleanup)
│   └── sync.ts                 Lógica sync Moodle → DB
├── components/dashboard/       Todos los client components del dashboard
└── types/index.ts
prisma/
├── schema.prisma               Modelos: User, Task, Grade, ClassSession, PushSubscription
└── migrations/                 3 migraciones aplicadas
public/
├── sw.js                       Service Worker (cache-first + push handler)
├── manifest.json               PWA manifest
└── icons/                      icon-192.png, icon-512.png
```

---

## Schema Prisma (resumen de modelos)

```prisma
User             id, moodleUsername, moodleUserId, name, email, mindboxPassword(enc)
Task             id, userId, title, courseName, dueDate, status, cmid, description, attachments
Grade            userId, period, subjectCode, subjectName, finalGrade, partialGrades[]
ClassSession     userId, dayOfWeek, subjectName, startTime, endTime, room, professor, group
PushSubscription userId, endpoint(unique), p256dh, auth
```

---

## Variables de entorno (todas requeridas en producción)

```env
DATABASE_URL=                   # Supabase pooler :6543 ?pgbouncer=true
DIRECT_URL=                     # Supabase direct :5432 (solo prisma migrate)
MOODLE_BASE_URL=                # https://apps.cdguzman.tecnm.mx/itcg
AUTH_SECRET=                    # next-auth secret
NEXTAUTH_URL=                   # https://moodlesync.onyxinc.dev
RESEND_API_KEY=                 # API key Resend
RESEND_FROM_EMAIL=              # "MoodleSync <onboarding@resend.dev>"
CRON_SECRET=                    # Token para /api/cron/reminders
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=                  # mailto:hola@onyxinc.mx
MINDBOX_ENCRYPTION_KEY=         # 64 chars hex (AES-256)
```

---

## Notas técnicas importantes

- **Prisma migrations**: usar `DIRECT_URL` (port 5432), no el pooler (:6543)
- **`postinstall`** en `package.json` corre `prisma generate` — necesario para Vercel build
- **mindboxPassword**: siempre `encryptPassword()` al guardar, `decryptPassword()` al leer
- **Service Worker**: `/dashboard` NO está en el cache estático (requiere auth → 302)
- **`onMouseEnter` en Server Components**: prohibido en RSC — usar CSS hover o `"use client"`
- **Vercel deploy manual**: `npx vercel deploy --prod --yes --token <token> --scope alcantarfloresjuan-4466s-projects`

---

### Fase 6 — Admin + Mobile UX + Optimizaciones (2026-04-13)

- **Panel Admin** `/dashboard/admin` — solo accesible si `session.user.id === ADMIN_USER_ID`
  - Stats: total usuarios, activos hoy/semana, con Mindbox, notif. email, Web Push
  - Tabla desktop + cards mobile: nombre, ncontrol, conteos de tareas/califs/clases, Mindbox, createdAt, lastSeenAt
- **`User.lastSeenAt`** — campo opcional `DateTime?` actualizado fire-and-forget en layout (sin await)
- **Font optimization** — `next/font/google` (`Outfit` + `JetBrains Mono`) con `variable` CSS; eliminado import URL externo de Google Fonts
- **Mobile UX** — `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, `overscroll-behavior: none`, `text-size-adjust: 100%`; touch targets 44px en botón toggle de tareas
- **Semester detection** expandida — palabras clave para ISC, Industrial, Mecatrónica, Electrónica, Bioquímica y Administración
- **Mindbox ncontrol fix** — `replace(/^[a-zA-Z]+/i, "")` con fallback si el resultado tiene < 5 chars (soporta prefijos como `l21`)
- **SW registration** — skip en localhost para evitar stale cache en dev
- **Admin sidebar item** — visible solo para `isAdmin`; ícono de engranaje con indicador activo

---

## Pendientes / Próximos pasos

- [ ] Configurar `ADMIN_USER_ID` en Vercel env vars (ID cuid del usuario admin)
- [ ] Conectar GitHub → Vercel para deploy automático en push
- [ ] Dominio personalizado `moodlesync.app`
- [ ] Verificar dominio en Resend (`recordatorios@moodlesync.app`)
- [ ] Onboarding wizard al primer login

# MoodleSync

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/license-private-lightgrey)](#licencia)

Gestor de tareas y calificaciones para estudiantes del **TecNM Ciudad Guzman (ITCG)**. Sincroniza con el Moodle del instituto, organiza por urgencia, exporta a calendario y vive como PWA instalable. Producto oficial de [ONYX Inc.](https://onyxinc.dev)

**Produccion:** https://moodlesync.onyxinc.dev

---

## Que hace

- **Sync automatico con Moodle** — usa las credenciales del portal ITCG, sin registros extra
- **Vista kanban + lista + calendario time-grid** — pendiente, urgente, vencida, archivada
- **Calificaciones en vivo desde Mindbox** — sin abrir el portal
- **Entrega de PDF directa a Moodle** — con compresion client-side via PDF.js + pdf-lib
- **Notas tipo post-it** — canvas libre 2400x1600, drag & drop, compartibles por materia
- **Grupos de estudio** — kanban colaborativo con polling 15s
- **Recordatorios por email + push** — Resend + Web Push (VAPID)
- **PWA instalable** — Service Worker + manifest, funciona offline para vistas ya cargadas
- **Light/dark mode** — anti-flash via inline script, vars CSS por tema

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript estricto |
| Estilos | Tailwind CSS v4 + CSS variables |
| Animacion | GSAP 3.12 + ScrollTrigger |
| ORM | Prisma 7 (PostgreSQL via Supabase) |
| Auth | NextAuth + Prisma Adapter |
| Email | Resend (lazy init) |
| Push | Web Push API + VAPID |
| Deploy | Vercel + dominio custom `onyxinc.dev` |

---

## Setup local

Requiere **Node 22+**, **PostgreSQL** (recomendado: Supabase) y un **token de Moodle** del ITCG.

```bash
git clone https://github.com/AlcantarIGOR/moodlesync.git
cd moodlesync
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Abre http://localhost:3000.

### Variables de entorno

Crea `.env.local` con:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://..."

# Auth.js v5
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="..."   # genera con: openssl rand -base64 32  (o: npx auth secret)

# Moodle del ITCG
MOODLE_BASE_URL="https://moodle.itcg.edu.mx"

# Mindbox (cifrado de credenciales del scraper)
MINDBOX_ENCRYPTION_KEY="..."   # 32 bytes hex (AES-256-GCM)

# Resend (email)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="contacto@onyxinc.dev"

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:contacto@onyxinc.dev"

# Cron secret (Vercel scheduled functions)
CRON_SECRET="..."

# Admin (numero de control con acceso a /dashboard/admin)
ADMIN_USER_ID="..."
```

Genera VAPID con:

```bash
npx web-push generate-vapid-keys
```

---

## Scripts

```bash
npm run dev       # dev server (Turbopack)
npm run build     # production build
npm run start     # serve production build
npm run lint      # eslint
npm run test      # correr tests unitarios con vitest (modo interactivo)
npm run test:run  # correr tests una sola vez (para CI)
```

---

## Estructura

```
src/
├── app/
│   ├── (dashboard)/         # rutas autenticadas (sidebar layout)
│   │   ├── dashboard/       # vistas: tareas, kanban, notas, grupos, settings, admin
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/            # NextAuth
│   │   ├── tasks/           # CRUD + bulk + export iCal
│   │   ├── notes/           # post-its, compartidas
│   │   ├── grupos/          # study groups
│   │   ├── moodle/          # proxy Moodle WS
│   │   ├── mindbox/         # scraper calificaciones
│   │   └── cron/            # reminders + tests (Vercel cron)
│   ├── login/               # login con credenciales ITCG
│   ├── page.tsx             # landing publica
│   └── layout.tsx           # root (PWA manifest, anti-flash theme)
├── components/
│   ├── dashboard/           # TaskCard, KanbanBoard, NotesBoard, etc.
│   ├── landing-page.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── db.ts                # Prisma singleton
│   ├── moodle.ts            # cliente Moodle WS
│   ├── mindbox.ts           # scraper calificaciones
│   ├── sync.ts              # sync de tareas Moodle -> DB
│   ├── crypto.ts            # AES-256-GCM para credenciales Mindbox
│   ├── email.ts             # Resend (lazy init)
│   └── push.ts              # Web Push (lazy init)
└── auth.ts                  # config NextAuth
prisma/
├── schema.prisma            # PostgreSQL
└── migrations/              # historial
public/
├── sw.js                    # Service Worker (cache + push)
├── manifest.json            # PWA manifest
└── icons/
```

---

## Deploy

Productiva en Vercel, dominio custom `moodlesync.onyxinc.dev`. Pushes a `master` disparan el workflow de CI (`.github/workflows/ci.yml`: type-check + lint + tests + build) y, al pasar, Vercel despliega automaticamente.

Redirects 308 desde `moodlesync-saas.vercel.app` y previews legacy hacia el dominio custom (configurado en `next.config.ts`).

---

## Convenciones

- **Commits:** conventional commits en espanol, sin acentos (`feat:`, `fix(scope):`, `chore:`)
- **Branch productiva:** `master`
- **CI:** type-check + lint + tests + build en cada push/PR a `main` o `master`
- **Periodo academico actual:** `20261` (Enero-Junio 2026)
- **Tests automatizados:** Pruebas unitarias e integración en `src/lib/` con Vitest (cifrado, sincronización, utilidades de filtrado y rate-limiting)

---

## Licencia y Descargo de Responsabilidad

Este repositorio se publica con fines **educativos y de portafolio profesional** bajo la licencia de código abierto de **ONYX Inc.** Puedes explorar el código, aprender de su arquitectura Next.js 16 / Prisma 7, y replicar las técnicas de animación GSAP. 

### Descargo de Responsabilidad Académico (Disclaimer)
> [!IMPORTANT]
> **MoodleSync** es una plataforma de software totalmente **independiente** desarrollada por **ONYX Inc.** 
> No está afiliada, respaldada, patrocinada ni asociada oficialmente con el **Tecnológico Nacional de México (TecNM)** ni con el **Instituto Tecnológico de Ciudad Guzmán (ITCG)**. 
> Todos los nombres de productos, marcas, logotipos e instituciones mencionadas son marcas registradas de sus respectivos propietarios. El uso de la integración con Moodle e instrumentación de scraping de Mindbox se realiza de manera ética, local y exclusiva bajo el control de las credenciales del estudiante, sin almacenar contraseñas en texto plano ni vulnerar la integridad de los sistemas institucionales.

---

**by [ONYX Inc.](https://onyxinc.dev)** · 2026 · Construido por [Juan Alcantar](https://byalcantar-portfolio.vercel.app)

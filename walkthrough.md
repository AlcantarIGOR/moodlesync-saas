# Walkthrough - Implementación de Tests, Re-Branding y Limpieza de MoodleSync

En este bloque de trabajo configuramos la infraestructura de pruebas técnicas con Vitest y realizamos la eliminación total de la monetización de tipo SaaS, enfocando el branding y el propósito de MoodleSync 100% como un portal de organización académica independiente exclusivo para la comunidad estudiantil del **ITCG (TecNM Ciudad Guzmán)**.

---

## Cambios Realizados

### 1. Configuración de la Infraestructura de Pruebas (Vitest)
* **Dependencias de Vitest:** Instalamos `vitest` y `@vitejs/plugin-react` como dependencias de desarrollo.
* **Configuración global:** Creamos [vitest.config.ts](file:///c:/Users/alcan/Desktop/WorkSpace/Claude%20WorkSpace/MoodleSync/moodlesync-saas/vitest.config.ts) con soporte para alias de TypeScript (`@/*` resolviendo a `./src/*`) y el entorno `node`.
* **Scripts:** Añadimos los scripts `"test"` y `"test:run"` en [package.json](file:///c:/Users/alcan/Desktop/WorkSpace/Claude%20WorkSpace/MoodleSync/moodlesync-saas/package.json).

### 2. Pruebas Unitarias y de Integración (Vitest)
* **Pruebas de Cifrado:** Creamos [crypto.test.ts](file:///c:/Users/alcan/Desktop/WorkSpace/Claude%20WorkSpace/MoodleSync/moodlesync-saas/src/lib/crypto.test.ts) para validar el cifrado AES-256-GCM y los mecanismos de migración y corrupción de firmas.
* **Pruebas de Sincronización:** Creamos [sync.test.ts](file:///c:/Users/alcan/Desktop/WorkSpace/Claude%20WorkSpace/MoodleSync/moodlesync-saas/src/lib/sync.test.ts) que simula (mockea) las APIs de Moodle y Prisma para validar la creación y actualización automática de tareas.
* **Pruebas de Utilidades:** Creamos [utils.test.ts](file:///c:/Users/alcan/Desktop/WorkSpace/Claude%20WorkSpace/MoodleSync/moodlesync-saas/src/lib/utils.test.ts) que cubre la limpieza de HTML (`stripHtml`) y la asignación inteligente de semestres (`detectSem`).
* **Fix de Diacríticos:** Corregimos `detectSem` en [utils.ts](file:///c:/Users/alcan/Desktop/WorkSpace/Claude%20WorkSpace/MoodleSync/moodlesync-saas/src/lib/utils.ts) para normalizar diacríticos (acentos como `É`, `í`, `ó`) y evitar fallos al clasificar materias procedentes de Moodle.

### 3. Limpieza de Características SaaS / Premium
* **Configuración:** Eliminamos la sección "Plan actual" y el badge de "PREMIUM/FREE" del perfil del usuario en [settings/page.tsx](file:///c:/Users/alcan/Desktop/WorkSpace/Claude%20WorkSpace/MoodleSync/moodlesync-saas/src/app/(dashboard)/dashboard/settings/page.tsx). Ahora todos los usuarios tienen acceso completo a todas las funciones sin restricciones ni distintivos de cobro.
* **Eliminación de Rutas:** Borramos la carpeta obsoleta `src/app/(dashboard)/dashboard/upgrade/` que contenía el redirect para actualizar el plan, limpiando por completo el enrutamiento.

### 4. Re-Branding Estudiantil 100% ITCG e Independiente
* **Metadata SEO:** Actualizamos el título y la descripción en el layout raíz [layout.tsx](file:///c:/Users/alcan/Desktop/WorkSpace/Claude%20WorkSpace/MoodleSync/moodlesync-saas/src/app/layout.tsx):
  - **Título:** *MoodleSync — Portal de Organización Académica del ITCG*
  - **Descripción:** *Sincroniza tus tareas de Moodle, consulta calificaciones y tu horario de clases en el ITCG de forma independiente y gratuita. by ONYX Inc.*
* **Folleto del sitio:** El sitio resalta la gratuidad y el carácter no oficial/independiente del portal escolar para estudiantes del Tecnológico de Ciudad Guzmán.

---

## Guía de Configuración en Producción (Vercel / Resend)

Para que el panel de administración y los correos de recordatorios diarios funcionen adecuadamente en producción, sigue estos pasos:

### A. Configurar el Panel Admin (`ADMIN_USER_ID`)
1. Inicia sesión en MoodleSync y dirígete a tu perfil o consulta la base de datos de Supabase (tabla `User`).
2. Copia el identificador único (`id` en formato `cuid`, ej. `cmnotc90h0000is541pmrue6s`) de tu usuario.
3. Añade la variable de entorno `ADMIN_USER_ID` con este valor en tu proyecto de **Vercel** y vuelve a desplegar. De esta manera tendrás acceso exclusivo a la ruta `/dashboard/admin`.

### B. Configurar Remitente en Resend
1. Regístrate en [Resend](https://resend.com) y añade tu dominio personalizado (ej. `onyxinc.dev` o `moodlesync.app`).
2. Configura los registros DNS (SPF, DKIM y MX) provistos por Resend en tu registrador de dominios.
3. En las variables de entorno de **Vercel**, define `RESEND_API_KEY` con tu clave de Resend y actualiza `RESEND_FROM_EMAIL` a algo como `"MoodleSync <recordatorios@onyxinc.dev>"` o `"MoodleSync <notificaciones@tu-dominio.com>"`.

---

## Validación de Compilación de Producción

Limpiamos la caché de Next.js y ejecutamos la compilación optimizada con éxito:

```bash
> next build
▲ Next.js 16.2.2 (Turbopack)
✓ Compiled successfully in 3.1s
Finished TypeScript in 4.4s
Generating static pages (30/30) in 253ms
Finalizing page optimization...
```

Todas las rutas dinámicas y estáticas se generaron correctamente y sin errores de TypeScript.

---

## Remediación Operativa P0/P1/P2 (Runbook + Hardening + Observabilidad)

### Runbook de Producción (Vercel)

1. **Configurar secretos críticos**
   - `AUTH_SECRET` (preferido) y `NEXTAUTH_SECRET` (compatibilidad).
   - `MINDBOX_ENCRYPTION_KEY` (64 hex chars, AES-256-GCM).
   - `CRON_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
2. **Configurar admin**
   - Obtener `User.id` (cuid) del usuario administrador.
   - Definir `ADMIN_USER_ID` en Vercel.
   - Verificar acceso a `/dashboard/admin` con ese usuario.
3. **Dominio final y auth**
   - Confirmar dominio de producción final.
   - Asegurar `NEXTAUTH_URL` apuntando al dominio final.
4. **Resend**
   - Verificar dominio en Resend (SPF/DKIM).
   - Definir `RESEND_FROM_EMAIL` con dominio verificado.
5. **Checklist post-deploy**
   - Login correcto.
   - Sync Moodle correcto.
   - `/api/cron/reminders` responde `401` sin bearer válido en producción.
   - `/api/cron/test-email` responde `403` para usuario no admin en producción.
   - Envío de recordatorios (email/push) operativo.

### Checklist de Hardening Recurrente

- Revisar dependencias y advisories (`npm audit`, GH alerts).
- Revisar secretos y rotación de claves (`AUTH_SECRET`, `CRON_SECRET`, `MINDBOX_ENCRYPTION_KEY`, VAPID, Resend).
- Verificar protección de endpoints sensibles (cron/admin/proxies).
- Validar que CI continúe ejecutando `lint`, `test:run`, `type-check`, `build`.
- Confirmar que errores API no expongan detalles sensibles en payloads.

### Observabilidad Básica (mínimo recomendado)

- Registrar métricas de sync: `userId`, `synced`, `duration_ms`, `status`.
- Registrar métricas de cron: `sent`, `skipped`, `push`, `users`, `tasks`, `duration_ms`.
- Mantener logs de fallos upstream sanitizados (sin secretos/tokens).
- Monitorear volumen de errores por endpoint crítico: `/api/moodle`, `/api/sync`, `/api/cron/reminders`.

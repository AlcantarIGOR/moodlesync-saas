# Ruta de Trabajo MoodleSync (ITCG) - Plan de Desarrollo

En base a tu retroalimentación, hemos ajustado el enfoque de MoodleSync:
1. **No más SaaS ni Premium:** La aplicación es y será 100% gratuita de forma indefinida. Se eliminan las integraciones de pasarelas de pago.
2. **Onboarding confirmado:** Ya contamos con un tour interactivo completamente integrado (`OnboardingTour` en `src/components/dashboard/onboarding-tour.tsx`), por lo que no requiere retrabajo.
3. **Enfoque 100% ITCG:** Eliminamos el soporte multi-institución. El branding y el propósito se centran exclusivamente en la comunidad de estudiantes del **Instituto Tecnológico de Ciudad Guzmán (ITCG)**.

A continuación, se desglosan en detalle las opciones **4** y **5** para proceder con su desarrollo.

---

## 4. Cobertura de Tests Automatizados con Vitest (Desglose Detallado)

El objetivo es asegurar que la lógica de negocio clave (cifrado de contraseñas de Mindbox, la lógica de scraping y la sincronización de tareas de Moodle) sea robusta y no se rompa con futuras actualizaciones.

### Paso 4.1: Instalación e Infraestructura
* **Dependencias a instalar:** `vitest` (ejecutor de pruebas rápido) y `@vitejs/plugin-react` (para soporte de JSX/TSX si es necesario).
* **`[NEW]` vitest.config.ts en la raíz del proyecto:** Configurar los alias de TypeScript (como `@/*` apuntando a `./src/*`) para evitar problemas de resolución de rutas en los tests.
* **`[MODIFY]` package.json:** Añadir scripts `"test": "vitest"` y `"test:run": "vitest run"` para la ejecución interactiva y en CI.

### Paso 4.2: Creación de Tests Unitarios
Escribiremos archivos de pruebas específicas bajo `src/lib/` para validar:
1. **`[NEW]` src/lib/crypto.test.ts:**
   - Verificar que `encryptPassword()` genere una cadena cifrada válida en formato hexadecimal.
   - Verificar que `decryptPassword()` recupere la contraseña original con éxito.
   - Probar el caso de migración (fallback): si la contraseña no está cifrada (es texto plano de versiones anteriores), debe retornar el texto plano original sin crashear.
   - Probar que arroje un error adecuado si la llave de cifrado (`MINDBOX_ENCRYPTION_KEY`) no está configurada.
2. **`[NEW]` src/lib/sync.test.ts y src/lib/moodle.test.ts:**
   - Mockear (simular) respuestas del API de Moodle (`core_webservice_get_site_info`, `mod_assign_get_assignments`).
   - Validar la función de sincronización `syncUserTasks()` de `src/lib/sync.ts`: verificar que guarde correctamente las tareas nuevas, actualice las existentes (upsert) y compute correctamente el semestre utilizando `detectSem()`.
   - Validar que la función `detectSem()` clasifique correctamente materias de ISC, Mecatrónica, etc., basadas en palabras clave.

---

## 5. Configuraciones de Producción, Dominio y Admin (Desglose Detallado)

El objetivo es dejar la app lista para producción bajo el dominio custom, afinar la seguridad del panel administrativo y asegurar el correcto envío de correos electrónicos diarios.

### Paso 5.1: Configuración del Panel Admin
* **Configuración de `ADMIN_USER_ID`:**
  - El panel `/dashboard/admin` está protegido por la variable `process.env.ADMIN_USER_ID`. Si tu ID de usuario de la base de datos (un string cuid generado al loguearte por primera vez) no coincide, te redirige al dashboard normal.
  - Para configurarlo, debemos obtener tu ID único. Esto lo podemos hacer consultando localmente la base de datos o imprimiendo la sesión en desarrollo. Luego, agregaremos esta variable a tu `.env.local` y a las variables de entorno de Vercel.

### Paso 5.2: Configuración del Dominio Custom y Resend
* **Remitente en Resend:**
  - Actualmente, `src/lib/email.ts` tiene un fallback a `MoodleSync <onboarding@resend.dev>`. Resend solo permite enviar correos a tu propia dirección de registro usando este remitente de prueba.
  - Una vez que tu dominio (`moodlesync.onyxinc.dev` o `onyxinc.dev`) esté verificado en el dashboard de Resend (añadiendo los registros DNS SPF/DKIM provistos por Resend), cambiaremos la variable `RESEND_FROM_EMAIL` a `MoodleSync <recordatorios@onyxinc.dev>` o `MoodleSync <notificaciones@moodlesync.onyxinc.dev>`.
  - Aseguraremos que `NEXTAUTH_URL` apunte al dominio de producción final para que los enlaces a las tareas dentro de los correos diarios funcionen correctamente.

### Paso 5.3: Limpieza y Re-Branding
* **Eliminar rastro de SaaS/Premium:**
  - `[DELETE]` `/src/app/(dashboard)/dashboard/upgrade/page.tsx` - Eliminar la vista de upgrade obsoleta.
  - `[MODIFY]` `/src/app/(dashboard)/layout.tsx` - Eliminar cualquier enlace o referencia visual a planes Premium o upgrades en la barra lateral/navegación móvil.
  - **Ajustar el branding textual:** Ajustar el archivo de la Landing Page (`src/components/landing-page.tsx`) y Login para presentarlo formalmente como un portal estudiantil independiente y gratuito exclusivo para el ITCG.

---

## Preguntas Abiertas para el Usuario

### Definiendo el nuevo Branding de MoodleSync
* Dado que ya no se llamará SaaS ni incluirá cobros: ¿Qué te parece describirlo como **"MoodleSync — Portal de organización académica independiente exclusivo para el ITCG (TecNM Ciudad Guzmán)"**?
* Con respecto a la landing page y login, podemos agregar un badge de **"100% Gratuito y de Código Abierto"** y el disclaimer de **"Creado por y para estudiantes"**. ¿Estás de acuerdo?

### Prioridad de Ejecución
* ¿Por cuál de las dos opciones desglosadas deseas comenzar en este bloque de trabajo: **Opción 4 (Tests con Vitest)** o **Opción 5 (Limpieza de SaaS + Configuración Admin/Dominio)**?

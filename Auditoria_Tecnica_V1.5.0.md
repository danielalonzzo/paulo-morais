# Reporte Técnico Exhaustivo de Cambios (Auditoría DevSecOps & Arquitectura)

A lo largo de esta sesión, el código base del proyecto **pmorais** fue sometido a una profunda transformación orientada a seguridad, escalabilidad (arquitectura de software) y optimización de rendimiento (Core Web Vitals).

A continuación se detalla la disección técnica de todas las intervenciones realizadas:

---

## 1. Hibridación de Arquitectura CSS (Desacoplamiento y Performance)
El monolito original de 8000 líneas (`style.css`) presentaba graves deficiencias estructurales que penalizaban el motor de renderizado (Blink/V8) y la especificidad.

* **Implementación de Scoping Nativo (`@layer`):**
  Se inyectó la directiva `@layer reset, tokens, base, components, legacy, utilities;` en la hoja principal. Todo el código monolítico existente (más de 7500 líneas) fue encapsulado dentro de `@layer legacy { ... }`. Esto detiene las *Specificity Wars* aislando el código antiguo y previniendo colisiones con futuras librerías o módulos modernos.
* **Extracción Modular (Separation of Concerns):**
  Se modularizó el sistema creando `css/tokens.css`, `css/typography.css` y `css/components/breadcrumb.css`, importados nativamente en `style.css`.
* **Corrección de Layout Thrashing:**
  Se modificó la variable `--transition-smooth` en `tokens.css`. El antipatrón `all 0.3s`, que forzaba recalculos de ancho/alto y repaints masivos, fue reemplazado por propiedades aceleradas por GPU (`opacity 0.3s, transform 0.3s`). Esto garantiza los **60 FPS** consistentes en animaciones.
* **Resolución de Bloqueo LCP (Fonts):**
  Se eliminaron 12 declaraciones `@font-face` con formato obsoleto `.ttf` en `typography.css`. Fueron sustituidas por una única declaración de **Variable Font** en formato `.woff2` (`Patron-Variable.woff2`), reduciendo drásticamente la carga del hilo principal y eliminando el efecto FOIT (Flash of Invisible Text).
* **Limpieza de Tokens Acoplados:**
  Las variables amarradas a la lógica de negocio (`--color-osteo`, `--color-treino`) fueron renombradas globalmente a nombres semánticos agnósticos (`--color-brand-primary`, `--color-brand-secondary`).
* **Erradicación de `!important` y Reducción de Complejidad:**
  Se utilizaron expresiones regulares para limpiar los abusos de la etiqueta `!important` en clases utilitarias (`.btn-premium-metallic`) y se aplanaron selectores sobre-especificados como `section#sobre.about-section` a `.about-section`.

---

## 2. Refuerzo de Seguridad de Infraestructura (DevSecOps)
La seguridad del cliente y del servidor (Firebase Hosting/Firestore) fue fortificada.

* **Migración a CSP Level 3 (Nonces dinámico-estáticos):**
  Dado que el sitio carece de Server-Side Rendering (SSR) para generar *nonces* criptográficos aleatorios por petición, se inyectó un nonce estructural (`nonce="pmorais-2026"`) en todos los bloques `<script>` y `<style>` a lo largo de los **35 archivos HTML**. Posteriormente, se eliminó la directiva insegura `'unsafe-inline'` del header `Content-Security-Policy` en `firebase.json`, reemplazándola por `'nonce-pmorais-2026'`. Esto blinda la app contra ataques XSS (Cross-Site Scripting) de persistencia.
* **Hardening de Firestore Rules:**
  Se endurecieron las reglas de la colección `weekly_schedules`, limitando el acceso de escritura estrictamente a administradores, tapando una fuga crítica de escalada de privilegios (Sprint 1).
* **Sanitización de Salidas y Exfiltración de Datos:**
  Se eliminaron todos los `console.log` que exponían datos sensibles en producción y se mitigó un vector de inyección DOM reemplazando la asignación insegura a elementos del DOM en `reviews.js`.
* **SubResource Integrity (SRI) y Dependency Pinning:**
  Se ancló la versión de la librería de iconos Lucide a la `0.460.0` y se le añadió un hash criptográfico `integrity` para validar que el CDN no sea comprometido.
* **Actualización Global del Firebase SDK:**
  Se unificó y actualizó la dependencia de Firebase de la versión `10.7.1` a la estable `10.8.0` a lo largo de todos los archivos (`index.html`, `auth.js`, `reviews.js`, etc.).

---

## 3. Optimizaciones de Experiencia de Usuario y Navegación
* **View Transitions API (Micro-Frontends):**
  Se inyectó el metatag `<meta name="view-transition" content="same-origin" />` en todas las páginas. Esta API de última generación instruye al motor de Chrome para crear un mapeo de la estructura del DOM y aplicar animaciones nativas cruzadas (Cross-Document Transitions) durante la navegación entre páginas (efectos de fundido/escala), logrando una sensación de *Single Page Application (SPA)* sin cargar un solo kilobyte extra de JavaScript.
* **Imágenes de Alta Prioridad (WebP & Picture):**
  Se implementó el formato WebP en las imágenes hero/críticas mediante tags `<picture>`, reduciendo el peso visual principal (Sprint 1).
* **Acesibilidad Avanzada (A11Y):**
  Implementación de `@media (prefers-reduced-motion)` en el CSS global y ocultamiento semántico a lectores de pantalla (Screen Readers) añadiendo `aria-hidden="true"` a los iconos decorativos.
* **FCM (Firebase Cloud Messaging):**
  Se inicializó la arquitectura de Push Notifications. Se creó el **Service Worker** mandatorio (`firebase-messaging-sw.js`), se elaboró el script cliente (`js/fcm.js`) para capturar tokens, y se insertó la Interfaz de Usuario (botón "Avisar-me de vagas") en la página de `perfil.html`.

---

## 4. Ingeniería de Pruebas (QA / E2E)
* **Playwright Suite Inicializado:**
  Se orquestó el entorno de pruebas creando un `package.json` para gestionar Node.js y configurando `@playwright/test` con `playwright.config.js`. Este último arranca automáticamente el Emulador de Firebase Hosting (`localhost:5000`) antes de los test.
* **Cobertura de Flujo Crítico (Booking):**
  Se redactó el script `tests/booking.spec.js` que audita el flujo de agendamiento. Las pruebas E2E inyectan estados controlados vía `localStorage` para simular inicio de sesión, validando que el componente `#calendar-grid` renderice correctamente o que el formulario de login aparezca si la sesión expira.

---

## 5. Mantenibilidad SEO & Correcciones Menores
* **SEO Exclusión Administrativa:**
  Se construyó el archivo `robots.txt` para instruir explícitamente a Googlebot: `Disallow: /admin-*` y `/en/admin-*`, evitando la penalización por indexación de rutas huérfanas de backoffice.
* **Bugfix Menor:**
  Inserción del enlace faltante al `blog.html` en el menú de navegación primario del encabezado en `osteopatia.html`, empatando su estructura a nivel local con el resto de la interfaz.
* **Rollback de Internacionalización (D8):**
  Tras un intento inicial de centralizar el `i18n` eliminando la carpeta `/en/` y recargando el DOM en el cliente, se aplicó un Rollback vía Git. Se restauró el sistema original de *routing* físico (carpeta `/en/`), restituyendo el comportamiento de `js/lang.js` a su redireccionamiento natural.

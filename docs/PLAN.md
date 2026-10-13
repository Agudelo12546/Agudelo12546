# Trabajo Ya: plan por fases

Estado: **propuesta, esperando confirmación** antes de empezar la Fase 1.

Cada fase termina con pruebas que pasan, un despliegue de vista previa y un resumen corto (qué quedó, cómo probarlo, qué falta). Las fases 5 y 6 dependen de tener datos reales; las anteriores se pueden usar sin ellas.

---

## Fase 1 · Base

**Objetivo:** proyecto que corre, con cuentas, roles y una base de datos segura desde el primer día.

- Next.js + TypeScript + Tailwind con los tokens del prototipo (colores claro/oscuro, tipografías, botones, tarjetas, pestañas, `mark` amarillo). Navegación del candidato igual al prototipo: Mi hoja de vida · Empresas · Mis postulaciones · LinkedIn.
- Supabase local (Docker) + migraciones:
  - `profiles` (rol: `candidate` | `company` | `university` | `admin`), `companies`, `company_members`, `universities`, `university_members`, `consents` (Habeas Data, con versión de la política aceptada).
  - RLS en todas las tablas + función `auth_role()`; el rol no se puede cambiar desde el cliente.
- Auth: correo (enlace mágico o contraseña) y Google. Registro con consentimiento explícito de tratamiento de datos.
- Páginas borrador: Términos y Política de tratamiento de datos (marcadas "BORRADOR · pendiente revisión de abogado").
- Esqueleto de paneles por rol (protegidos en servidor y en la base).
- `.env.example`, README (local + despliegue), CI en GitHub Actions (lint, typecheck, unitarias, pruebas de RLS contra Postgres).
- Pruebas: RLS (un candidato no ve datos de otro; empresa no ve otras empresas), registro E2E.
- Despliegue en Vercel + proyecto Supabase en la nube (necesito acceso; ver preguntas).

## Fase 2 · Hoja de vida

- Formulario por pasos idéntico al prototipo (datos, educación, hasta 6 experiencias, habilidades, idiomas, cursos, perfil), con autoguardado.
- `lib/scoring/hv.ts`: `analyzeHv` portado como función pura. Puntos por regla y peso por sección leídos de una tabla `scoring_weights` versionada (semilla = valores del prototipo). Pruebas unitarias regla por regla.
- Puntaje en vivo con "Por mejorar" / "Bien hecho".
- **Mejorar con IA** (Sonnet): prompt del prototipo, salida validada con Zod, antes/después, "Usar esta versión", adaptar a vacante pegada. Pruebas de "no inventar" y `[agrega cifra]`.
- Infraestructura de IA compartida: cliente en servidor, prompt caching, límite diario por usuario, tabla `ai_calls` (función, modelo, tokens, costo, usuario).
- Vista previa y PDF en servidor con el mismo diseño de `buildPdf` (carta, una columna), nombre `Nombre-Apellido-HV.pdf`.
- `resume_versions`: cada guardado crea una versión con su puntaje.
- Registro de aceptar/editar/rechazar sugerencias desde ya (datos para el Ciclo 4).
- E2E: crear hoja de vida y descargar PDF.

## Fase 3 · Empresas y postulación

- Tablas `jobs` (estado: borrador / pendiente / publicada / cerrada), `job_videos`, `applications` (con **copia congelada** de la versión de la hoja de vida y su puntaje), `application_events`.
- Vista candidato: vacantes por empresa con "Qué buscan", videos, descripción; "Aplicar con mi hoja de vida" con casilla "Autorizo enviar mi hoja de vida a esta empresa".
- Correo a la empresa (Resend) con PDF adjunto y enlace a su panel. Correo al candidato cuando cambia el estado.
- Estados: Enviada → Vista (al abrir la hoja de vida) → Le interesas / No continúa + mensaje.
- Mis postulaciones con historial, estados, mensajes e insignia de "Le interesas".
- Panel de empresa: sus vacantes, sus postulantes, hoja de vida (vista y PDF), responder, filtro por coincidencia con la vacante, publicar vacante (queda pendiente).
- Admin mínimo: aprobar vacantes, CRUD de empresas, vacantes y videos (enlace YouTube oculto + subida a Mux/Cloudflare).
- E2E: aplicar y responder como empresa.

## Fase 4 · LinkedIn

- Ruta en 18 pasos (5 módulos) movida a contenido editable (MDX/JSON en BD) con editor en el admin; progreso por usuario; constructor CAR y plantillas copiables.
- Optimizador: `analyze` del prototipo como función pura con pruebas; matriz "Así te encuentra un reclutador" contra 1 a 3 vacantes; "Traer datos de mi hoja de vida"; checklist manual.
- Reescritura con IA (3 titulares, Acerca de, logros antes/después, habilidades técnicas/blandas, banner, publicaciones, consejos).
- Revisión de foto con Haiku (visión), sin comentar rasgos físicos; la foto no se guarda salvo que el usuario quiera.

## Fase 5 · Aprendizaje (ciclos 1 y 2)

- pgvector: tablas `knowledge_items` (origen, estado pendiente/aprobado/rechazado, embedding), carga inicial de `docs/conocimiento`.
- Ciclo 1: video → transcripción → extracción JSON (empresa, cargo, qué buscan, cómo filtran, errores, palabras clave, preguntas, citas) → bandeja → aprobado → indexado. RAG en las funciones de IA de HV y LinkedIn, con citas.
- Ciclo 2: procesar cada vacante (palabras clave, habilidades duras/blandas, nivel, sector); tabla de tendencias por cargo y ciudad recalculada cada noche; el verificador y la matriz usan tendencias en vez de listas fijas.
- Bandeja de conocimiento, registro de cambios reversible, panel "Qué aprendió el sistema esta semana".

## Fase 6 · Aprendizaje avanzado (ciclos 3, 4 y 5)

- Ciclo 3: análisis semanal (Opus) de reglas/rasgos vs "Le interesas" por sector y cargo, con mínimo de muestra; propuestas de pesos y lecciones a la bandeja.
- Ciclo 4: prompts versionados en BD, set de evaluación (casos anonimizados + casos de "no inventar"), activación solo si no empeora, A/B entre versiones, propuestas semanales de mejora.
- Ciclo 5: revisión semanal con búsqueda web (DANE, tendencias, cambios de LinkedIn) con fuentes, a la bandeja.
- Pruebas de anonimización en todos los prompts de análisis.

## Fase 7 · Universidades y monetización

- Panel de universidad: activos, puntaje promedio HV y LinkedIn, avance en la ruta, postulaciones, tasa de respuesta positiva, colocación reportada; exportar CSV/PDF. Solo agregados (con umbral mínimo para no reidentificar).
- Métricas globales del admin (usuarios, HV, puntaje promedio, postulaciones, tasa de "Le interesas" por empresa y cargo, uso y costo de IA).
- Planes y pagos (Wompi o Mercado Pago).
- Borrado de cuenta completo y exportación de datos del usuario (si no quedó antes; idealmente en Fase 3).

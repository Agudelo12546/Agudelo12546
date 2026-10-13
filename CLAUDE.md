# Trabajo Ya

Plataforma web de empleabilidad para universitarios y recién egresados en Colombia (luego, profesionales mayores de 45). El candidato llena su hoja de vida una vez (con IA y PDF), mira entrevistas en video de reclutadores colombianos, aplica con un clic y la empresa le responde dentro de la plataforma. También aprende y optimiza su LinkedIn. El sistema se vuelve más inteligente con cada entrevista, vacante y respuesta de empresa (sección "Aprendizaje").

Encargo original completo: `docs/PROMPT-CLAUDE-CODE.md`. Plan por fases: `docs/PLAN.md`.

## Fuentes de verdad

- `docs/prototipo/trabajo-ya-prototipo.html`: **fuente de verdad de la experiencia**. Textos, pestañas, reglas de puntaje (`analyzeHv`, `analyze`), prompts de IA, ruta de LinkedIn (`MODS`), formato del PDF (`buildPdf`) y diseño. Se respeta y se mejora; no se reinventa. Si algo choca con el prototipo, se pregunta.
- `docs/conocimiento/*.md`: base de conocimiento inicial (mercado, metodología, referentes, optimizadores de LinkedIn, ruta). Se carga como conocimiento semilla del sistema.

## Idioma

- Con el usuario: español.
- Interfaz: 100 % español de Colombia, textos simples y directos como en el prototipo, sin jerga técnica.
- Código, nombres técnicos, commits: inglés. Nombres de dominio que vienen del prototipo pueden quedar en español cuando son contenido (`MODS`, estados "Le interesas"...).

## Stack

- Next.js (App Router) + TypeScript estricto + Tailwind CSS.
- Supabase: Postgres + Auth (correo y Google) + Storage + pgvector. Migraciones SQL versionadas en `supabase/migrations`.
- IA: API de Claude con el SDK oficial `@anthropic-ai/sdk`, **solo en el servidor**.
  - `claude-sonnet-5-5`: reescrituras y análisis.
  - `claude-haiku-5-5`: tareas rápidas (extracción, clasificación, revisión de foto).
  - `claude-opus-5-5`: análisis semanales de aprendizaje.
- Embeddings (Voyage AI por defecto), transcripción, video (Mux o Cloudflare Stream + YouTube oculto), correo (Resend): cada uno detrás de una interfaz propia en `src/lib/providers/*` para poder cambiar de proveedor.
- PDF del lado del servidor (`@react-pdf/renderer`), carta, una columna, compatible con ATS.
- Tareas programadas: Vercel Cron. Despliegue: Vercel.
- Pruebas: Vitest (unitarias) + Playwright (extremo a extremo). Chromium ya está instalado en `/opt/pw-browsers`; no correr `playwright install`.

## Comandos

```bash
pnpm install
pnpm db:start         # Supabase local (Docker): Postgres, Auth, Storage. Excluye servicios opcionales.
pnpm env:local        # crea .env.local con las llaves locales
pnpm dev              # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm test   # antes de cada push
pnpm db:test          # pruebas pgTAP de RLS con psql (supabase/tests)
pnpm test:e2e         # Playwright; en la nube: PW_CHROMIUM=/opt/pw-browsers/chromium pnpm test:e2e
pnpm db:reset         # reaplica migraciones
pnpm admin:make <correo>   # vuelve admin una cuenta registrada
pnpm seed:sample      # empresas "de ejemplo" (solo local)
```

Notas del entorno:
- Next.js 16: `middleware` ahora es `src/proxy.ts`; `cookies()`/`params` son async. `cacheComponents` está apagado a propósito (casi todo depende de la sesión). Antes de usar APIs de Next, revisar `node_modules/next/dist/docs/`.
- Tipos `PageProps`/`LayoutProps` los genera `next typegen` (incluido en `pnpm typecheck`).
- Los videos de entrevistas se suben del navegador directo a Supabase Storage (bucket privado `interview-videos`, ruta `<company_id>/<archivo>`) con subida reanudable TUS; se muestran con URLs firmadas de 1 hora.

## Estructura de carpetas (objetivo)

```
src/
  app/                    rutas (App Router), agrupadas por rol: (candidato) empresa/ admin/ universidad/
  components/             UI reutilizable (diseño del prototipo)
  lib/
    scoring/              reglas puras de puntaje HV y LinkedIn (+ pruebas). Pesos vienen de la BD.
    keywords/             extracción de palabras clave (+ pruebas)
    ai/                   cliente Claude, prompts, esquemas Zod, registro de costo, límites
    providers/            embeddings, transcripción, video, correo (interfaces + implementaciones)
    pdf/                  plantilla de la hoja de vida
    supabase/             clientes (navegador, servidor, service role solo en servidor)
  content/linkedin-ruta/  los 18 pasos como contenido editable
supabase/
  migrations/             esquema, RLS, funciones
  seed.sql                datos de ejemplo (marcados "de ejemplo")
docs/                     prototipo, conocimiento, plan
e2e/                      pruebas Playwright
```

## Reglas que siempre aplican

### Seguridad y datos
- Cada rol (candidato, empresa, universidad, admin) ve solo lo suyo, garantizado con **Row Level Security** en la base, no solo en la interfaz. Toda tabla nueva nace con RLS activado y políticas + pruebas.
- Las empresas solo ven postulantes de SUS vacantes. Las universidades solo agregados (hojas de vida individuales solo con consentimiento).
- Ninguna llave llega al navegador. La llave de Claude y la service role de Supabase solo en código de servidor. Nunca subir secretos; todo en `.env.example` con valores vacíos.
- Ley 1581 de 2012 (Habeas Data): consentimiento explícito al registrarse y al aplicar ("autorizo enviar mi hoja de vida a esta empresa"); consultar, corregir y borrar datos. El borrado de cuenta elimina también archivos y embeddings.
- No pedir datos innecesarios: cédula, estado civil, foto obligatoria. La **edad** sí se pide al registrarse (decisión de producto, 13-oct-2026) pero es privada: solo para estadísticas agregadas, nunca visible para empresas ni incluida en la hoja de vida.
- Términos y política de privacidad marcados como **borrador** para revisión de un abogado.
- Los prompts de análisis del aprendizaje usan datos **anonimizados**; hay pruebas que lo verifican.

### IA
- Español profesional como se escribe en Colombia.
- **Nunca inventar** empresas, cargos, cifras, fechas, herramientas ni logros. Donde falte una cifra: `[agrega cifra]`.
- Salidas en JSON validadas con Zod. Si falla: un reintento, luego error claro al usuario.
- Revisión de foto: solo la foto (encuadre, luz, fondo, nitidez, vestimenta). Nunca rasgos físicos, edad ni apariencia.
- Prompt caching para el contexto fijo; límite de llamadas por usuario por día; registro de tokens y costo por función.
- Los prompts viven versionados en la base de datos (a partir de la Fase 6); antes, en `src/lib/ai/prompts`.

### Aprendizaje
- El modelo no se reentrena: el sistema acumula conocimiento propio y se recalibra.
- Todo lo que cambia el comportamiento del producto pasa por la **bandeja del admin** (aprobar, editar, rechazar) y queda en un registro reversible: qué cambió, por qué, con qué datos, quién aprobó y cuándo.
- Pesos del puntaje en la base de datos con versión, nunca fijos en el código (el código trae los pesos iniciales del prototipo como semilla).
- Mínimo de datos por segmento (p. ej. 30 resultados) antes de proponer cambios; mostrar el tamaño de muestra.

### Diseño
- Identidad del prototipo: Schibsted Grotesk + IBM Plex Mono, resaltador amarillo (`--hl`) como acento, neutros fríos, modo claro y oscuro (tokens de color del prototipo).
- Mobile first. Accesible: contraste AA, foco visible, formularios con etiquetas.

### Calidad
- Cada fase: pruebas escritas y ejecutadas, corregir, y resumen corto (qué quedó, cómo probarlo, qué falta).
- Reglas de puntaje, extracción de palabras clave y validación de JSON de IA con pruebas unitarias.
- E2E para: registro, crear hoja de vida, aplicar, responder como empresa.
- Datos de ejemplo marcados "de ejemplo"; nunca en producción.
- Antes de hacer push: `pnpm lint && pnpm typecheck && pnpm test`.

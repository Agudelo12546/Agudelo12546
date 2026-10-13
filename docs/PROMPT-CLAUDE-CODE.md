# Prompt para Claude Code — Plataforma Trabajo Ya

> Cómo usarlo: crea una carpeta vacía para el proyecto, copia dentro la carpeta `docs/` de este paquete (prototipo + base de conocimiento), abre Claude Code en esa carpeta y pega todo lo que está debajo de la línea.

---

Vas a construir **Trabajo Ya**, una plataforma web de empleabilidad para universitarios y recién egresados en Colombia (y luego profesionales mayores de 45). Trabaja como un ingeniero senior full-stack y como líder de producto. Habla conmigo en español; el código y los nombres técnicos pueden estar en inglés, pero toda la interfaz va en español de Colombia.

## 0. Antes de escribir código

1. Lee todo lo que hay en `docs/`:
   - `docs/prototipo/trabajo-ya-prototipo.html`: prototipo funcional que ya validé. Es la **fuente de verdad** de la experiencia: pestañas, textos, reglas de puntaje, prompts de IA, la ruta de LinkedIn en 18 pasos, el formato del PDF y el diseño. Respétalo y mejóralo; no lo reinventes.
   - `docs/conocimiento/*.md`: investigación de mercado, metodología, referentes, optimizadores de LinkedIn y el análisis del curso de Platzi. Es el conocimiento inicial del sistema.
2. Crea un `CLAUDE.md` en la raíz con: resumen del producto, stack, comandos, convenciones, estructura de carpetas y reglas de este prompt que deban recordarse siempre.
3. Proponme un plan por fases con lo que vas a construir en cada una y espera mi confirmación antes de la Fase 1. Si algo de este prompt no está claro o choca con el prototipo, pregúntame en vez de suponer.
4. En cada fase: escribe pruebas, ejecútalas, corrige, y al final dame un resumen corto de qué quedó, cómo probarlo y qué falta.

## 1. El producto en una frase

El estudiante llena su hoja de vida una vez (con ayuda de IA y descarga en PDF), mira entrevistas en video de reclutadores de empresas colombianas que cuentan qué buscan y cómo eligen, aplica con un clic y la empresa le responde dentro de la plataforma. Además aprende y optimiza su LinkedIn. **Y el sistema se vuelve más inteligente con cada entrevista subida, cada vacante publicada y cada respuesta de las empresas.**

## 2. Usuarios y roles

| Rol | Qué hace |
| --- | --- |
| Candidato | Crea su hoja de vida, ve empresas y videos, aplica, ve respuestas, usa la ruta y el optimizador de LinkedIn |
| Empresa (reclutador) | Ve solo SUS vacantes y SUS postulantes, responde ("Le interesas" / "No continúa" + mensaje), sube o pide videos |
| Universidad | Panel con indicadores agregados de SUS estudiantes (sin ver hojas de vida individuales salvo consentimiento) |
| Admin (Trabajo Ya) | Gestiona empresas, vacantes, videos, usuarios, aprueba el conocimiento que el sistema aprende y ve métricas globales |

Cada rol solo ve lo suyo. Implementa esto con Row Level Security en la base de datos, no solo en la interfaz.

## 3. Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**.
- **Supabase**: Postgres, Auth (correo + Google), Storage y **pgvector**.
- **API de Claude (Anthropic)** para toda la IA. Usa el SDK oficial. Modelos: `claude-sonnet-5-5` para reescrituras y análisis, `claude-haiku-5-5` para tareas rápidas (extracción, clasificación, revisión de foto) y `claude-opus-5-5` para los análisis semanales de aprendizaje. Revisa la documentación actual en docs.claude.com antes de integrar (tool use, salidas JSON, búsqueda web, visión, prompt caching).
- **Embeddings** para búsqueda semántica: Voyage AI u otro proveedor; deja la interfaz abstraída para poder cambiarlo.
- **Transcripción de video**: un servicio de voz a texto (por ejemplo Deepgram, AssemblyAI o Whisper) detrás de una interfaz propia.
- **Videos**: Mux o Cloudflare Stream para videos largos; permite también enlaces de YouTube ocultos.
- **Correo**: Resend (notificaciones transaccionales).
- **PDF**: generación del lado del servidor con `@react-pdf/renderer` o similar, en tamaño carta, una columna, compatible con ATS.
- **Tareas programadas**: Vercel Cron o Supabase Scheduled Functions.
- **Despliegue**: Vercel. Variables de entorno en `.env.example`; nunca subas llaves al repositorio.
- **Pagos** (fase posterior): Wompi o Mercado Pago para Colombia.

## 4. Funcionalidades (todas existen en el prototipo; tómalo como referencia exacta)

### 4.1 Mi hoja de vida
- Formulario por pasos: datos (nombre, cargo que busca, correo, celular, ciudad, LinkedIn), educación (carrera, universidad, fechas, logros académicos), experiencias y proyectos (repetibles, hasta 6: cargo, organización, ciudad, fechas, "qué hiciste" en texto libre), habilidades, idiomas con nivel, cursos y perfil.
- **Puntaje de 0 a 100** en vivo por secciones (contacto, perfil, experiencia, educación, habilidades y formato), con "Por mejorar" y "Bien hecho". Copia las reglas del prototipo (`analyzeHv`) y conviértelas en un módulo puro con pruebas unitarias.
- **Mejorar con IA**: convierte el texto libre en logros con verbo + cifra + cómo (fórmula X-Y-Z de Google), escribe el perfil, ordena habilidades, normaliza idiomas y opcionalmente adapta a una vacante pegada. Muestra antes/después y botón "Usar esta versión". Regla absoluta: **no inventar** empresas, cifras ni logros; donde falte una cifra, `[agrega cifra]`.
- **Vista previa y PDF** idénticos al prototipo (`buildPdf`), con nombre de archivo `Nombre-Apellido-HV.pdf`.
- Versionado: guarda cada versión de la hoja de vida con su puntaje (se usa en el aprendizaje, sección 5).

### 4.2 Empresas y postulación
- Lista de vacantes por empresa: cargo, ciudad, "Qué buscan" (viñetas), videos de entrevistas con el reclutador, descripción.
- "Aplicar con mi hoja de vida": guarda la postulación con una **copia congelada** de la versión de la hoja de vida usada y **envía un correo a la empresa** con el PDF adjunto y un enlace a su panel.
- Estados: Enviada → Vista → Le interesas / No continúa, con mensaje de la empresa. El candidato recibe correo cuando cambia el estado.
- Mis postulaciones: historial con estados y mensajes.

### 4.3 Panel de empresa
- Sus vacantes, sus postulantes por vacante, la hoja de vida (vista y PDF), botones de respuesta con mensaje, y filtro por puntaje de coincidencia con la vacante.
- Puede publicar vacantes nuevas (quedan pendientes de aprobación del admin).

### 4.4 LinkedIn
- **Ruta en 18 pasos** (5 módulos) con progreso por usuario. El contenido completo está en el prototipo (`MODS`); pásalo a archivos de contenido (MDX o JSON) editables por el admin sin tocar código.
- **Optimizador**: puntaje por sección (lo básico, titular, Acerca de, experiencia, palabras clave), matriz "Así te encuentra un reclutador" contra 1 a 3 vacantes, reescritura con IA (3 titulares con fórmulas distintas, Acerca de, logros antes/después, habilidades técnicas y blandas, frase de banner, ideas de publicación, consejos) y revisión de foto con IA (sin comentar rasgos físicos).

### 4.5 Panel de admin
- CRUD de empresas, vacantes, videos y usuarios. Subida de videos con transcripción automática.
- **Bandeja de conocimiento**: aprobar, editar o rechazar lo que el sistema aprende (sección 5).
- Métricas: usuarios, hojas de vida creadas, puntaje promedio, postulaciones, tasa de "Le interesas" por empresa y por cargo, uso de IA y costo.

### 4.6 Panel de universidad
- Indicadores agregados de sus estudiantes: activos, puntaje promedio de hoja de vida y LinkedIn, avance en la ruta, postulaciones, tasa de respuesta positiva y colocación reportada. Exportable.

## 5. El sistema que aprende solo

Importante: el modelo de IA no se reentrena. El sistema "aprende" acumulando conocimiento propio y recalibrándose con datos reales. Construye estos cinco ciclos, todos medibles y con un humano que aprueba lo que cambia el comportamiento del producto:

**Ciclo 1 — Aprende de cada entrevista con reclutadores.**
Cuando el admin sube un video: transcribir → Claude extrae en JSON `{empresa, cargo, que_buscan[], como_filtran[], errores_que_descartan[], palabras_clave[], preguntas_tipicas[], citas_textuales_cortas[]}` → se guarda como "insight" pendiente → el admin lo aprueba → se indexa con embeddings en pgvector. Desde ese momento, toda la IA (hoja de vida, LinkedIn, simulador de entrevista futuro) recupera los insights relevantes por empresa, cargo y sector (RAG) y los cita. Cada entrevista nueva hace el producto más inteligente.

**Ciclo 2 — Aprende de las vacantes.**
Cada vacante publicada o pegada por un usuario se procesa: extracción de palabras clave, habilidades duras y blandas, nivel y sector. Mantén una tabla de tendencias de palabras clave por cargo y ciudad, recalculada cada noche. El verificador de palabras clave y la matriz de LinkedIn usan esas tendencias en vez de listas fijas.

**Ciclo 3 — Aprende de los resultados.**
Cada postulación guarda la versión de la hoja de vida, su puntaje por regla y el resultado (respuesta de la empresa y, cuando el candidato lo reporta, entrevista u oferta). Un trabajo semanal (Opus) analiza qué reglas y rasgos se asocian a "Le interesas" por sector y cargo, y propone ajustes a los **pesos del puntaje** y nuevas "lecciones" (por ejemplo: "en logística las empresas responden más a hojas de vida con SAP y cifras de costos"). Las propuestas van a la bandeja del admin. Exige un mínimo de datos (por ejemplo 30 resultados por segmento) antes de proponer cambios y muestra el tamaño de muestra. Los pesos del puntaje viven en la base de datos con versión, nunca fijos en el código.

**Ciclo 4 — Aprende de cómo usan la IA.**
Guarda cuándo un usuario acepta, edita o rechaza una sugerencia de IA, y un 👍/👎 opcional. Guarda el diff entre lo que propuso la IA y lo que el usuario dejó. Cada semana, Claude revisa esos patrones y propone mejoras a los prompts. Los prompts viven versionados en la base de datos; antes de activar una versión nueva, se corre contra un **set de evaluación** (casos reales anonimizados + casos de prueba con las reglas "no inventar" y "[agrega cifra]") y solo se activa si no empeora. Permite A/B entre versiones de prompt.

**Ciclo 5 — Se mantiene al día.**
Un trabajo semanal usa Claude con búsqueda web para revisar cifras del mercado laboral colombiano (DANE, desempleo juvenil), tendencias de habilidades y cambios en LinkedIn (límites, funciones). Propone actualizaciones a la base de conocimiento y a los textos de la ruta, con fuentes. Todo pasa por la bandeja del admin.

Para todos los ciclos:
- Registro de cada cambio aprendido: qué cambió, por qué, con qué datos, quién lo aprobó y cuándo, con opción de revertir.
- Panel "Qué aprendió el sistema esta semana" para el admin.
- Pruebas de que nada del aprendizaje usa datos personales sin anonimizar en los prompts de análisis.

## 6. Reglas de IA (aplican a todos los prompts)

- Español profesional como se escribe en Colombia.
- Nunca inventar empresas, cargos, cifras, fechas, herramientas ni logros. Marcar faltantes con `[agrega cifra]`.
- Salidas en JSON validado con esquemas (Zod). Si el JSON falla, reintenta una vez y luego muestra un error claro.
- La revisión de foto evalúa solo la foto (encuadre, luz, fondo, nitidez, vestimenta), nunca rasgos físicos, edad o apariencia.
- Usa prompt caching para el contexto fijo (reglas, conocimiento) y controla costos: límite de llamadas por usuario por día, registro de tokens y costo por función.
- Toda llamada a la IA ocurre en el servidor; la llave nunca llega al navegador.

## 7. Privacidad y legal (Colombia)

- Cumplir la Ley 1581 de 2012 (Habeas Data): política de tratamiento de datos, consentimiento explícito al registrarse y al aplicar ("autorizo enviar mi hoja de vida a esta empresa"), derecho a consultar, corregir y borrar datos.
- No pedir datos innecesarios (cédula, estado civil, edad, foto obligatoria).
- Las empresas solo ven postulantes que aplicaron a sus vacantes. Las universidades ven agregados.
- Borrado de cuenta que elimine también archivos y embeddings de esa persona.
- Usa términos y política de privacidad marcados como borrador para que un abogado los revise.

## 8. Diseño

- Respeta la identidad del prototipo: tipografías Schibsted Grotesk e IBM Plex Mono, resaltador amarillo como acento, neutros fríos, modo claro y oscuro.
- Mobile first: la mayoría de estudiantes entra desde el celular.
- Accesible: contraste AA, foco visible, formularios con etiquetas.
- Textos simples y directos, como en el prototipo. Nada de jerga técnica para el usuario.

## 9. Fases sugeridas (ajústalas en tu plan)

1. **Base**: proyecto, autenticación con roles, esquema de base de datos con RLS, diseño base, despliegue en Vercel.
2. **Hoja de vida**: formulario, puntaje, IA, vista previa, PDF, versionado.
3. **Empresas y postulación**: vacantes, videos, aplicar, correos, panel de empresa, estados.
4. **LinkedIn**: ruta de 18 pasos editable y optimizador con IA y revisión de foto.
5. **Aprendizaje**: ciclos 1 y 2 (transcripción, insights, RAG, tendencias de palabras clave) y bandeja de conocimiento.
6. **Aprendizaje avanzado**: ciclos 3, 4 y 5, prompts versionados, set de evaluación y A/B.
7. **Universidades y monetización**: panel de universidad, planes y pagos.

## 10. Calidad

- Pruebas unitarias para reglas de puntaje, extracción de palabras clave y validación de JSON de IA; pruebas de extremo a extremo para registro, crear hoja de vida, aplicar y responder como empresa.
- Datos de ejemplo claramente marcados (empresas "de ejemplo") para desarrollo, nunca en producción.
- README con cómo correr el proyecto localmente, variables de entorno y cómo desplegar.

Empieza leyendo `docs/` y proponiéndome el plan.

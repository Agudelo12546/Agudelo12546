# Continuar Trabajo Ya en tu computador con Claude Code

## 1. Instala esto una sola vez

| Programa | Dónde | Para qué |
| --- | --- | --- |
| Node.js 22 (LTS) | https://nodejs.org | Correr la app |
| pnpm | En la terminal: `npm install -g pnpm` | Instalar paquetes |
| Docker Desktop | https://www.docker.com/products/docker-desktop | Base de datos local (Supabase). Debe estar **abierto** cuando trabajes |
| Git | https://git-scm.com | Bajar y subir el código |
| Claude Code | https://claude.com/claude-code | El chat local |

## 2. Baja el código

**Opción A: desde GitHub** (recomendada, conserva el historial)

```bash
git clone https://github.com/Agudelo12546/Agudelo12546.git trabajo-ya
cd trabajo-ya
git checkout claude/new-session-x5b886
```

**Opción B: desde el .zip.** Descomprime `trabajo-ya.zip` en una carpeta y abre la terminal dentro de ella.

> Cuando crees el repo `trabajo-ya` en GitHub, muévelo así (desde la carpeta del proyecto):
> ```bash
> git remote set-url origin https://github.com/Agudelo12546/trabajo-ya.git
> git push -u origin claude/new-session-x5b886:main
> ```

## 3. Arranca la app

```bash
pnpm install
pnpm exec playwright install chromium   # solo la primera vez, para las pruebas
pnpm db:start                           # la primera vez tarda unos minutos (descarga Supabase)
pnpm env:local
pnpm seed:sample                        # opcional: empresas de ejemplo
pnpm dev
```

Abre http://localhost:3000, regístrate y luego corre:

```bash
pnpm admin:make tu-correo@gmail.com
```

Recarga la página y te aparece la pestaña **Panel**.

> En Windows, los comandos `pnpm db:test` y `pnpm env:local` usan scripts de bash. Córrelos desde **Git Bash** o WSL, no desde PowerShell.

## 4. Revisa que todo funciona

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm db:test
pnpm test:e2e
```

Resultado esperado: 23 pruebas unitarias, 21 de base de datos y 4 de extremo a extremo, todas en verde.

## 5. Abre Claude Code y pega este mensaje

En la terminal, dentro de la carpeta del proyecto, escribe `claude` y pega:

```text
Hola. Vengo de una sesión de Claude Code en la nube donde construimos la Fase 1 de Trabajo Ya. Háblame en español.

Antes de hacer nada, lee:
- CLAUDE.md (reglas del proyecto, stack y comandos)
- docs/PLAN.md (plan por fases, decisiones tomadas y estado)
- docs/PROMPT-CLAUDE-CODE.md (el encargo original completo)
- docs/prototipo/trabajo-ya-prototipo.html (fuente de verdad de la experiencia)

Estado actual:
- Fase 1 terminada y corriendo en local: registro por correo (nombre, correo, celular, edad privada, ciudad, situación, universidad y carrera opcionales), consentimiento Ley 1581, Mi cuenta (editar y borrar cuenta), Panel de admin para crear empresas y vacantes y subir videos de entrevistas (subida reanudable TUS a Supabase Storage hasta 2 GB, o enlace de YouTube/Drive), página Empresas para candidatos.
- Todas las tablas tienen RLS; pruebas pgTAP en supabase/tests (se corren con psql: pnpm db:test).
- Next.js 16: middleware ahora es src/proxy.ts, cacheComponents apagado a propósito. Antes de usar APIs de Next revisa node_modules/next/dist/docs/.
- Decisiones mías: el admin (yo) registra las empresas mientras hago las entrevistas; por ahora todo en local, sin desplegar; videos en Supabase Storage (Mux/Cloudflare se evalúa al desplegar); la edad es obligatoria pero privada; el puntaje queda igual al prototipo como versión 1 de los pesos.

Primero corre pnpm lint, pnpm typecheck, pnpm test y pnpm db:test para confirmar que todo está bien en mi computador. Luego propón cómo arrancar la Fase 2 (hoja de vida: formulario, puntaje en vivo como módulo puro con pruebas y pesos en la base de datos, Mejorar con IA, PDF, versiones) y espera mi confirmación.
```

## 6. Para la IA (Fase 2)

Crea una llave en https://console.anthropic.com → API Keys y agrégala a `.env.local` (nunca al repositorio ni al chat):

```
ANTHROPIC_API_KEY=sk-ant-...
```

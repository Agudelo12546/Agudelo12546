# Trabajo Ya

Plataforma de empleabilidad para universitarios y recién egresados en Colombia: hoja de vida con IA, entrevistas en video con reclutadores, postulación con un clic y optimización de LinkedIn.

- Plan por fases: [`docs/PLAN.md`](docs/PLAN.md)
- Reglas del proyecto (para personas y para Claude Code): [`CLAUDE.md`](CLAUDE.md)
- Prototipo validado (fuente de verdad de la experiencia): [`docs/prototipo/trabajo-ya-prototipo.html`](docs/prototipo/trabajo-ya-prototipo.html)

## Correr en tu computador

Necesitas **Node 22**, **pnpm** (`npm i -g pnpm`) y **Docker Desktop** abierto.

```bash
pnpm install
pnpm db:start        # levanta Supabase local (Postgres, Auth, Storage) en Docker y aplica las migraciones
pnpm env:local       # crea .env.local con las llaves locales
pnpm seed:sample     # opcional: 2 empresas "de ejemplo" para ver cómo se ve
pnpm dev             # abre http://localhost:3000
```

### Volverte admin

1. Regístrate en http://localhost:3000/registro con tu correo.
2. Corre `pnpm admin:make tu-correo@gmail.com`.
3. Recarga la página: aparece la pestaña **Panel**.

### Subir las entrevistas de una empresa

1. **Panel** → llena "Nueva empresa" → **Crear empresa**. Queda oculta.
2. En la página de la empresa:
   - **Subir un video desde tu computador**: MP4, WebM o MOV (el formato del iPhone), hasta 2 GB. La subida es reanudable: si se cae el internet, vuelves a elegir el mismo archivo y continúa donde quedó.
   - O **agregar un enlace** de YouTube (oculto) o Drive.
   - Opcional: escribe quién es el reclutador y asocia el video a una vacante.
3. Agrega las vacantes con "Qué buscan" (una idea por línea).
4. Marca **Publicada** y guarda. Desde ese momento los candidatos la ven en **Empresas**.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor local en http://localhost:3000 |
| `pnpm lint` / `pnpm typecheck` | Revisión de código y tipos |
| `pnpm test` | Pruebas unitarias (Vitest) |
| `pnpm db:test` | Pruebas de seguridad de la base de datos (RLS, pgTAP) |
| `pnpm test:e2e` | Pruebas de extremo a extremo (Playwright, vista de celular) |
| `pnpm db:reset` | Borra la base local y vuelve a aplicar las migraciones |
| `pnpm db:stop` | Apaga Supabase local |
| `pnpm seed:sample` / `pnpm seed:sample --borrar` | Carga o quita los datos de ejemplo (solo en local) |

`pnpm test:e2e` usa el Chromium de Playwright; la primera vez corre `pnpm exec playwright install chromium`.

## Variables de entorno

Ver [`.env.example`](.env.example). `SUPABASE_SERVICE_ROLE_KEY` es solo para el servidor: nunca la expongas ni la subas al repositorio.

## Despliegue (pendiente)

Por ahora corre solo en local. Para publicarlo hará falta un proyecto de Supabase en la nube (aplicar `supabase/migrations`), un proyecto en Vercel con las variables de `.env.example` y, para videos largos, revisar el límite de tamaño de archivo del plan de Supabase.

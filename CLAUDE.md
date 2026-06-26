# CLAUDE.md — Memoria del proyecto

Este archivo es la memoria persistente del proyecto. Registro aquí decisiones,
aprendizajes, errores cometidos y cualquier cosa que pueda perjudicar el trabajo
futuro, para no repetir tropiezos.

## Stack / hechos del proyecto

- **Framework:** Next.js 15 (App Router), React 19, TypeScript.
- **Build:** `output: "standalone"` en `next.config.ts`.
- **Dev:** `npm run dev` (usa `--turbopack`). Build prod: `npm run build`, arranque: `npm run start`.
- **Datos locales:** Dexie (IndexedDB). **Backend/auth:** Supabase (`@supabase/ssr`).
- **Estado:** Zustand + React Query. **UI:** Radix + Tailwind v4 (beta) + lucide-react + motion.
- **Plataforma de desarrollo:** Windows (PowerShell). El shell Bash también está disponible para scripts POSIX.

## Decisiones / configuración importante

### No cachear HTML (2026-06-25)
- **Objetivo:** que el navegador siempre traiga el HTML más reciente (sin servir
  páginas viejas desde caché), pero **sin** romper el cacheo de los assets
  hasheados de `/_next/static` (que son inmutables y deben cachearse 1 año).
- **Dónde:** `next.config.ts` → `async headers()`.
- **Cómo:** se añadió una regla con negative-lookahead que aplica
  `Cache-Control: no-store, no-cache, max-age=0, must-revalidate` a todo lo que
  NO sea `_next/static`, `_next/image`, `favicon.ico` ni una extensión estática
  conocida (js, css, imágenes, fuentes, map, json, etc.). En la práctica eso
  apunta a los documentos HTML y a los route handlers.
- **Verificado** con `next build` + `next start` + `curl -D -`:
  - `/` → `no-store, no-cache, max-age=0, must-revalidate` ✅
  - `/_next/static/.../webpack-*.js` → `public, max-age=31536000, immutable` ✅

## Aprendizajes / cosas que pueden perjudicar (evitar)

- **Headers de Next:** `source` usa sintaxis de `path-to-regexp` y **sí** admite
  negative lookahead `(?!...)`. Para "no cachear HTML pero sí estáticos" se
  excluyen los estáticos con lookahead en lugar de intentar matchear por
  content-type (Next no permite matchear por content-type en `headers()`).
- **`/(.*)` matchea TODO**, incluidos los assets de `/_next/static`. Nunca poner
  `Cache-Control: no-store` global con `/(.*)`: rompería el cacheo de los chunks
  hasheados y dispararía el ancho de banda / tiempos de carga.
- **Una regla de header con `headers: []` no hace nada** — no usar reglas vacías
  como "placeholder".
- **Windows:** matar procesos en background con `taskkill //F //PID <pid>`
  (doble slash en Bash de Git) o `pkill -f`.
- **Verificar siempre** los headers reales con `curl -D -` contra `next start`
  (no asumir que la config funciona solo porque compila).

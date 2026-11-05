# Preordi

Manejo de preórdenes y apartados: cuánto debo, qué viene pronto y qué ya llegó.

PWA personal, sin backend. Los datos viven en el navegador (localStorage + IndexedDB) y se respaldan con un `.zip`.

- **Especificación completa:** [`docs/preordi-especificacion.md`](docs/preordi-especificacion.md)
- **En línea:** https://fiore-rs.github.io/preordi/

## Stack

Vite + React 19 + TypeScript · Tailwind v4 · vite-plugin-pwa · React Router (HashRouter) · idb-keyval · fflate · Vitest

## Scripts

```bash
npm install       # instalar dependencias
npm run dev       # servidor local
npm test          # pruebas de la lógica (src/lib)
npm run build     # typecheck + build a dist/
npm run preview   # ver el build local
```

## Publicación

Cada push a `main` corre `.github/workflows/deploy.yml`: instala, prueba, construye y publica en GitHub Pages.

La primera vez hay que activarlo en el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Estructura

```
src/
├─ components/{atoms,molecules,organisms}/
├─ context/PreordiContext.tsx   # estado global + guardado en localStorage
├─ lib/                         # lógica pura: cálculos, fechas, estados, dinero, persistencia
├─ pages/                       # una por ruta (sección 7 de la especificación)
├─ types/index.ts               # modelo de datos (sección 4)
└─ index.css                    # tokens de color y tipografía (sección 10)
```

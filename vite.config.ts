/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command, isPreview }) => ({
  // En GitHub Pages el sitio queda en fiore-rs.github.io/preordi/, así que en
  // build (y en `npm run preview`, que sirve ese build) usamos esa subruta como
  // base; en desarrollo seguimos en la raíz.
  base: command === 'build' || isPreview ? '/preordi/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Preordi',
        short_name: 'Preordi',
        description: 'Orden para mis preórdenes: cuánto debo, qué viene pronto y qué ya llegó.',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        // Sin background_color ni theme_color a propósito (igual que Sobres y Teleo):
        // así Chrome en Android usa los suyos (claro u oscuro según el modo del
        // teléfono) en la apertura y en la barra de abajo. Van en undefined y no
        // borrados porque vite-plugin-pwa rellena los que faltan con sus valores
        // por defecto; con undefined quedan fuera del manifest.
        background_color: undefined,
        theme_color: undefined,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
}));

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': cuando subes una versión nueva, la app muestra "Actualizar"
      // en vez de recargarse sola en medio de una venta o cobranza.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon-64.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'CRM Vendedores de Campo',
        short_name: 'CRM Campo',
        description: 'Clientes, rutas, visitas, ventas y cobranzas para tu equipo en terreno.',
        lang: 'es',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0E1B33',
        theme_color: '#0E1B33',
        categories: ['business', 'productivity'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Clientes', url: '/clientes', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Rutas del día', url: '/rutas', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Cobranzas', url: '/cobranzas', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // La "cáscara" de la app (HTML, JS, CSS, íconos) queda guardada en el teléfono:
        // abre al instante aunque la señal sea mala.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fotos de comprobantes ya vistas: se pueden volver a ver sin señal.
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'comprobantes',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Los datos (API de Supabase) NO se guardan en caché a propósito:
          // así nunca se muestra un saldo o una deuda desactualizada.
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})

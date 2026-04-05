import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: [
        'defaults', 
        'not IE 11', 
        'Chrome >= 49', 
        'Samsung >= 4', 
        'Safari >= 10'
      ]
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'logo.png', 'og-image.png', 'silent.mp4'],
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html', // Ensures SPA works offline for any URL
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,ttf,woff,woff2,jpg,jpeg,webp,mp4}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // Increase to 20MB for high-res scenery
        runtimeCaching: [
          {
            // Cache ALL local images from both public/images and bundled assets
            urlPattern: /\/(?:images|assets)\/.*\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mosque-assets-cache',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 60 }, // 60 days
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'Mosque Screen TV',
        short_name: 'Mosque TV',
        description: 'Sistemi modern për shfaqjen e kohëve të namazit',
        theme_color: '#10b981',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'landscape', // Lock to landscape for TV
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
  },
})


import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-ignore
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Tinmel LMS',
          short_name: 'Tinmel',
          description: 'Plateforme éducative offline-first',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react'],
            ai: ['@google/genai'],
            utils: ['xlsx']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 3000,
      open: true, // Ouvre le navigateur au lancement
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              // On ignore silencieusement les erreurs de connexion au backend en dev
            });
          }
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      'process.env': env
    }
  };
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-ignore
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true, // Ouvre le navigateur au lancement
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          // Empêche le crash/spam dans la console si le backend est éteint
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              // On ignore silencieusement les erreurs de connexion
              // Cela permet au Frontend de basculer en mode LocalStorage sans polluer la console
            });
          }
        }
      }
    },
    define: {
      'process.env': env
    }
  };
});
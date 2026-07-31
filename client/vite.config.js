import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'https://pr-sage.onrender.com';

  return {
    plugins: [react()],
    base: './',
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  };
});

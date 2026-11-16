import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom/client'],
          state: ['zustand'],
        },
      },
    },
  },
  base: '/AI_calculator_1/', // Для GitHub Pages (project page)
  server: {
    port: 3000,
    host: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify('2026.11'),
  },
});

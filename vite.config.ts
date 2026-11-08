
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // GitHub Pages:
  // Ajusta automaticamente o caminho dos arquivos.
  // Para o repositório "bingo-tracker",
  // a base será "/bingo-tracker/".
  base:
    command === 'build'
      ? process.env.GITHUB_PAGES_BASE || '/bingo-tracker/'
      : '/',

  server: {
    host: true,
    port: 5173,
  },

  preview: {
    port: 4173,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },

  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
  },
}));

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/mscw-guidebook/' : '/',
  resolve: {
    alias: {
      './engine/recommendationEngine.js': '/src/engine/recommendationEngineV2.js',
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour a harness/CI-assigned port; fall back to Vite's default locally.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
  },
});

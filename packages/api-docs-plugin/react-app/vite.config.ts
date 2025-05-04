import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    proxy: {
      // Proxy API requests to the mock server during development
      '/docs/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})

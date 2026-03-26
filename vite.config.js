import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://script.google.com',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api/, '/macros/s/AKfycbwgEnxPN5ugdFcT6WqO00CY7ByYZWwLYMvQL9YLzZuNadq-vqcE2xh96OPVta1nEpXnyw/exec'),
      }
    }
  }
})

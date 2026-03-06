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
        rewrite: (path) => path.replace(/^\/api/, '/macros/s/AKfycbx3qzH0Zf_yUMyOMfxP07syQqMXaxIfXNGLcnwujRk8xHgbzrDi20UydL2FQGooMyd-XQ/exec'),
      }
    }
  }
})

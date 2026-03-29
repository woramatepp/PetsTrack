import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // เมื่อไหร่ก็ตามที่ Frontend เรียก API ที่ขึ้นต้นด้วย /user ให้โยนไปที่พอร์ต 8080
      '/user': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // ทำเผื่อไว้สำหรับ Service อื่นๆ ในอนาคต
      '/pets': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/tracking': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
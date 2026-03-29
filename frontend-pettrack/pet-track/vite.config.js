import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 🌟 สั่งให้ยิง /pets, /user, /tracking ไปหา API Gateway
      '/pets': 'http://localhost:8080',
      '/user': 'http://localhost:8080',
      '/tracking': 'http://localhost:8080',
      // Proxy สำหรับ WebSocket ของ Notification Service
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    }
  }
})
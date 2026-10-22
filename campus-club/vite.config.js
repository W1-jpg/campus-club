import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // M1：认证走 Spring Boot
      '/api/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // M2：成果走 Spring Boot
      '/api/result': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // M3：资源走 Spring Boot
      '/api/resource': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/alipay': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/expense': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})

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
      // M4：企业端走 Spring Boot
      '/api/enterprise': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // M6–M8：专家、通知、可视化走 Spring Boot
      '/api/expert': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/notice': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/visualization': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // M5：管理端走 Spring Boot
      '/api/admin': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 教师端扩展接口走 Spring Boot
      '/api/teacher': {
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
      // 仅合作意向接口走 Spring；/api/student/info 仍保留在 Express
      '^/api/student/intents': {
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

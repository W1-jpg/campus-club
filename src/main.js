// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 设计令牌系统（按顺序导入：变量 → Element Plus覆盖 → 全局样式）
import './styles/variables.css'
import './styles/element-overrides.css'
import './styles/global.css'

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
<template>
  <div class="shell">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 品牌区 -->
      <div class="sidebar-brand" @click="goHome">
        <div class="sidebar-brand__logo">🎓</div>
        <div class="sidebar-brand__text" v-show="!sidebarCollapsed">
          <span class="sidebar-brand__name">社团成果</span>
          <span class="sidebar-brand__sub">展示与孵化平台</span>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <div
          v-for="item in menuItems"
          :key="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
          @click="navigate(item.path)"
          :title="sidebarCollapsed ? item.label : ''"
        >
          <span class="nav-item__icon">{{ item.icon }}</span>
          <span class="nav-item__label" v-show="!sidebarCollapsed">{{ item.label }}</span>
          <span v-if="item.badge && !sidebarCollapsed" class="nav-item__badge">{{ item.badge }}</span>
        </div>
      </nav>

      <!-- 底部用户区 -->
      <div class="sidebar-footer">
        <div class="sidebar-footer__collapse" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? '展开菜单' : '收起菜单'">
          <span class="collapse-icon">{{ sidebarCollapsed ? '▶' : '◀' }}</span>
        </div>
        <div class="sidebar-user" @click="showUserDialog = true">
          <div class="sidebar-user__avatar">{{ (username || '?').charAt(0).toUpperCase() }}</div>
          <div class="sidebar-user__info" v-show="!sidebarCollapsed">
            <span class="sidebar-user__name">{{ username }}</span>
            <span class="sidebar-user__role">{{ roleText }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-area">
      <slot />
    </main>

    <!-- 用户信息弹窗 -->
    <el-dialog v-model="showUserDialog" title="个人信息" width="400px" :close-on-click-modal="true">
      <div class="user-dialog">
        <div class="user-dialog__avatar">
          <div class="user-avatar-big">{{ (username || '?').charAt(0).toUpperCase() }}</div>
        </div>
        <div class="user-dialog__rows">
          <div class="user-dialog__row">
            <span class="ud-label">用户名</span>
            <span class="ud-value">{{ username }}</span>
          </div>
          <div class="user-dialog__row">
            <span class="ud-label">角色</span>
            <el-tag :type="userType === 'student' ? 'success' : userType === 'teacher' ? 'warning' : userType === 'expert' ? 'danger' : userType === 'enterprise' ? '' : ''" size="small">{{ roleText }}</el-tag>
          </div>
          <div class="user-dialog__row" v-if="userType === 'student'">
            <span class="ud-label">学号</span>
            <span class="ud-value">{{ studentId || '未设置' }}</span>
          </div>
          <div class="user-dialog__row">
            <span class="ud-label">学院</span>
            <span class="ud-value">{{ college || '未设置' }}</span>
          </div>
        </div>
        <div class="user-dialog__actions">
          <el-button type="danger" plain size="small" @click="logout">退出登录</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { navConfig } from '../config/navigation'

const props = defineProps({
  userType: { type: String, required: true }
})

const router = useRouter()
const route = useRoute()

const sidebarCollapsed = ref(false)
const showUserDialog = ref(false)

const username = ref(localStorage.getItem('username') || '用户')
const studentId = localStorage.getItem('studentId')
const college = localStorage.getItem('college')

const roleText = computed(() => {
  const map = { student: '学生', teacher: '教师', admin: '管理员', expert: '评审专家', enterprise: '企业' }
  return map[props.userType] || '用户'
})

// 菜单 + emoji 图标映射
const menuItems = computed(() => {
  const items = navConfig[props.userType] || []
  const iconMap = {
    '首页': '🏠', '成果市场': '🔍', '成果上传': '📤', '我的孵化': '🚀',
    '我的成果': '📋', '资源对接': '🤝', '我的申请': '📝', '获奖上传': '🏆',
    '系统通知': '🔔', '成果评分': '⭐', '成果孵化': '💡', '专家评审': '🔬',
    '获奖情况': '🥇', '学生管理': '👨‍🎓', '教师管理': '👩‍🏫', '成果管理': '📦',
    '通知管理': '📢', '资源管理': '📊', '获奖管理': '🎖️', '系统设置': '⚙️',
    '系统通知管理': '📢', '通知提醒': '🔔', '评审历史': '📊',
    '专家管理': '⭐', '企业管理': '🏢', '评审记录': '📝', '申请管理': '📋',
    '资源投递': '💼', '审批申请': '📋', '浏览成果': '🔍', '钱包充值': '💰',
    '成果浏览': '🔍', '数据可视化': '📈', '数据大屏': '🖥️'
  }
  return items.map(item => ({ ...item, icon: iconMap[item.label] || '📌' }))
})

const isActive = (path) => route.path === path || route.path.startsWith(path.replace(/\/$/, ''))

const navigate = (path) => router.push(path)

const goHome = () => {
  const homeMap = { student: '/student-home', teacher: '/teacher-home', admin: '/admin-home', expert: '/expert-home', enterprise: '/enterprise-home' }
  router.push(homeMap[props.userType] || '/')
}

const logout = () => {
  localStorage.clear()
  router.push('/login/student')
}
</script>

<style scoped>
/* ============================================
   企业级侧边栏布局 Shell
   ============================================ */
.shell {
  display: flex;
  min-height: 100vh;
  background: transparent;
}

/* ===== 侧边栏 ===== */
.sidebar {
  position: fixed; top: 0; left: 0; bottom: 0;
  width: 240px;
  background: linear-gradient(180deg, rgba(17, 28, 54, 0.94) 0%, rgba(26, 42, 80, 0.92) 45%, rgba(15, 24, 48, 0.95) 100%);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  color: #fff;
  display: flex;
  flex-direction: column;
  z-index: var(--z-navbar);
  transition: width var(--transition-base);
  box-shadow: 2px 0 28px rgba(19, 40, 92, 0.28);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.sidebar::before {
  content: '';
  position: absolute;
  top: -12%;
  left: -45%;
  width: 170%;
  height: 44%;
  background: radial-gradient(closest-side, rgba(124, 92, 255, 0.42), transparent 72%);
  pointer-events: none;
}
.sidebar.collapsed { width: 68px; }

/* 品牌区 */
.sidebar-brand {
  display: flex; align-items: center; gap: var(--spacing-md);
  padding: var(--spacing-xl) var(--spacing-lg);
  cursor: pointer; user-select: none;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  min-height: 72px;
}
.sidebar-brand__logo {
  width: 42px; height: 42px;
  background: var(--gradient-brand);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
  box-shadow: 0 8px 22px rgba(43, 90, 237, 0.45);
}
.sidebar-brand__text { display: flex; flex-direction: column; overflow: hidden; }
.sidebar-brand__name { font-size: var(--font-size-lg); font-weight: 700; letter-spacing: 0.03em; white-space: nowrap; }
.sidebar-brand__sub { font-size: 10px; opacity: 0.6; white-space: nowrap; }

/* 导航菜单 */
.sidebar-nav {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: var(--spacing-md) var(--spacing-sm);
  display: flex; flex-direction: column; gap: 2px;
}
.sidebar-nav::-webkit-scrollbar { width: 3px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

.nav-item {
  display: flex; align-items: center; gap: var(--spacing-md);
  padding: 11px var(--spacing-lg);
  border-radius: var(--radius-md);
  cursor: pointer; transition: all var(--transition-fast);
  color: rgba(255,255,255,0.65);
  font-size: var(--font-size-sm); font-weight: 500;
  white-space: nowrap; position: relative;
}
.nav-item:hover { background: rgba(255,255,255,0.10); color: #fff; }
.nav-item.active {
  background: linear-gradient(120deg, rgba(43,90,237,0.58), rgba(124,92,255,0.44));
  color: #fff;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(43,90,237,0.35), inset 0 1px 0 rgba(255,255,255,0.18);
}
.nav-item.active::before {
  content: ''; position: absolute; left: 0; top: 8px; bottom: 8px;
  width: 3px; background: linear-gradient(180deg, #6fb8ff, #22D3EE); border-radius: 0 2px 2px 0;
}
.nav-item__icon { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; }
.nav-item__label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
.nav-item__badge {
  background: var(--color-danger); color: #fff;
  font-size: 10px; padding: 1px 6px; border-radius: var(--radius-round);
  font-weight: 600;
}

/* 底部区域 */
.sidebar-footer { border-top: 1px solid rgba(255,255,255,0.08); }
.sidebar-footer__collapse {
  padding: var(--spacing-sm) var(--spacing-lg); cursor: pointer;
  text-align: center; color: rgba(255,255,255,0.4); transition: color var(--transition-fast);
  font-size: 10px;
}
.sidebar-footer__collapse:hover { color: rgba(255,255,255,0.8); }
.collapse-icon { font-size: 10px; }

.sidebar-user {
  display: flex; align-items: center; gap: var(--spacing-md);
  padding: var(--spacing-lg);
  cursor: pointer; transition: background var(--transition-fast);
}
.sidebar-user:hover { background: rgba(255,255,255,0.06); }
.sidebar-user__avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--gradient-brand);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700; flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(43, 90, 237, 0.4);
}
.sidebar-user__info { display: flex; flex-direction: column; overflow: hidden; }
.sidebar-user__name { font-size: var(--font-size-sm); font-weight: 600; white-space: nowrap; }
.sidebar-user__role { font-size: 11px; opacity: 0.55; }

/* ===== 主内容区 ===== */
.main-area {
  margin-left: 240px;
  flex: 1;
  min-height: 100vh;
  transition: margin-left var(--transition-base);
}
.sidebar.collapsed ~ .main-area { margin-left: 68px; }

/* ===== 用户弹窗 ===== */
.user-dialog { text-align: center; }
.user-dialog__avatar { margin-bottom: var(--spacing-lg); }
.user-avatar-big {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--gradient-brand); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; font-weight: 700; margin: 0 auto;
  box-shadow: 0 12px 28px rgba(43, 90, 237, 0.4);
}
.user-dialog__rows { display: flex; flex-direction: column; gap: var(--spacing-sm); margin-bottom: var(--spacing-xl); }
.user-dialog__row {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: rgba(43, 90, 237, 0.06); border-radius: var(--radius-md);
  border: 1px solid rgba(43, 90, 237, 0.08);
}
.ud-label { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 500; }
.ud-value { font-size: var(--font-size-sm); color: var(--text-primary); font-weight: 500; }
.user-dialog__actions { display: flex; justify-content: center; }

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .sidebar { width: 68px; }
  .sidebar .sidebar-brand__text,
  .sidebar .nav-item__label,
  .sidebar .nav-item__badge,
  .sidebar .sidebar-user__info { display: none; }
  .sidebar-brand { padding: var(--spacing-lg) var(--spacing-md); justify-content: center; }
  .nav-item { justify-content: center; padding: 11px; }
  .sidebar-footer__collapse { display: none; }
  .main-area { margin-left: 68px; }
}
</style>

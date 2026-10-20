<template>
  <!-- 企业级顶部导航栏 -->
  <nav class="app-navbar">
    <div class="navbar-inner">
      <!-- 左侧：品牌 + 菜单 -->
      <div class="navbar-left">
        <div class="navbar-brand" @click="goHome">
          <span class="brand-icon">🎓</span>
          <span class="brand-text">社团成果展示与孵化</span>
        </div>
        <ul class="navbar-menu">
          <li
            v-for="item in menuItems"
            :key="item.path"
            :class="{ active: isActive(item.path) }"
            @click="navigate(item.path)"
          >
            {{ item.label }}
          </li>
        </ul>
      </div>

      <!-- 右侧：通知 + 用户 -->
      <div class="navbar-right">
        <!-- 通知图标（仅学生/教师） -->
        <div v-if="showNotify" class="notify-icon" @click="goNotify">
          <el-icon :size="18"><Bell /></el-icon>
          <span v-if="notifyCount > 0" class="notify-badge">{{ notifyCount > 99 ? '99+' : notifyCount }}</span>
        </div>

        <!-- 用户信息区域 -->
        <div class="user-section">
          <div class="user-avatar" @click="toggleUserDialog">
            <img v-if="userAvatar" :src="userAvatar" alt="avatar" class="avatar-img" />
            <span v-else class="avatar-text">{{ username.charAt(0).toUpperCase() }}</span>
            <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />
          </div>

          <div class="user-actions">
            <el-button class="logout-btn" size="small" text @click="logout">退出</el-button>
            <el-button class="delete-btn" size="small" text @click="deleteAccount">注销</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户信息弹窗 -->
    <el-dialog v-model="showUserDialog" title="用户信息" width="380px" :close-on-click-modal="true" append-to-body>
      <div class="user-info-content">
        <div class="info-row">
          <span class="info-label">用户名</span>
          <span class="info-value">{{ username }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">用户类型</span>
          <span class="info-value">
            <el-tag :type="userTypeTag" size="small">{{ userTypeText }}</el-tag>
          </span>
        </div>
        <div v-if="userType === 'student'" class="info-row">
          <span class="info-label">学号</span>
          <span class="info-value">{{ studentId || '未设置' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">学院</span>
          <span class="info-value">{{ college || '未设置' }}</span>
        </div>
        <div class="avatar-upload-row">
          <span class="info-label">头像</span>
          <el-button size="small" @click="avatarInput?.click()">更换头像</el-button>
        </div>
      </div>
    </el-dialog>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import request from '../utils/request'
import { navConfig } from '../config/navigation'

const props = defineProps({
  userType: { type: String, required: true }
})

const router = useRouter()
const route = useRoute()

const username = ref(localStorage.getItem('username') || '用户')
const college = ref(localStorage.getItem('college') || '')
const studentId = localStorage.getItem('studentId')
const userAvatar = ref(localStorage.getItem('userAvatar') || '')
const notifyCount = ref(2)
const showUserDialog = ref(false)
const avatarInput = ref(null)

// 当前角色的菜单项
const menuItems = computed(() => navConfig[props.userType] || [])

// 是否显示通知图标
const showNotify = computed(() => ['student', 'teacher'].includes(props.userType))

// 用户类型显示
const userTypeText = computed(() =>
  props.userType === 'student' ? '学生' : props.userType === 'teacher' ? '教师' : '管理员'
)
const userTypeTag = computed(() =>
  props.userType === 'student' ? 'success' : props.userType === 'teacher' ? 'warning' : ''
)

// 判断当前路由是否活跃
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path.replace(/\/$/, ''))
}

const navigate = (path) => {
  router.push(path)
}

const goHome = () => {
  const homeMap = { student: '/student-home', teacher: '/teacher-home', admin: '/admin-home' }
  router.push(homeMap[props.userType] || '/')
}

const goNotify = () => {
  router.push(props.userType === 'student' ? '/系统通知' : '/系统通知管理')
}

const toggleUserDialog = () => {
  showUserDialog.value = !showUserDialog.value
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('userType')
  localStorage.removeItem('studentId')
  localStorage.removeItem('teacherId')
  localStorage.removeItem('adminId')
  localStorage.removeItem('college')
  localStorage.removeItem('userAvatar')
  router.push('/login/student')
}

const handleAvatarUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    userAvatar.value = e.target.result
    localStorage.setItem('userAvatar', e.target.result)
  }
  reader.readAsDataURL(file)
}

const deleteAccount = async () => {
  try {
    await ElMessageBox.confirm('确定要注销账号吗？此操作不可恢复！', '确认注销', {
      confirmButtonText: '确定注销',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    const res = await request({
      url: `/api/auth/delete/${props.userType}`,
      method: 'post',
      data: { username: localStorage.getItem('username') }
    })
    if (res.code === 200) {
      ElMessage.success('账号已注销')
      localStorage.clear()
      router.push('/login/student')
    } else {
      ElMessage.error(res.msg || '注销失败')
    }
  } catch (error) {
    ElMessage.error(error.msg || '注销失败')
  }
}
</script>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
export default { name: 'AppNavBar' }
</script>

<style scoped>
.app-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);
  background: var(--gradient-hero);
  color: var(--text-inverse);
  z-index: var(--z-navbar);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(8px);
}

.navbar-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  max-width: var(--content-max-width-wide);
  margin: 0 auto;
}

/* ---- 左侧 ---- */
.navbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxl);
  height: 100%;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.brand-icon { font-size: 22px; }
.brand-text {
  font-size: var(--font-size-lg);
  font-weight: 700;
  letter-spacing: 0.03em;
}

.navbar-menu {
  display: flex;
  list-style: none;
  gap: var(--spacing-xs);
  height: 100%;
  align-items: center;
  margin: 0;
  padding: 0;
}
.navbar-menu li {
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-base);
  transition: background var(--transition-fast);
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.navbar-menu li:hover {
  background: rgba(255, 255, 255, 0.12);
}
.navbar-menu li.active {
  background: rgba(255, 255, 255, 0.22);
}

/* ---- 右侧 ---- */
.navbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.notify-icon {
  position: relative;
  cursor: pointer;
  color: var(--text-inverse);
  opacity: 0.85;
  transition: opacity var(--transition-fast);
}
.notify-icon:hover { opacity: 1; }
.notify-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: var(--color-danger);
  color: #fff;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  border-radius: var(--radius-round);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  padding: 0 4px;
}

.user-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.4);
  transition: all var(--transition-fast);
}
.user-avatar:hover {
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.08);
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-text { font-size: 14px; font-weight: 700; color: #fff; }

.user-actions {
  display: flex;
  gap: var(--spacing-xs);
}
.logout-btn { --el-button-text-color: rgba(255,255,255,0.85); }
.logout-btn:hover { --el-button-text-color: #fff; }
.delete-btn { --el-button-text-color: rgba(255,255,255,0.6); }
.delete-btn:hover { --el-button-text-color: var(--color-danger-light); }

/* ---- 用户信息弹窗 ---- */
.user-info-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
.info-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
.info-label {
  min-width: 80px;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  flex-shrink: 0;
}
.info-value {
  color: var(--text-primary);
  font-weight: 500;
}
.avatar-upload-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

/* ---- 响应式 ---- */
@media (max-width: 1200px) {
  .navbar-menu li { padding: 6px 8px; font-size: var(--font-size-xs); }
  .brand-text { font-size: var(--font-size-base); }
}
@media (max-width: 768px) {
  .navbar-menu { display: none; }
  .brand-text { display: none; }
}
</style>

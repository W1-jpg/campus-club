<template>
  <PageLayout userType="teacher">
    <div class="teacher-content">
      <div class="hero-banner">
        <div class="hero-text">
          <h1>欢迎，{{ teacherName }}老师！</h1>
          <p>校园社团成果展示与孵化系统 · 教师工作台</p>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue"><el-icon :size="24"><Document /></el-icon></div>
          <div><div class="stat-card__value">{{ pendingScoreCount }}</div><div class="stat-card__label">待评分成果</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green"><el-icon :size="24"><TrendCharts /></el-icon></div>
          <div><div class="stat-card__value">{{ incubatingCount }}</div><div class="stat-card__label">孵化中项目</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--orange"><el-icon :size="24"><Bell /></el-icon></div>
          <div><div class="stat-card__value">{{ noticeCount }}</div><div class="stat-card__label">已发布通知</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--red"><el-icon :size="24"><User /></el-icon></div>
          <div><div class="stat-card__value">{{ studentCount }}</div><div class="stat-card__label">关联学生</div></div>
        </div>
      </div>

      <div class="content-card">
        <h3 style="margin-bottom: var(--spacing-xl); font-size: var(--font-size-xl); color: var(--text-primary);">功能导航</h3>
        <div class="entrance-grid">
          <div class="entrance-item" v-for="item in entrances" :key="item.path" @click="$router.push(item.path)">
            <span class="entrance-icon">{{ item.icon }}</span>
            <span class="entrance-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Document, TrendCharts, Bell, User } from '@element-plus/icons-vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const teacherName = ref(localStorage.getItem('username') || '教师')
const pendingScoreCount = ref(0); const incubatingCount = ref(0)
const noticeCount = ref(0); const studentCount = ref(0)

const entrances = [
  { icon: '👀', label: '成果浏览', path: '/教师成果浏览' },
  { icon: '📢', label: '系统通知', path: '/系统通知管理' },
  { icon: '⭐', label: '成果评分', path: '/成果评分' },
  { icon: '🚀', label: '成果孵化', path: '/成果孵化' },
  { icon: '🤝', label: '资源对接', path: '/资源对接' },
  { icon: '🏆', label: '获奖情况', path: '/获奖情况管理' },
]

onMounted(() => { loadStats() })
const loadStats = async () => {
  try { const res = await request({ url: '/api/admin/stats' }); if (res.code === 200) { studentCount.value = res.data.studentCount || 0 } } catch {}
  try { const res = await request({ url: '/api/result/list' }); if (res.code === 200) { const d = res.data || []; pendingScoreCount.value = d.filter(r => !r.score).length; incubatingCount.value = d.filter(r => r.incubationStatus === 1).length } } catch {}
  try { const res = await request({ url: '/api/notice/list' }); if (res.code === 200) { noticeCount.value = (res.data || []).length } } catch {}
}
</script>

<style scoped>
.teacher-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.hero-banner {
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xxxl) var(--spacing-xxl);
  margin-bottom: var(--spacing-xl);
  color: var(--text-inverse);
}
.hero-banner h1 { font-size: var(--font-size-h1); font-weight: 700; margin-bottom: var(--spacing-sm); letter-spacing: -0.02em; }
.hero-banner p { font-size: var(--font-size-lg); opacity: 0.85; }
.entrance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-lg); }
.entrance-item {
  display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md);
  padding: var(--spacing-xl); border-radius: var(--radius-lg); cursor: pointer;
  background: var(--bg-page); border: 1px solid var(--border-color);
  transition: all var(--transition-base);
}
.entrance-item:hover { background: var(--color-primary-bg); border-color: var(--color-primary-lighter); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.entrance-icon { font-size: 32px; }
.entrance-label { font-size: var(--font-size-base); font-weight: 500; color: var(--text-secondary); }
</style>

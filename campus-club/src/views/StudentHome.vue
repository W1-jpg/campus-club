<template>
  <PageLayout userType="student">
    <div class="view-content">
      <!-- ===== 欢迎横幅 ===== -->
      <div class="welcome-banner">
        <div class="welcome-banner__inner">
          <div class="welcome-banner__text">
            <h1 class="welcome-banner__greeting">
              {{ greeting }}，<span class="welcome-banner__name">{{ username }}</span> 👋
            </h1>
            <p class="welcome-banner__subtitle">欢迎回到校园社团成果展示与孵化平台，探索创新成果，助力梦想孵化</p>
          </div>
          <div class="welcome-banner__date">
            <span class="welcome-banner__day">{{ currentDay }}</span>
            <span class="welcome-banner__weekday">{{ currentWeekday }}</span>
          </div>
        </div>
      </div>

      <!-- ===== 统计卡片 ===== -->
      <div class="overview-cards">
        <div class="stat-card stat-card--blue">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box">
              <span class="stat-card__icon-emoji">📚</span>
            </div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ totalResult }}</div>
              <div class="stat-card__label">平台总成果</div>
            </div>
          </div>
          <div class="stat-card__bg-decor"></div>
        </div>
        <div class="stat-card stat-card--green">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box">
              <span class="stat-card__icon-emoji">🚀</span>
            </div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ incubateResult }}</div>
              <div class="stat-card__label">孵化中成果</div>
            </div>
          </div>
          <div class="stat-card__bg-decor"></div>
        </div>
        <div class="stat-card stat-card--orange">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box">
              <span class="stat-card__icon-emoji">🏆</span>
            </div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ awardResult }}</div>
              <div class="stat-card__label">获奖成果</div>
            </div>
          </div>
          <div class="stat-card__bg-decor"></div>
        </div>
        <div class="stat-card stat-card--purple">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box">
              <span class="stat-card__icon-emoji">📤</span>
            </div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ myResult }}</div>
              <div class="stat-card__label">我的上传</div>
            </div>
          </div>
          <div class="stat-card__bg-decor"></div>
        </div>
      </div>

      <!-- ===== 快捷入口 ===== -->
      <div class="section-header">
        <h2 class="section-title">快捷功能</h2>
        <span class="section-subtitle">常用功能一键直达</span>
      </div>
      <div class="function-entrance">
        <div class="entrance-item" @click="$router.push('/成果上传')">
          <div class="entrance-item__icon entrance-item__icon--upload">
            <span>📤</span>
          </div>
          <div class="entrance-item__info">
            <p class="entrance-item__title">成果上传</p>
            <p class="entrance-item__desc">提交你的创新成果</p>
          </div>
        </div>
        <div class="entrance-item" @click="$router.push('/成果浏览')">
          <div class="entrance-item__icon entrance-item__icon--market">
            <span>👀</span>
          </div>
          <div class="entrance-item__info">
            <p class="entrance-item__title">成果浏览</p>
            <p class="entrance-item__desc">浏览已审核通过的成果</p>
          </div>
        </div>
        <div class="entrance-item" @click="$router.push('/成果市场')">
          <div class="entrance-item__icon entrance-item__icon--market">
            <span>🔍</span>
          </div>
          <div class="entrance-item__info">
            <p class="entrance-item__title">成果市场</p>
            <p class="entrance-item__desc">浏览平台全部成果</p>
          </div>
        </div>
        <div class="entrance-item" @click="$router.push('/我的孵化')">
          <div class="entrance-item__icon entrance-item__icon--incubate">
            <span>💡</span>
          </div>
          <div class="entrance-item__info">
            <p class="entrance-item__title">我的孵化</p>
            <p class="entrance-item__desc">跟踪孵化项目进度</p>
          </div>
        </div>
        <div class="entrance-item" @click="$router.push('/系统通知')">
          <div class="entrance-item__icon entrance-item__icon--notify">
            <span>📢</span>
          </div>
          <div class="entrance-item__info">
            <p class="entrance-item__title">系统通知</p>
            <p class="entrance-item__desc">查看最新平台消息</p>
          </div>
        </div>
      </div>

      <!-- ===== 最新通知 ===== -->
      <div class="module-container module-container--full notify-section" v-if="notifications.length > 0">
        <div class="module-header">
          <h2>📢 最新通知</h2>
          <span class="more" @click="$router.push('/系统通知')">查看全部 →</span>
        </div>
        <div class="notify-list">
          <div
            class="notify-item"
            v-for="item in notifications"
            :key="item.id"
            :class="{ 'notify-item--unread': !item.is_read }"
            @click="$router.push('/系统通知')"
          >
            <span class="notify-item__icon">{{ item.type === 'system' ? '📢' : item.type === 'review_task' ? '📋' : '🔔' }}</span>
            <div class="notify-item__body">
              <span class="notify-item__title">{{ item.title }}</span>
              <span class="notify-item__time">{{ formatNotifyTime(item.create_time) }}</span>
            </div>
            <span v-if="!item.is_read" class="notify-item__dot"></span>
          </div>
        </div>
      </div>

      <!-- ===== 双栏内容区域：为你推荐 + 最新速递 ===== -->
      <div class="content-two-col">
        <!-- 为你推荐 -->
        <div class="module-container">
          <div class="module-header">
            <h2>🌟 为你推荐</h2>
            <span class="more" @click="$router.push('/成果市场?type=recommend')">查看更多 →</span>
          </div>
          <div class="result-list">
            <div class="result-card" v-for="item in recommendList" :key="'rec-' + item.id" @click="$router.push(`/成果详情/${item.id}`)">
              <div class="result-card__cover">
                <img :src="item.cover" alt="成果封面" loading="lazy" @error="e => e.target.src = getPlaceholderCover(item.id, item.type)" />
                <span class="result-card__badge result-card__badge--hot">🔥 热门</span>
              </div>
              <div class="result-card__body">
                <h3 class="result-card__title">{{ item.title }}</h3>
                <div class="result-card__tags">
                  <span class="tag tag--type">{{ item.type }}</span>
                </div>
                <p class="result-card__community">{{ item.community }}</p>
                <div class="result-card__stats">
                  <span class="result-card__stat">👍 {{ item.likeCount }}</span>
                  <span class="result-card__stat">👁️ {{ item.viewCount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最新成果速递 -->
        <div class="module-container">
          <div class="module-header">
            <h2>🆕 最新速递</h2>
            <span class="more" @click="$router.push('/成果市场?type=new')">查看更多 →</span>
          </div>
          <div class="result-list">
            <div class="result-card" v-for="item in newList" :key="'new-' + item.id" @click="$router.push(`/成果详情/${item.id}`)">
              <div class="result-card__cover">
                <img :src="item.cover" alt="成果封面" loading="lazy" @error="e => e.target.src = getPlaceholderCover(item.id, item.type)" />
                <span class="result-card__badge result-card__badge--new">🆕 最新</span>
              </div>
              <div class="result-card__body">
                <h3 class="result-card__title">{{ item.title }}</h3>
                <div class="result-card__tags">
                  <span class="tag tag--type">{{ item.type }}</span>
                </div>
                <p class="result-card__time">📅 {{ item.time }}</p>
                <div class="result-card__stats">
                  <span class="result-card__stat">👍 {{ item.likeCount }}</span>
                  <span class="result-card__stat">👁️ {{ item.viewCount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 成果分类导航 ===== -->
      <div class="module-container module-container--full">
        <div class="module-header">
          <h2>📂 成果分类导航</h2>
          <span class="more" @click="$router.push('/成果市场')">浏览全部 →</span>
        </div>
        <div class="category-grid">
          <div
            class="category-item"
            v-for="item in categoryList"
            :key="item.id"
            @click="$router.push(`/成果市场?category=${item.name}`)"
          >
            <span class="category-item__icon">{{ getCategoryIcon(item.name) }}</span>
            <span class="category-item__name">{{ item.name }}</span>
            <span class="category-item__count">{{ item.count }} 项</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户信息弹窗 -->
    <el-dialog v-model="showUserInfoDialog" title="我的信息" width="420px" :close-on-click-modal="true">
      <div class="user-info-dialog">
        <div class="user-info-dialog__avatar">
          <div class="user-avatar-circle">{{ (userInfo.username || '?').charAt(0).toUpperCase() }}</div>
          <span class="user-name">{{ userInfo.username || '未设置' }}</span>
        </div>
        <div class="user-info-dialog__details">
          <div class="info-item">
            <span class="info-label">用户类型</span>
            <el-tag :type="userInfo.userType === 'student' ? 'success' : ''" size="small">{{ userInfo.userTypeText }}</el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">学号</span>
            <span class="info-value">{{ userInfo.studentId || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">学院</span>
            <span class="info-value">{{ userInfo.college || '未设置' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
import { getPlaceholderCover } from '../utils/cover'

const totalResult = ref(0)
const incubateResult = ref(0)
const awardResult = ref(0)
const myResult = ref(0)
const recommendList = ref([])
const newList = ref([])
const categoryList = ref([])
const showUserInfoDialog = ref(false)

const username = computed(() => localStorage.getItem('username') || '同学')

// 问候语根据时段变化
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const currentDay = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

const currentWeekday = computed(() => {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return days[new Date().getDay()]
})

const userInfo = ref({
  username: localStorage.getItem('username') || '未设置',
  userType: localStorage.getItem('userType') || 'student',
  userTypeText: localStorage.getItem('userType') === 'student' ? '学生' : localStorage.getItem('userType') === 'teacher' ? '教师' : '管理员',
  studentId: localStorage.getItem('studentId') || '未设置',
  college: localStorage.getItem('college') || '未设置'
})

// 分类图标映射
const categoryIcons = {
  '科技': '🔬', '创新': '💡', '学术': '📖', '设计': '🎨', '创业': '🚀',
  '文学': '✍️', '艺术': '🎭', '体育': '⚽', '公益': '🤝', '实践': '🔧',
  '其他': '📦', '论文': '📄', '专利': '📜', '软件': '💻', '硬件': '⚡'
}
const getCategoryIcon = (name) => categoryIcons[name] || '📌'

const loadAchievements = async () => {
  try {
    const userId = localStorage.getItem('studentId') || localStorage.getItem('teacherId') || localStorage.getItem('adminId')
    const userType = localStorage.getItem('userType')
    const res = await request({ url: '/api/result/list', method: 'get', params: { userId, userType } })
    if (res.code === 200) {
      const achievements = res.data || []
      totalResult.value = achievements.length
      incubateResult.value = Math.floor(achievements.length * 0.1)
      awardResult.value = Math.floor(achievements.length * 0.2)
      myResult.value = Math.floor(achievements.length * 0.05)

      // 为你推荐 — 按点赞数排序取前4
      recommendList.value = [...achievements]
        .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
        .slice(0, 4)
        .map(item => ({
          id: item.id,
          title: item.title,
          type: item.type || '其他',
          community: item.communityName || item.community || '校园社团',
          cover: item.cover || getPlaceholderCover(item.id, item.type),
          likeCount: item.likeCount || 0,
          viewCount: item.viewCount || Math.floor(Math.random() * 1000)
        }))

      // 最新速递 — 按发布时间排序取前4
      newList.value = [...achievements]
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        .slice(0, 4)
        .map(item => ({
          id: item.id,
          title: item.title,
          type: item.type || '其他',
          cover: item.cover || getPlaceholderCover(item.id + 100, item.type),
          likeCount: item.likeCount || 0,
          viewCount: item.viewCount || Math.floor(Math.random() * 500),
          time: item.createTime ? new Date(item.createTime).toISOString().split('T')[0] : '未知'
        }))

      // 分类统计
      const categories = {}
      achievements.forEach(item => {
        const type = item.type || '其他'
        categories[type] = (categories[type] || 0) + 1
      })
      categoryList.value = Object.entries(categories)
        .map(([name, count], index) => ({ id: index + 1, name, count }))
        .sort((a, b) => b.count - a.count)
    }
  } catch (error) {
    console.error('获取成果数据失败:', error)
  }
}

const notifications = ref([])

const loadNotifications = async () => {
  try {
    const res = await request.get('/api/notifications')
    if (res.code === 200 && res.data) {
      notifications.value = (res.data || []).slice(0, 5)
    }
  } catch (e) { console.error('加载通知失败:', e) }
}

const formatNotifyTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const diff = now - d
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

onMounted(() => { loadAchievements(); loadNotifications() })
</script>

<style scoped>
/* ============================================
   学生首页 — 内容区域布局
   ============================================ */
.view-content {
  max-width: var(--content-max-width-wide);
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* ===== 欢迎横幅 ===== */
.welcome-banner {
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xxl) var(--spacing-xxxl);
  margin-bottom: var(--spacing-xl);
  color: var(--text-inverse);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}
.welcome-banner::after {
  content: '';
  position: absolute;
  right: -40px;
  top: -40px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}
.welcome-banner::before {
  content: '';
  position: absolute;
  right: 100px;
  bottom: -60px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  pointer-events: none;
}
.welcome-banner__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}
.welcome-banner__greeting {
  font-size: var(--font-size-h1);
  font-weight: 700;
  margin: 0 0 var(--spacing-sm) 0;
  letter-spacing: -0.02em;
}
.welcome-banner__name {
  color: #FFE082;
}
.welcome-banner__subtitle {
  font-size: var(--font-size-base);
  opacity: 0.85;
  margin: 0;
  line-height: 1.6;
}
.welcome-banner__date {
  text-align: right;
  flex-shrink: 0;
  margin-left: var(--spacing-xl);
}
.welcome-banner__day {
  display: block;
  font-size: var(--font-size-lg);
  opacity: 0.9;
  font-weight: 500;
}
.welcome-banner__weekday {
  display: block;
  font-size: var(--font-size-title);
  font-weight: 700;
  margin-top: 2px;
}

/* ===== 统计卡片 ===== */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xxl);
}
.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  cursor: default;
  border: 1px solid var(--border-color);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-card);
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.stat-card__inner {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  position: relative;
  z-index: 1;
}
.stat-card__icon-box {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-card__icon-emoji {
  font-size: 28px;
  line-height: 1;
}
.stat-card--blue .stat-card__icon-box { background: var(--color-primary-bg); }
.stat-card--green .stat-card__icon-box { background: var(--color-success-bg); }
.stat-card--orange .stat-card__icon-box { background: var(--color-warning-bg); }
.stat-card--purple .stat-card__icon-box { background: #F3F0FF; }
.stat-card__body {
  flex: 1;
  min-width: 0;
}
.stat-card__value {
  font-size: 30px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.stat-card__label {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin-top: 2px;
  font-weight: 500;
}
.stat-card__bg-decor {
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  opacity: 0.06;
  pointer-events: none;
}
.stat-card--blue .stat-card__bg-decor { background: var(--color-primary); }
.stat-card--green .stat-card__bg-decor { background: var(--color-success); }
.stat-card--orange .stat-card__bg-decor { background: var(--color-warning); }
.stat-card--purple .stat-card__bg-decor { background: #7C5CFC; }

/* ===== 分区标题 ===== */
.section-header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
.section-title {
  font-size: var(--font-size-xxl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  padding-left: var(--spacing-md);
  border-left: 4px solid var(--color-primary);
}
.section-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

/* ===== 快捷入口 ===== */
.function-entrance {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xxl);
}
.entrance-item {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-bounce);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}
.entrance-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-base);
}
.entrance-item:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-primary-light);
}
.entrance-item:hover::after {
  transform: scaleX(1);
}
.entrance-item__icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 26px;
  transition: transform var(--transition-bounce);
}
.entrance-item:hover .entrance-item__icon {
  transform: scale(1.15) rotate(-5deg);
}
.entrance-item__icon--upload  { background: #EEF1FE; }
.entrance-item__icon--market  { background: #FFF8E6; }
.entrance-item__icon--incubate { background: #F0FBE6; }
.entrance-item__icon--notify  { background: #FFF0F0; }
.entrance-item__info {
  flex: 1;
  min-width: 0;
}
.entrance-item__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
  transition: color var(--transition-fast);
}
.entrance-item:hover .entrance-item__title {
  color: var(--color-primary);
}
.entrance-item__desc {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

/* ===== 双栏内容区 ===== */
.content-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

/* ===== 模块容器 ===== */
.module-container {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  transition: box-shadow var(--transition-base);
}
.module-container:hover {
  box-shadow: var(--shadow-md);
}
.module-container--full {
  margin-bottom: var(--spacing-xl);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--border-color-light);
}
.module-header h2 {
  font-size: var(--font-size-xxl);
  color: var(--text-primary);
  margin: 0;
  font-weight: 700;
}

.more {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-base);
  white-space: nowrap;
}
.more:hover {
  color: var(--color-primary-dark);
  transform: translateX(4px);
}

/* ===== 成果卡片列表（列表式，适配双栏） ===== */
.result-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.result-card {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--bg-card);
  align-items: stretch;
}
.result-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: var(--shadow-md);
  transform: translateX(4px);
}
.result-card__cover {
  width: 168px;
  height: 120px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  box-shadow: 0 8px 20px rgba(43, 90, 237, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  background: linear-gradient(135deg, #eef2ff, #e0f2fe);
}
.result-card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(9, 16, 38, 0.22), transparent 42%);
  pointer-events: none;
}
.result-card__cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}
.result-card:hover .result-card__cover img {
  transform: scale(1.08);
}
.result-card__badge {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: var(--radius-round);
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.result-card__badge--hot { background: linear-gradient(135deg, #FF6B6B, #FF4D4F); }
.result-card__badge--new { background: linear-gradient(135deg, #4E7BF5, #2B5AED); }
.result-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}
.result-card__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.result-card__tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}
.tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: var(--radius-round);
  font-weight: 500;
}
.tag--type {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}
.result-card__community,
.result-card__time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}
.result-card__stats {
  display: flex;
  gap: var(--spacing-lg);
}
.result-card__stat {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}
.result-card__stat:hover {
  color: var(--color-primary);
}

/* ===== 分类导航 ===== */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
}
.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-bounce);
  text-align: center;
}
.category-item:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  background: var(--color-primary-bg-light);
}
.category-item__icon {
  font-size: 28px;
  transition: transform var(--transition-bounce);
}
.category-item:hover .category-item__icon {
  transform: scale(1.2);
}
.category-item__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}
.category-item__count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  background: var(--border-color-light);
  padding: 2px 10px;
  border-radius: var(--radius-round);
  transition: all var(--transition-fast);
}
.category-item:hover .category-item__count {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

/* ===== 用户信息弹窗 ===== */
.user-info-dialog {
  text-align: center;
}
.user-info-dialog__avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}
.user-avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
}
.user-name {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
}
.user-info-dialog__details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-page);
  border-radius: var(--radius-md);
}
.info-label {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  font-weight: 500;
}
.info-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 500;
}

/* ===== 通知列表 ===== */
.notify-section { margin-bottom: var(--spacing-xl); }
.notify-list { display: flex; flex-direction: column; }
.notify-item {
  display: flex; align-items: center; gap: var(--spacing-lg);
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-color-light);
  cursor: pointer; transition: all var(--transition-fast);
}
.notify-item:last-child { border-bottom: none; }
.notify-item:hover { background: var(--bg-card-hover); margin: 0 calc(-1 * var(--spacing-xl)); padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); border-radius: var(--radius-md); }
.notify-item--unread { background: var(--color-primary-bg-light); }
.notify-item__icon { width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--bg-page); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.notify-item__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.notify-item__title { font-size: var(--font-size-base); font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notify-item--unread .notify-item__title { font-weight: 600; }
.notify-item__time { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.notify-item__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-danger); flex-shrink: 0; }

/* ===== 响应式 ===== */
@media (max-width: 1100px) {
  .content-two-col { grid-template-columns: 1fr; }
  .category-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .function-entrance { grid-template-columns: repeat(2, 1fr); }
  .welcome-banner__date { display: none; }
  .welcome-banner { padding: var(--spacing-xl) var(--spacing-xxl); }
  .welcome-banner__greeting { font-size: var(--font-size-title); }
}
@media (max-width: 768px) {
  .view-content { padding: var(--spacing-md); }
  .overview-cards { grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
  .function-entrance { gap: var(--spacing-md); }
  .category-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--spacing-sm); }
  .welcome-banner { padding: var(--spacing-lg); border-radius: var(--radius-lg); }
  .welcome-banner__greeting { font-size: var(--font-size-xl); }
  .welcome-banner__subtitle { font-size: var(--font-size-xs); }
  .welcome-banner__inner { flex-direction: column; align-items: flex-start; gap: var(--spacing-sm); }
  .result-card { flex-direction: column; }
  .result-card__cover { width: 100%; height: 120px; }
  .result-card__badge { top: 4px; left: 4px; font-size: 9px; padding: 1px 6px; }
  .stat-card__value { font-size: 24px; }
  .stat-card__icon-box { width: 44px; height: 44px; }
  .stat-card__icon-emoji { font-size: 22px; }
  .entrance-item { padding: var(--spacing-lg); }
  .entrance-item__icon { width: 40px; height: 40px; font-size: 20px; }
  .entrance-item__title { font-size: var(--font-size-base); }
  .section-title { font-size: var(--font-size-xl); }
  .module-container { padding: var(--spacing-lg); }
}
@media (max-width: 480px) {
  .view-content { padding: var(--spacing-sm); }
  .overview-cards { grid-template-columns: 1fr; }
  .function-entrance { grid-template-columns: 1fr; }
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .welcome-banner { padding: var(--spacing-md); }
  .welcome-banner__greeting { font-size: var(--font-size-lg); }
}
</style>

<template>
  <PageLayout userType="expert">
    <div class="view-content">
      <!-- 欢迎横幅 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <div>
            <h1 class="page-hero__title">{{ greeting }}，<span class="page-hero__name">{{ username }}</span> 👋</h1>
            <p class="page-hero__subtitle">评审专家工作台 — 专业评审，助力成果孵化</p>
          </div>
          <div class="page-hero__date">
            <span class="page-hero__day">{{ currentDay }}</span>
            <span class="page-hero__weekday">{{ currentWeekday }}</span>
          </div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="overview-cards">
        <div class="stat-card stat-card--orange">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box"><span>📋</span></div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ pendingCount }}</div>
              <div class="stat-card__label">待评审任务</div>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card--blue">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box"><span>✅</span></div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ totalReviews }}</div>
              <div class="stat-card__label">累计评审数</div>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card--green">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box"><span>📊</span></div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ avgScore }}</div>
              <div class="stat-card__label">平均评分</div>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card--purple">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box"><span>🏅</span></div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ excellentCount }}</div>
              <div class="stat-card__label">优秀评审</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 双栏：待办 + 近期评审 -->
      <div class="content-two-col">
        <!-- 待评审列表 -->
        <div class="module-container">
          <div class="module-header">
            <h2>📋 待评审任务</h2>
            <span class="more" @click="$router.push('/成果评审')">查看全部 →</span>
          </div>
          <div v-if="pendingTasks.length > 0" class="task-list">
            <div class="task-card" v-for="item in pendingTasks" :key="item.id" @click="$router.push(`/成果详情/${item.id}`)">
              <div class="task-card__title">{{ item.title }}</div>
              <div class="task-card__meta">
                <span>📂 {{ item.type }}</span>
                <span>👤 {{ item.studentName || '未知' }}</span>
                <span>📅 {{ formatDate(item.createTime) }}</span>
              </div>
              <div class="task-card__action">
                <span class="task-card__score" v-if="item.score">评分 {{ item.score }}</span>
                <button class="btn-review" @click.stop="goReview(item)">去评审 →</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-inline">
            <span>🎉</span> 暂无待评审任务
          </div>
        </div>

        <!-- 近期评审记录 -->
        <div class="module-container">
          <div class="module-header">
            <h2>📝 近期评审</h2>
            <span class="more" @click="$router.push('/评审历史')">全部记录 →</span>
          </div>
          <div v-if="recentReviews.length > 0" class="task-list">
            <div class="task-card" v-for="item in recentReviews" :key="item.id">
              <div class="task-card__title">{{ item.achievementTitle }}</div>
              <div class="task-card__meta">
                <span>⭐ {{ item.score }}分</span>
                <span :class="'conclusion-tag tag--' + item.conclusion">{{ conclusionText(item.conclusion) }}</span>
                <span>📅 {{ formatDate(item.review_time) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-inline">
            <span>📭</span> 暂无评审记录
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const username = ref(localStorage.getItem('username') || '专家')
const pendingCount = ref(0)
const totalReviews = ref(0)
const avgScore = ref(0)
const excellentCount = ref(0)
const pendingTasks = ref([])
const recentReviews = ref([])

const conclusionText = (c) => ({ excellent:'优秀', good:'良好', pass:'合格', fail:'不合格' }[c] || c)
const greeting = computed(() => { const h = new Date().getHours(); if (h < 6) return '夜深了'; if (h < 9) return '早上好'; if (h < 12) return '上午好'; if (h < 14) return '中午好'; if (h < 18) return '下午好'; return '晚上好' })
const currentDay = computed(() => { const n = new Date(); return `${n.getFullYear()}年${n.getMonth()+1}月${n.getDate()}日` })
const currentWeekday = computed(() => ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][new Date().getDay()])
const formatDate = (d) => { if(!d) return ''; const t = new Date(d); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}` }
const expertId = computed(() => {
  const id = localStorage.getItem('expertId')
  if (!id) router.push('/login/expert')
  return id || ''
})

const goReview = (item) => { router.push('/成果评审') }

const loadData = async () => {
  try {
    const eid = localStorage.getItem('expertId')
    if (!eid) return
    const [tasksRes, countRes, statsRes, reviewsRes] = await Promise.all([
      request.get('/api/expert/tasks'),
      request.get('/api/expert/tasks/count'),
      request.get(`/api/expert/statistics/${eid}`),
      request.get(`/api/expert/reviews/${eid}`)
    ])
    if (tasksRes.data) pendingTasks.value = (tasksRes.data || []).slice(0, 5)
    if (countRes.data !== undefined) pendingCount.value = countRes.data
    if (statsRes.data) {
      const s = statsRes.data; totalReviews.value = s.totalReviews || 0
      avgScore.value = (s.avgScore && !isNaN(s.avgScore)) ? Number(s.avgScore).toFixed(1) : '0'
      excellentCount.value = s.excellentCount || 0
    }
    if (reviewsRes.data) recentReviews.value = (reviewsRes.data || []).slice(0, 5)
  } catch (e) { console.error('加载数据失败:', e) }
}

onMounted(() => loadData())
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); border-radius: var(--radius-xl); padding: var(--spacing-xxl) var(--spacing-xxxl); margin-bottom: var(--spacing-xl); color: var(--text-inverse); box-shadow: var(--shadow-lg); }
.page-hero__inner { display: flex; justify-content: space-between; align-items: center; }
.page-hero__title { font-size: var(--font-size-h1); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
.page-hero__name { color: #FFE082; }
.page-hero__subtitle { font-size: var(--font-size-base); opacity: 0.85; margin: 0; }
.page-hero__date { text-align: right; flex-shrink: 0; margin-left: var(--spacing-xl); }
.page-hero__day { display: block; font-size: var(--font-size-lg); opacity: 0.9; }
.page-hero__weekday { display: block; font-size: var(--font-size-title); font-weight: 700; }
.overview-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-xxl); }
.stat-card { background: var(--bg-card); border-radius: var(--radius-xl); padding: var(--spacing-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); transition: all var(--transition-base); }
.stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.stat-card__inner { display: flex; align-items: center; gap: var(--spacing-lg); }
.stat-card__icon-box { width: 56px; height: 56px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 28px; }
.stat-card--orange .stat-card__icon-box { background: var(--color-warning-bg); }
.stat-card--blue .stat-card__icon-box { background: var(--color-primary-bg); }
.stat-card--green .stat-card__icon-box { background: var(--color-success-bg); }
.stat-card--purple .stat-card__icon-box { background: #F3F0FF; }
.stat-card__value { font-size: 30px; font-weight: 700; color: var(--text-primary); }
.stat-card__label { font-size: var(--font-size-sm); color: var(--text-tertiary); }
.content-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); }
.module-container { background: var(--bg-card); border-radius: var(--radius-xl); padding: var(--spacing-xl); box-shadow: var(--shadow-card); border: 1px solid var(--border-color); }
.module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); padding-bottom: var(--spacing-md); border-bottom: 2px solid var(--border-color-light); }
.module-header h2 { font-size: var(--font-size-xxl); font-weight: 700; margin: 0; }
.more { font-size: var(--font-size-sm); color: var(--color-primary); cursor: pointer; }
.more:hover { color: var(--color-primary-dark); }
.task-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.task-card { padding: var(--spacing-lg); border-radius: var(--radius-lg); border: 1px solid var(--border-color); cursor: pointer; transition: all var(--transition-base); }
.task-card:hover { border-color: var(--color-primary-light); box-shadow: var(--shadow-md); transform: translateX(4px); }
.task-card__title { font-size: var(--font-size-lg); font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-sm); }
.task-card__meta { display: flex; gap: var(--spacing-lg); font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--spacing-sm); }
.task-card__action { display: flex; justify-content: space-between; align-items: center; }
.task-card__score { font-size: var(--font-size-sm); color: var(--color-primary); font-weight: 600; }
.btn-review { padding: 6px 16px; border: none; border-radius: var(--radius-md); background: var(--gradient-primary); color: #fff; font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-base); }
.btn-review:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(43,90,237,0.4); }
.conclusion-tag { padding: 1px 8px; border-radius: var(--radius-round); font-size: 11px; font-weight: 600; }
.tag--excellent { background: #F0FBE6; color: var(--color-success); }
.tag--good { background: var(--color-primary-bg); color: var(--color-primary); }
.tag--pass { background: var(--color-warning-bg); color: var(--color-warning); }
.tag--fail { background: var(--color-danger-bg); color: var(--color-danger); }
.empty-inline { text-align: center; padding: var(--spacing-xxl); color: var(--text-tertiary); font-size: var(--font-size-base); }

@media (max-width: 1100px) { .content-two-col { grid-template-columns: 1fr; } .overview-cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .page-hero { padding: var(--spacing-xl); } .page-hero__date { display: none; } .overview-cards { grid-template-columns: repeat(2, 1fr); } }
</style>

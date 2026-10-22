<template>
  <PageLayout userType="expert">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">评审历史</h1>
          <p class="page-hero__subtitle">查看已完成评审记录，依托数据优化评审标准</p>
        </div>
      </div>

      <!-- 复盘统计 -->
      <div class="stats-row" v-if="reviews.length > 0">
        <div class="mini-stat"><span class="mini-stat__num">{{ reviews.length }}</span><span class="mini-stat__lbl">总评审数</span></div>
        <div class="mini-stat mini-stat--blue"><span class="mini-stat__num">{{ avgScore }}</span><span class="mini-stat__lbl">平均分</span></div>
        <div class="mini-stat mini-stat--green"><span class="mini-stat__num">{{ rate.excellent || 0 }}%</span><span class="mini-stat__lbl">优秀率</span></div>
        <div class="mini-stat mini-stat--orange"><span class="mini-stat__num">{{ rate.good || 0 }}%</span><span class="mini-stat__lbl">良好率</span></div>
      </div>

      <!-- 筛选 -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button v-for="opt in conclusionOpts" :key="opt.val" :class="['ftab', { active: filterConclusion === opt.val }]" @click="filterConclusion = opt.val">{{ opt.label }}</button>
        </div>
      </div>

      <!-- 列表 -->
      <div v-if="filteredReviews.length > 0" class="review-list">
        <div class="history-card" v-for="item in filteredReviews" :key="item.id">
          <div class="history-card__header">
            <h3>{{ item.achievementTitle }}</h3>
            <span class="conclusion-tag" :class="'ctag--' + item.conclusion">{{ conclusionMap[item.conclusion] || item.conclusion }}</span>
          </div>
          <div class="history-card__info">
            <span>📂 {{ item.achievementType || '未知' }}</span>
            <span>⭐ {{ item.score }} 分</span>
            <span>📅 {{ formatDate(item.review_time) }}</span>
          </div>
          <div class="history-card__comment" v-if="item.comment">
            <span class="c-label">评语：</span>{{ item.comment }}
          </div>
          <div class="history-card__dims" v-if="item.dimension_scores">
            <span v-for="(d, i) in parseDims(item.dimension_scores)" :key="i" class="dim-chip">{{ d.name }}: {{ d.score }}</span>
          </div>
        </div>
      </div>
      <div v-else class="state-box"><span>📊</span><p>暂无评审记录</p></div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const reviews = ref([])
const filterConclusion = ref('')
const conclusionOpts = [
  { val: '', label: '全部' }, { val: 'excellent', label: '优秀' },
  { val: 'good', label: '良好' }, { val: 'pass', label: '合格' }, { val: 'fail', label: '不合格' }
]
const conclusionMap = { excellent: '优秀', good: '良好', pass: '合格', fail: '不合格' }

const filteredReviews = computed(() => {
  if (!filterConclusion.value) return reviews.value
  return reviews.value.filter(r => r.conclusion === filterConclusion.value)
})
const avgScore = computed(() => {
  if (!reviews.value.length) return 0
  return (reviews.value.reduce((s, r) => s + r.score, 0) / reviews.value.length).toFixed(1)
})
const rate = computed(() => {
  const t = reviews.value.length || 1
  return {
    excellent: Math.round(reviews.value.filter(r => r.conclusion === 'excellent').length / t * 100),
    good: Math.round(reviews.value.filter(r => r.conclusion === 'good').length / t * 100)
  }
})

const formatDate = (d) => { if(!d) return ''; const t = new Date(d); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}` }
const parseDims = (str) => { try { return JSON.parse(str) } catch { return [] } }

const loadReviews = async () => {
  try {
    const expertId = localStorage.getItem('expertId') || 1
    const res = await request.get(`/api/expert/reviews/${expertId}`)
    if (res.data) reviews.value = res.data || []
  } catch (e) { console.error(e) }
}

onMounted(() => loadReviews())
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); border-radius: var(--radius-xl); padding: var(--spacing-xl) var(--spacing-xxl); margin-bottom: var(--spacing-lg); color: var(--text-inverse); box-shadow: var(--shadow-md); }
.page-hero__title { font-size: var(--font-size-title); font-weight: 700; margin: 0 0 2px 0; }
.page-hero__subtitle { font-size: var(--font-size-sm); opacity: 0.8; margin: 0; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
.mini-stat { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--spacing-lg); text-align: center; border: 1px solid var(--border-color); box-shadow: var(--shadow-card); }
.mini-stat--blue { border-top: 3px solid var(--color-primary); }
.mini-stat--green { border-top: 3px solid var(--color-success); }
.mini-stat--orange { border-top: 3px solid var(--color-warning); }
.mini-stat__num { display: block; font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.mini-stat__lbl { display: block; font-size: var(--font-size-xs); color: var(--text-tertiary); }

.filter-bar { display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
.filter-tabs { display: flex; gap: 4px; background: var(--bg-page); border-radius: var(--radius-md); padding: 4px; }
.ftab { padding: 6px 16px; border: none; border-radius: var(--radius-sm); background: transparent; font-size: var(--font-size-sm); color: var(--text-tertiary); cursor: pointer; transition: all var(--transition-fast); font-weight: 500; }
.ftab:hover { color: var(--text-primary); }
.ftab.active { background: var(--bg-card); color: var(--color-primary); font-weight: 600; box-shadow: var(--shadow-sm); }

.review-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.history-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--spacing-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); transition: all var(--transition-base); }
.history-card:hover { box-shadow: var(--shadow-md); }
.history-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-md); margin-bottom: var(--spacing-sm); }
.history-card__header h3 { font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); margin: 0; }
.conclusion-tag { padding: 3px 10px; border-radius: var(--radius-round); font-size: 11px; font-weight: 600; white-space: nowrap; }
.ctag--excellent { background: #F0FBE6; color: var(--color-success); }
.ctag--good { background: var(--color-primary-bg); color: var(--color-primary); }
.ctag--pass { background: var(--color-warning-bg); color: var(--color-warning); }
.ctag--fail { background: var(--color-danger-bg); color: var(--color-danger); }
.history-card__info { display: flex; flex-wrap: wrap; gap: var(--spacing-lg); font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--spacing-sm); }
.history-card__comment { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-sm); line-height: 1.5; background: var(--bg-page); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-sm); }
.c-label { font-weight: 600; color: var(--text-primary); }
.history-card__dims { display: flex; flex-wrap: wrap; gap: var(--spacing-xs); }
.dim-chip { display: inline-block; padding: 2px 8px; border-radius: var(--radius-round); font-size: 11px; background: var(--border-color-light); color: var(--text-secondary); }

.state-box { text-align: center; padding: var(--spacing-xxxl) var(--spacing-xl); background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); }
.state-box span { font-size: 48px; display: block; margin-bottom: var(--spacing-md); }
.state-box p { color: var(--text-tertiary); font-size: var(--font-size-base); }

@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .history-card__info { flex-direction: column; gap: var(--spacing-xs); }
}
</style>

<template>
  <PageLayout :userType="userType">
    <div class="viz-page">
      <!-- 页头 -->
      <div class="viz-header">
        <div>
          <h2 class="viz-header__title">数据可视化</h2>
          <p class="viz-header__subtitle">
            {{ scopeText }} · 数据更新于 {{ updatedAt }}
          </p>
        </div>
        <div class="viz-header__actions">
          <el-radio-group
            v-if="userType === 'student'"
            v-model="scopeMode"
            class="scope-switch"
            :disabled="loading"
            @change="load"
          >
            <el-radio-button value="global">全平台</el-radio-button>
            <el-radio-button value="personal">我的数据</el-radio-button>
          </el-radio-group>
          <el-tag :type="scope === 'personal' ? 'success' : 'primary'" effect="light" round>
            {{ scope === 'personal' ? '个人数据' : '全量数据' }}
          </el-tag>
          <el-button type="primary" plain @click="goScreen">
            <span class="btn-emoji">🖥️</span> 数据大屏
          </el-button>
          <el-button :loading="loading" @click="load">
            <span class="btn-emoji">🔄</span> 刷新
          </el-button>
        </div>
      </div>

      <!-- KPI -->
      <div class="kpi-grid">
        <StatCard
          v-for="card in kpiCards"
          :key="card.label"
          :label="card.label"
          :value="card.value"
          :icon="card.icon"
          :variant="card.variant"
        />
      </div>

      <!-- 关键比率 -->
      <div class="insight-row">
        <div v-for="item in insights" :key="item.label" class="insight-card">
          <div class="insight-card__top">
            <span>{{ item.label }}</span>
            <b>{{ item.percent }}%</b>
          </div>
          <div class="insight-card__bar">
            <i :style="{ width: Math.max(item.percent, 2) + '%', background: item.color }" />
          </div>
          <div class="insight-card__sub">{{ item.detail }}</div>
        </div>
      </div>

      <!-- 图表 -->
      <div v-loading="loading && !loaded" class="chart-grid">
        <div
          v-for="(card, index) in chartCards"
          :key="card.title"
          class="content-card chart-card"
          :class="{ 'chart-card--wide': card.wide }"
          :style="{ '--accent': PALETTE[index % PALETTE.length] }"
        >
          <div class="chart-card__head">
            <h3 class="chart-card__title">
              <span class="chart-card__icon">{{ card.icon }}</span>{{ card.title }}
            </h3>
            <span class="chart-card__meta">{{ card.meta }}</span>
          </div>
          <BaseChart :option="card.option" :height="card.height || '280px'" />
        </div>
      </div>

      <p class="viz-footnote">
        图表数据实时来自数据库聚合统计（成果 / 获奖 / 资源 / 申请），随业务数据变化自动更新。
      </p>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageLayout from '../components/PageLayout.vue'
import StatCard from '../components/charts/StatCard.vue'
import BaseChart from '../components/charts/BaseChart.vue'
import { getVisualizationDashboard } from '../api/visualization'
import { pieOption, barOption, lineOption, funnelOption, PALETTE } from '../utils/chartOptions'

const router = useRouter()

const userType = ref(localStorage.getItem('userType') || 'student')
const scopeMode = ref('global')
const scope = ref('global')
const data = ref(null)
const loading = ref(false)
const loaded = ref(false)
const updatedAt = ref('—')

const idKeyMap = { student: 'studentId', teacher: 'teacherId', admin: 'adminId', expert: 'expertId', enterprise: 'enterpriseId' }
const currentUserId = () => Number(localStorage.getItem(idKeyMap[userType.value] || '')) || 0

const scopeText = computed(() =>
  scope.value === 'personal' ? '仅统计你本人上传的成果、获奖与申请' : '统计平台全部成果、获奖与资源数据'
)

const load = async () => {
  loading.value = true
  try {
    const res = await getVisualizationDashboard({
      userType: userType.value,
      userId: currentUserId(),
      scope: userType.value === 'student' ? scopeMode.value : 'global'
    })
    if (res.code === 200) {
      data.value = res.data
      scope.value = res.data.scope
      updatedAt.value = new Date(res.data.generatedAt).toLocaleString('zh-CN', { hour12: false })
      loaded.value = true
    } else {
      ElMessage.error(res.msg || '获取可视化数据失败')
    }
  } catch (e) {
    ElMessage.error(e?.msg || '获取可视化数据失败')
  } finally {
    loading.value = false
  }
}

const EMPTY_DASHBOARD = {
  achievement: {
    typeDist: [], collegeDist: [], reviewStatusDist: [], incubationStatusDist: [], scoreDist: [],
    monthly: { labels: [], values: [] }
  },
  award: { levelDist: [], yearly: { labels: [], values: [] }, orgDist: [] },
  resource: { typeDist: [], statusDist: [], topApplied: [], totalViews: 0, totalApplies: 0 },
  application: { statusDist: [], monthly: { labels: [], values: [] } }
}

const k = computed(() => data.value?.kpis || {})

const kpiCards = computed(() => {
  const v = k.value
  if (scope.value === 'personal') {
    return [
      { label: '我的成果', value: v.achievementCount, icon: '📄', variant: 'blue' },
      { label: '我的获奖', value: v.awardCount, icon: '🏆', variant: 'orange' },
      { label: '我的申请', value: v.applicationCount, icon: '📝', variant: 'green' },
      { label: '成果浏览量', value: v.viewTotal, icon: '👁️', variant: 'blue' },
      { label: '获得点赞', value: v.likeCount, icon: '👍', variant: 'orange' },
      { label: '收到评论', value: v.commentCount, icon: '💬', variant: 'purple' }
    ]
  }
  if (userType.value === 'student' || userType.value === 'teacher') {
    return [
      { label: '成果总数', value: v.achievementCount, icon: '📄', variant: 'blue' },
      { label: '学生总数', value: v.studentCount, icon: '👨‍🎓', variant: 'green' },
      { label: '获奖总数', value: v.awardCount, icon: '🏆', variant: 'orange' },
      { label: '待评审', value: v.reviewPending, icon: '⏳', variant: 'orange' },
      { label: '孵化中', value: v.incubationOngoing, icon: '🚀', variant: 'purple' },
      { label: '已落地', value: v.incubationDone, icon: '✅', variant: 'green' }
    ]
  }
  return [
    { label: '学生总数', value: v.studentCount, icon: '👨‍🎓', variant: 'blue' },
    { label: '教师总数', value: v.teacherCount, icon: '👩‍🏫', variant: 'green' },
    { label: '成果总数', value: v.achievementCount, icon: '📄', variant: 'blue' },
    { label: '获奖总数', value: v.awardCount, icon: '🏆', variant: 'orange' },
    { label: '资源总数', value: v.resourceCount, icon: '📦', variant: 'purple' },
    { label: '企业总数', value: v.enterpriseCount, icon: '🏢', variant: 'green' },
    { label: '专家总数', value: v.expertCount, icon: '🔬', variant: 'purple' },
    { label: '累计浏览', value: v.viewTotal, icon: '👁️', variant: 'blue' }
  ]
})

const insights = computed(() => {
  const d = data.value
  if (!d) return []
  const sum = (rows) => (rows || []).reduce((s, x) => s + Number(x.value || 0), 0)
  const pick = (rows, name) => Number(((rows || []).find((x) => x.name === name) || {}).value || 0)
  const reviewTotal = sum(d.achievement.reviewStatusDist)
  const reviewPass = pick(d.achievement.reviewStatusDist, '已通过')
  const incTotal = sum(d.achievement.incubationStatusDist)
  const incDone = pick(d.achievement.incubationStatusDist, '已完成')
  const appTotal = sum(d.application.statusDist)
  const appPass = pick(d.application.statusDist, '已通过')
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
  return [
    { label: '成果评审通过率', percent: pct(reviewPass, reviewTotal), detail: `${reviewPass} / ${reviewTotal} 项`, color: 'linear-gradient(90deg,#3B82F6,#60A5FA)' },
    { label: '孵化完成率', percent: pct(incDone, incTotal), detail: `${incDone} / ${incTotal} 项`, color: 'linear-gradient(90deg,#10B981,#34D399)' },
    { label: '资源申请通过率', percent: pct(appPass, appTotal), detail: `${appPass} / ${appTotal} 条`, color: 'linear-gradient(90deg,#F59E0B,#FBBF24)' }
  ]
})

const chartCards = computed(() => {
  // 即使接口尚未返回或某个维度为空，也渲染完整图表占位，避免出现大片“暂无数据”
  const d = data.value || EMPTY_DASHBOARD
  const a = d.achievement
  const aw = d.award
  const r = d.resource
  const ap = d.application
  const nonZero = (rows) => (rows || []).some((x) => Number(x.value) > 0)

  return [
    {
      title: '成果类型分布', icon: '🍩',
      hasData: a.typeDist.length > 0,
      meta: `共 ${a.typeDist.reduce((s, x) => s + Number(x.value), 0)} 项`,
      option: pieOption(a.typeDist)
    },
    {
      title: '学院成果分布', icon: '🏫',
      hasData: a.collegeDist.length > 0,
      meta: `${a.collegeDist.length} 个学院`,
      option: barOption({
        categories: a.collegeDist.map((x) => x.name),
        values: a.collegeDist.map((x) => x.value),
        colorful: true,
        unit: '项'
      })
    },
    {
      title: '成果评审状态', icon: '✅',
      hasData: nonZero(a.reviewStatusDist),
      meta: '审核进度',
      option: pieOption(a.reviewStatusDist, { unit: '项' })
    },
    {
      title: '成果孵化状态', icon: '🚀',
      hasData: nonZero(a.incubationStatusDist),
      meta: '孵化漏斗',
      option: funnelOption(a.incubationStatusDist)
    },
    {
      title: '成果评分分布', icon: '⭐',
      hasData: nonZero(a.scoreDist),
      meta: '教师评分',
      option: barOption({
        categories: a.scoreDist.map((x) => x.name),
        values: a.scoreDist.map((x) => x.value),
        colorful: true,
        unit: '项'
      })
    },
    {
      title: '成果上传趋势', icon: '📈',
      hasData: a.monthly.values.some((v) => v > 0),
      meta: '近 12 个月',
      wide: true,
      option: lineOption({ labels: a.monthly.labels, values: a.monthly.values, unit: '项' })
    },
    {
      title: '获奖等级分布', icon: '🏆',
      hasData: aw.levelDist.length > 0,
      meta: `共 ${aw.levelDist.reduce((s, x) => s + Number(x.value), 0)} 项`,
      option: pieOption(aw.levelDist, { rose: true, unit: '项' })
    },
    {
      title: '获奖年度趋势', icon: '📅',
      hasData: aw.yearly.values.length > 0,
      meta: `${aw.yearly.labels.length} 个年度`,
      option: barOption({ categories: aw.yearly.labels, values: aw.yearly.values, color: '#FAAD14', unit: '项' })
    },
    {
      title: '资源类型分布', icon: '📦',
      hasData: nonZero(r.typeDist),
      meta: `共 ${r.typeDist.reduce((s, x) => s + Number(x.value), 0)} 项`,
      option: pieOption(r.typeDist, { unit: '项' })
    },
    {
      title: '资源申请状态', icon: '📬',
      hasData: nonZero(ap.statusDist),
      meta: `共 ${ap.statusDist.reduce((s, x) => s + Number(x.value), 0)} 条`,
      option: pieOption(ap.statusDist, { unit: '条' })
    },
    {
      title: '资源申请趋势', icon: '📉',
      hasData: ap.monthly.values.some((v) => v > 0),
      meta: '近 12 个月',
      option: lineOption({ labels: ap.monthly.labels, values: ap.monthly.values, color: '#36CFC9', unit: '条' })
    },
    {
      title: '热门资源 Top', icon: '🔥',
      hasData: r.topApplied.length > 0,
      meta: '按申请量排序',
      option: barOption({
        categories: r.topApplied.map((x) => x.title),
        values: r.topApplied.map((x) => x.applyCount),
        horizontal: true,
        color: '#9254DE',
        unit: '次申请'
      })
    }
  ]
})

const goScreen = () => router.push('/数据大屏')

onMounted(load)
</script>

<style scoped>
.viz-page {
  max-width: var(--content-max-width-wide, 1400px);
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* 页头 */
.viz-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xl);
}
.viz-header__title {
  font-size: var(--font-size-title, 24px);
  margin-bottom: 4px;
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--color-primary-dark);
  display: inline-block;
}
.viz-header__subtitle {
  font-size: var(--font-size-sm, 13px);
  color: var(--text-tertiary);
}
.viz-header__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}
.btn-emoji {
  margin-right: 4px;
}
.scope-switch :deep(.el-radio-button__inner) {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--glass-bg);
  border-color: var(--border-color);
  box-shadow: none;
}
.scope-switch :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  color: #fff;
  background: var(--gradient-primary);
  border-color: transparent;
  box-shadow: 0 6px 16px rgba(43, 90, 237, 0.28);
}

/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}
@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* 关键比率 */
.insight-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}
@media (max-width: 900px) {
  .insight-row { grid-template-columns: 1fr; }
}
.insight-card {
  padding: 14px 18px;
  border-radius: var(--radius-lg, 16px);
  background: var(--glass-bg, rgba(255, 255, 255, 0.7));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.8));
  box-shadow: var(--shadow-card, 0 6px 20px rgba(43, 90, 237, 0.08));
}
.insight-card__top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  color: var(--text-secondary);
}
.insight-card__top b {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.insight-card__bar {
  height: 7px;
  margin: 8px 0 6px;
  border-radius: 999px;
  background: #eef1f8;
  overflow: hidden;
}
.insight-card__bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.8s ease;
}
.insight-card__sub {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 图表栅格 */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-lg);
  min-height: 200px;
}
@media (max-width: 1200px) {
  .chart-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .chart-grid { grid-template-columns: 1fr; }
}
.chart-card {
  position: relative;
  padding: var(--spacing-lg);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent, transparent);
  opacity: 0.9;
}
.chart-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md, 0 16px 36px rgba(43, 90, 237, 0.14));
}
.chart-card--wide {
  grid-column: span 2;
}
@media (max-width: 900px) {
  .chart-card--wide {
    grid-column: span 1;
  }
}
.chart-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border-color, #eef0f4);
}
.chart-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-lg, 16px);
  font-weight: 600;
  color: var(--text-primary);
}
.chart-card__icon {
  font-size: 17px;
}
.chart-card__meta {
  padding: 2px 8px;
  font-size: 12px;
  color: var(--text-tertiary);
  background: #f5f7fb;
  border-radius: 999px;
}

.viz-footnote {
  margin-top: var(--spacing-xl);
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>

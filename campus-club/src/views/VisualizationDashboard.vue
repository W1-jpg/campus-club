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

      <!-- 图表 -->
      <div v-loading="loading && !loaded" class="chart-grid">
        <div
          v-for="card in chartCards"
          :key="card.title"
          class="content-card chart-card"
          :class="{ 'chart-card--wide': card.wide }"
        >
          <div class="chart-card__head">
            <h3 class="chart-card__title">
              <span class="chart-card__icon">{{ card.icon }}</span>{{ card.title }}
            </h3>
            <span class="chart-card__meta">{{ card.meta }}</span>
          </div>
          <BaseChart v-if="card.hasData" :option="card.option" :height="card.height || '260px'" />
          <el-empty v-else description="暂无数据" :image-size="70" />
        </div>
      </div>

      <p class="viz-footnote">
        图表数据均来自数据库真实统计（成果 / 获奖 / 资源 / 申请），未使用任何模拟数据。
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
import { pieOption, barOption, lineOption, funnelOption } from '../utils/chartOptions'

const router = useRouter()

const userType = ref(localStorage.getItem('userType') || 'student')
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
      userId: currentUserId()
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

const k = computed(() => data.value?.kpis || {})

const kpiCards = computed(() => {
  const v = k.value
  if (userType.value === 'student') {
    return [
      { label: '我的成果', value: v.achievementCount, icon: '📄', variant: 'blue' },
      { label: '我的获奖', value: v.awardCount, icon: '🏆', variant: 'orange' },
      { label: '我的申请', value: v.applicationCount, icon: '📝', variant: 'green' },
      { label: '成果浏览量', value: v.viewTotal, icon: '👁️', variant: 'blue' },
      { label: '获得点赞', value: v.likeCount, icon: '👍', variant: 'orange' },
      { label: '收到评论', value: v.commentCount, icon: '💬', variant: 'purple' }
    ]
  }
  if (userType.value === 'teacher') {
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

const chartCards = computed(() => {
  const d = data.value
  if (!d) return []
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

/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

/* 图表栅格 */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: var(--spacing-lg);
  min-height: 200px;
}
.chart-card {
  padding: var(--spacing-lg);
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
  font-size: 12px;
  color: var(--text-tertiary);
}

.viz-footnote {
  margin-top: var(--spacing-xl);
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>

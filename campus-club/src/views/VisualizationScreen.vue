<template>
  <div class="screen-viewport">
    <div class="screen-canvas" :style="canvasStyle">
      <!-- 顶部 -->
      <header class="screen-header">
        <div class="screen-header__side">
          <span class="screen-header__dot"></span>
          <span>校园社团成果展示与孵化平台</span>
        </div>
        <h1 class="screen-header__title">数据可视化大屏</h1>
        <div class="screen-header__side screen-header__side--right">
          <span class="screen-header__clock">{{ clockText }}</span>
          <button class="screen-header__btn" @click="toggleFullscreen">
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </button>
          <button class="screen-header__btn" @click="exit">返回</button>
        </div>
      </header>

      <!-- 主体三栏 -->
      <main class="screen-body">
        <!-- 左栏 -->
        <section class="screen-col">
          <div class="screen-panel">
            <h3 class="screen-panel__title">成果类型分布</h3>
            <BaseChart :option="opts.type" height="240px" />
          </div>
          <div class="screen-panel">
            <h3 class="screen-panel__title">学院成果分布</h3>
            <BaseChart :option="opts.college" height="240px" />
          </div>
          <div class="screen-panel">
            <h3 class="screen-panel__title">资源类型分布</h3>
            <BaseChart :option="opts.resType" height="220px" />
          </div>
        </section>

        <!-- 中栏 -->
        <section class="screen-col screen-col--center">
          <div class="screen-kpis">
            <div v-for="card in kpiCards" :key="card.label" class="screen-kpi">
              <div class="screen-kpi__value">{{ card.value }}</div>
              <div class="screen-kpi__label">{{ card.label }}</div>
            </div>
          </div>
          <div class="screen-panel screen-panel--grow">
            <h3 class="screen-panel__title">成果上传趋势（近 12 个月）</h3>
            <BaseChart :option="opts.monthly" height="300px" />
          </div>
          <div class="screen-split">
            <div class="screen-panel">
              <h3 class="screen-panel__title">评审状态</h3>
              <BaseChart :option="opts.review" height="220px" />
            </div>
            <div class="screen-panel">
              <h3 class="screen-panel__title">孵化状态</h3>
              <BaseChart :option="opts.incubation" height="220px" />
            </div>
          </div>
        </section>

        <!-- 右栏 -->
        <section class="screen-col">
          <div class="screen-panel">
            <h3 class="screen-panel__title">获奖等级分布</h3>
            <BaseChart :option="opts.awardLevel" height="240px" />
          </div>
          <div class="screen-panel">
            <h3 class="screen-panel__title">资源申请状态</h3>
            <BaseChart :option="opts.appStatus" height="220px" />
          </div>
          <div class="screen-panel">
            <h3 class="screen-panel__title">热门资源 Top</h3>
            <BaseChart :option="opts.topApplied" height="240px" />
          </div>
        </section>
      </main>

      <footer class="screen-footer">
        <span>{{ scopeText }}</span>
        <span>数据来源：数据库真实统计 · 更新于 {{ updatedAt }} · 每 30 秒自动刷新</span>
      </footer>
    </div>

    <div v-if="loading && !loaded" class="screen-loading">数据加载中…</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import BaseChart from '../components/charts/BaseChart.vue'
import { getVisualizationDashboard } from '../api/visualization'
import { pieOption, barOption, lineOption, funnelOption } from '../utils/chartOptions'

const BASE_W = 1920
const BASE_H = 1080
const REFRESH_MS = 30000

const router = useRouter()
const userType = ref(localStorage.getItem('userType') || 'student')
const data = ref(null)
const loading = ref(false)
const loaded = ref(false)
const updatedAt = ref('—')
const clockText = ref('')
const isFullscreen = ref(false)

const scale = ref(1)
let clockTimer = null
let refreshTimer = null

const canvasStyle = computed(() => ({
  width: `${BASE_W}px`,
  height: `${BASE_H}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`
}))

const idKeyMap = { student: 'studentId', teacher: 'teacherId', admin: 'adminId' }
const currentUserId = () => Number(localStorage.getItem(idKeyMap[userType.value] || '')) || 0

const scopeText = computed(() =>
  data.value?.scope === 'personal' ? '个人成果数据视图' : '平台全量数据视图'
)

const updateScale = () => {
  scale.value = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)
}

const updateClock = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  clockText.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} 星期${week} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const load = async () => {
  loading.value = true
  try {
    const res = await getVisualizationDashboard({ userType: userType.value, userId: currentUserId() })
    if (res.code === 200) {
      data.value = res.data
      updatedAt.value = new Date(res.data.generatedAt).toLocaleTimeString('zh-CN', { hour12: false })
      loaded.value = true
    }
  } catch (e) {
    // 大屏静默失败，保留上一次数据，等待下次轮询
  } finally {
    loading.value = false
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}
const onFsChange = () => {
  isFullscreen.value = !!document.fullscreenElement
  updateScale()
}

const exit = () => router.push('/数据可视化')

const k = computed(() => data.value?.kpis || {})

const kpiCards = computed(() => {
  const v = k.value
  if (data.value?.scope === 'personal') {
    return [
      { label: '我的成果', value: v.achievementCount || 0 },
      { label: '我的获奖', value: v.awardCount || 0 },
      { label: '我的申请', value: v.applicationCount || 0 },
      { label: '成果浏览', value: v.viewTotal || 0 }
    ]
  }
  return [
    { label: '成果总数', value: v.achievementCount || 0 },
    { label: '获奖总数', value: v.awardCount || 0 },
    { label: '资源总数', value: v.resourceCount || 0 },
    { label: '累计浏览', value: v.viewTotal || 0 }
  ]
})

const opts = computed(() => {
  const dark = { dark: true }
  const d = data.value
  if (!d) {
    // 接口尚未返回时同样给出完整图表占位，避免大屏出现空白块
    return {
      has: {},
      type: pieOption([], dark),
      college: barOption({ categories: [], values: [], ...dark }),
      resType: pieOption([], dark),
      monthly: lineOption({ labels: [], values: [], ...dark }),
      review: pieOption([], dark),
      incubation: funnelOption([], dark),
      awardLevel: pieOption([], { ...dark, rose: true }),
      appStatus: pieOption([], dark),
      topApplied: barOption({ categories: [], values: [], horizontal: true, ...dark })
    }
  }
  const a = d.achievement
  const aw = d.award
  const r = d.resource
  const ap = d.application
  const nonZero = (rows) => (rows || []).some((x) => Number(x.value) > 0)

  return {
    has: {
      typeDist: a.typeDist.length > 0,
      collegeDist: a.collegeDist.length > 0,
      resType: nonZero(r.typeDist),
      monthly: a.monthly.values.some((v) => v > 0),
      review: nonZero(a.reviewStatusDist),
      incubation: nonZero(a.incubationStatusDist),
      awardLevel: aw.levelDist.length > 0,
      appStatus: nonZero(ap.statusDist),
      topApplied: r.topApplied.length > 0
    },
    type: pieOption(a.typeDist, { ...dark, unit: '' }),
    college: barOption({
      categories: a.collegeDist.map((x) => x.name),
      values: a.collegeDist.map((x) => x.value),
      colorful: true,
      ...dark
    }),
    resType: pieOption(r.typeDist, dark),
    monthly: lineOption({ labels: a.monthly.labels, values: a.monthly.values, color: '#36CFC9', ...dark }),
    review: pieOption(a.reviewStatusDist, dark),
    incubation: funnelOption(a.incubationStatusDist, dark),
    awardLevel: pieOption(aw.levelDist, { ...dark, rose: true }),
    appStatus: pieOption(ap.statusDist, dark),
    topApplied: barOption({
      categories: r.topApplied.map((x) => x.title),
      values: r.topApplied.map((x) => x.applyCount),
      horizontal: true,
      color: '#9254DE',
      ...dark
    })
  }
})

onMounted(() => {
  updateScale()
  updateClock()
  load()
  window.addEventListener('resize', updateScale)
  document.addEventListener('fullscreenchange', onFsChange)
  clockTimer = setInterval(updateClock, 1000)
  refreshTimer = setInterval(load, REFRESH_MS)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScale)
  document.removeEventListener('fullscreenchange', onFsChange)
  clearInterval(clockTimer)
  clearInterval(refreshTimer)
})
</script>

<style scoped>
/* 深色科技风大屏：以 1920×1080 为基准画布，整体缩放到任意投屏 */
.screen-viewport {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: radial-gradient(circle at 50% 0%, #0d2a52 0%, #071527 45%, #03070f 100%);
  font-family: var(--font-family);
}
.screen-viewport::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(64, 144, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 144, 255, 0.07) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}
.screen-canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  display: flex;
  flex-direction: column;
  padding: 18px 26px 12px;
  color: #d6ecff;
  box-sizing: border-box;
}

/* 顶部 */
.screen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 74px;
  padding: 0 12px;
  border-bottom: 1px solid rgba(80, 160, 255, 0.28);
  background: linear-gradient(180deg, rgba(43, 90, 237, 0.18), transparent);
  position: relative;
}
.screen-header::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -1px;
  width: 320px;
  height: 3px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, #40a9ff, transparent);
}
.screen-header__title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.14em;
  background: linear-gradient(180deg, #ffffff 20%, #6fb8ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 22px rgba(64, 169, 255, 0.35);
}
.screen-header__side {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(180, 215, 255, 0.8);
}
.screen-header__side--right {
  min-width: 430px;
  justify-content: flex-end;
}
.screen-header__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #36cfc9;
  box-shadow: 0 0 10px #36cfc9;
}
.screen-header__clock {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}
.screen-header__btn {
  padding: 4px 12px;
  border: 1px solid rgba(80, 160, 255, 0.5);
  border-radius: 6px;
  background: rgba(43, 90, 237, 0.22);
  color: #bcdcff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.screen-header__btn:hover {
  background: rgba(64, 169, 255, 0.4);
  color: #fff;
}

/* 主体 */
.screen-body {
  flex: 1;
  display: grid;
  grid-template-columns: 430px 1fr 430px;
  gap: 16px;
  padding: 16px 0;
  min-height: 0;
}
.screen-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}
.screen-col--center {
  min-width: 0;
}
.screen-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.screen-panel {
  position: relative;
  padding: 12px 14px 8px;
  border: 1px solid rgba(64, 144, 255, 0.22);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(19, 46, 88, 0.65), rgba(8, 22, 44, 0.5));
  box-shadow: inset 0 0 24px rgba(43, 90, 237, 0.14);
}
.screen-panel::before,
.screen-panel::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: #40a9ff;
  border-style: solid;
}
.screen-panel::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}
.screen-panel::after {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}
.screen-panel__title {
  font-size: 15px;
  font-weight: 600;
  color: #cfe6ff;
  padding-left: 10px;
  margin-bottom: 4px;
  position: relative;
}
.screen-panel__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #40a9ff, #2b5aed);
}

/* 中栏 KPI */
.screen-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.screen-kpi {
  text-align: center;
  padding: 12px 6px;
  border: 1px solid rgba(64, 144, 255, 0.28);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(43, 90, 237, 0.28), rgba(8, 22, 44, 0.4));
}
.screen-kpi__value {
  font-size: 38px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(180deg, #ffffff, #57b0ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 18px rgba(87, 176, 255, 0.4);
}
.screen-kpi__label {
  margin-top: 4px;
  font-size: 13px;
  color: rgba(180, 215, 255, 0.78);
}
.screen-panel--grow {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.screen-empty {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(150, 200, 255, 0.5);
  font-size: 13px;
}

/* 底部 */
.screen-footer {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px 0;
  border-top: 1px solid rgba(80, 160, 255, 0.2);
  font-size: 12px;
  color: rgba(160, 200, 255, 0.6);
}
.screen-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  letter-spacing: 0.1em;
  color: #7ec1ff;
  background: rgba(3, 7, 15, 0.7);
  z-index: 5;
}
</style>

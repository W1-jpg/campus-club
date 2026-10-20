<template>
  <div class="base-chart">
    <div v-if="loading" class="base-chart__loading">
      <span class="base-chart__spinner"></span>
      <span>加载中…</span>
    </div>
    <div ref="el" class="base-chart__canvas" :style="{ height }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import echarts from '../../utils/echarts'

const props = defineProps({
  option: { type: Object, default: () => ({}) },
  height: { type: String, default: '280px' },
  loading: { type: Boolean, default: false }
})

const el = ref(null)
let chart = null
let observer = null

const render = () => {
  if (!chart) return
  // notMerge: true —— 数据维度变化时避免旧 series 残留
  chart.setOption(props.option || {}, true)
}

const resize = () => {
  if (chart) chart.resize()
}

onMounted(() => {
  chart = echarts.init(el.value, null, { renderer: 'canvas' })
  render()
  // 容器尺寸变化（侧边栏折叠、栅格换行）时自适应
  observer = new ResizeObserver(() => resize())
  observer.observe(el.value)
  window.addEventListener('resize', resize)
})

watch(
  () => props.option,
  () => nextTick(render),
  { deep: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (chart) {
    chart.dispose()
    chart = null
  }
})

defineExpose({ resize, getInstance: () => chart })
</script>

<style scoped>
.base-chart {
  position: relative;
  width: 100%;
  height: 100%;
}
.base-chart__canvas {
  width: 100%;
}
.base-chart__loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-tertiary, #8f959e);
  background: rgba(127, 127, 127, 0.1);
}
.base-chart__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: base-chart-spin 0.7s linear infinite;
}
@keyframes base-chart-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

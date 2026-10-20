<template>
  <div class="kpi-card" :class="`kpi-card--${variant}`">
    <div class="kpi-card__icon">{{ icon }}</div>
    <div class="kpi-card__body">
      <div class="kpi-card__value">
        {{ displayValue }}<span v-if="suffix" class="kpi-card__suffix">{{ suffix }}</span>
      </div>
      <div class="kpi-card__label">{{ label }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: [Number, String], default: 0 },
  icon: { type: String, default: '📊' },
  suffix: { type: String, default: '' },
  variant: { type: String, default: 'blue' } // blue | green | orange | purple
})

const displayValue = ref(0)
let rafId = null

const animateTo = (target) => {
  const to = Number(target) || 0
  const from = Number(displayValue.value) || 0
  if (to === from) {
    displayValue.value = to
    return
  }
  const duration = 700
  const start = performance.now()
  cancelAnimationFrame(rafId)
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1)
    // easeOutCubic
    const eased = 1 - Math.pow(1 - p, 3)
    displayValue.value = Math.round(from + (to - from) * eased)
    if (p < 1) rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
}

onMounted(() => animateTo(props.value))
watch(() => props.value, (v) => animateTo(v))
</script>

<style scoped>
.kpi-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--glass-bg, rgba(255, 255, 255, 0.68));
  backdrop-filter: var(--glass-blur, blur(18px));
  -webkit-backdrop-filter: var(--glass-blur, blur(18px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.75));
  border-radius: var(--radius-lg, 20px);
  box-shadow: var(--glass-shadow, 0 8px 30px rgba(43, 90, 237, 0.1));
  transition: transform var(--transition-base, 0.25s), box-shadow var(--transition-base, 0.25s),
    background var(--transition-base, 0.25s);
  overflow: hidden;
}
.kpi-card::after {
  content: '';
  position: absolute;
  right: -28px;
  top: -28px;
  width: 108px;
  height: 108px;
  border-radius: 50%;
  background: var(--gradient-brand-soft);
  filter: blur(6px);
  opacity: 0.75;
  pointer-events: none;
}
.kpi-card:hover {
  transform: translateY(-4px);
  background: var(--glass-bg-strong, rgba(255, 255, 255, 0.82));
  box-shadow: var(--glass-shadow-hover, 0 20px 48px rgba(43, 90, 237, 0.18));
}
.kpi-card__icon {
  position: relative;
  z-index: 1;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  border-radius: var(--radius-md, 14px);
}
.kpi-card--blue .kpi-card__icon {
  background: linear-gradient(135deg, #2b5aed, #4e7bf5);
  box-shadow: 0 8px 20px rgba(43, 90, 237, 0.34);
}
.kpi-card--green .kpi-card__icon {
  background: linear-gradient(135deg, #36cfc9, #52c41a);
  box-shadow: 0 8px 20px rgba(82, 196, 26, 0.3);
}
.kpi-card--orange .kpi-card__icon {
  background: linear-gradient(135deg, #ffc53d, #faad14);
  box-shadow: 0 8px 20px rgba(250, 173, 20, 0.3);
}
.kpi-card--purple .kpi-card__icon {
  background: linear-gradient(135deg, #7c5cff, #b37feb);
  box-shadow: 0 8px 20px rgba(124, 92, 255, 0.3);
}
.kpi-card__body {
  position: relative;
  z-index: 1;
}
.kpi-card__value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--text-primary, #1f2329);
  font-variant-numeric: tabular-nums;
}
.kpi-card__suffix {
  font-size: 13px;
  font-weight: 500;
  margin-left: 3px;
  color: var(--text-tertiary, #8f959e);
}
.kpi-card__label {
  margin-top: 2px;
  font-size: 13px;
  color: var(--text-secondary, #646a73);
}
</style>

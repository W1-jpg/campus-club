<template>
  <section :class="['ripple-container', className]" :style="containerStyle">
    <span v-for="i in numCircles" :key="i" class="ripple-circle" :style="getCircleStyle(i - 1)" />
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  mainCircleSize: { type: Number, default: 210 },
  mainCircleOpacity: { type: Number, default: 0.24 },
  numCircles: { type: Number, default: 11 },
  className: { type: String, default: '' }
})

const containerStyle = computed(() => ({
  maxWidth: '50%', position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  maskImage: 'linear-gradient(to bottom, black, transparent)',
  WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
  background: 'transparent'
}))

function getCircleStyle(index) {
  const size = props.mainCircleSize + index * 70
  const opacity = props.mainCircleOpacity - index * 0.03
  const delay = `${index * 0.06}s`
  const borderStyle = index === props.numCircles - 1 ? 'dashed' : 'solid'
  const borderOpacity = 5 + index * 5
  return {
    width: `${size}px`, height: `${size}px`, opacity, animationDelay: delay,
    borderStyle, borderWidth: '1px',
    borderColor: `rgba(124, 58, 237, ${borderOpacity / 100})`,
    top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1)'
  }
}
</script>

<style scoped>
.ripple-container { pointer-events: none; z-index: 5; }
.ripple-circle {
  position: absolute; border-radius: 50%;
  animation: ripplePulse 2s ease calc(var(--i, 0) * 0.2s) infinite;
  background: rgba(124, 58, 237, 0.08);
}
.ripple-circle:nth-child(1) { --i: 0; } .ripple-circle:nth-child(2) { --i: 1; }
.ripple-circle:nth-child(3) { --i: 2; } .ripple-circle:nth-child(4) { --i: 3; }
.ripple-circle:nth-child(5) { --i: 4; } .ripple-circle:nth-child(6) { --i: 5; }
.ripple-circle:nth-child(7) { --i: 6; } .ripple-circle:nth-child(8) { --i: 7; }
.ripple-circle:nth-child(9) { --i: 8; } .ripple-circle:nth-child(10) { --i: 9; }
.ripple-circle:nth-child(11) { --i: 10; }
@keyframes ripplePulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(0.9); }
}
</style>

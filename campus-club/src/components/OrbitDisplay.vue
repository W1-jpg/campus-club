<template>
  <section class="orbit-display">
    <span class="orbit-display__text">{{ text }}</span>
    <div v-for="(icon, index) in iconsArray" :key="index"
      class="orbit-item" :class="{ 'orbit-item--reverse': icon.reverse }"
      :style="getOrbitStyle(icon)">
      <svg v-if="icon.path !== false" xmlns="http://www.w3.org/2000/svg" version="1.1" class="orbit-item__path">
        <circle class="orbit-item__path-circle" cx="50%" cy="50%" :r="icon.radius || 50" fill="none" />
      </svg>
      <div class="orbit-item__icon" :class="icon.className" :style="getIconContainerStyle(icon)">
        <img v-if="icon.src" :src="icon.src" :alt="icon.alt || 'icon'" class="orbit-item__img" />
        <span v-else class="orbit-item__emoji">{{ icon.emoji }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  iconsArray: { type: Array, required: true },
  text: { type: String, default: '成果孵化平台' }
})

function getOrbitStyle(icon) {
  return { '--duration': icon.duration || 20, '--radius': icon.radius || 50, '--delay': -(icon.delay || 0) }
}
function getIconContainerStyle(icon) {
  const r = icon.radius || 50
  return { width: `${r * 2}px`, height: `${r * 2}px` }
}
</script>

<style scoped>
.orbit-display {
  position: relative; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  width: 100%; height: 100%; overflow: hidden; border-radius: 12px;
}
.orbit-display__text {
  pointer-events: none; white-space: pre-wrap;
  background: linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0.3) 80%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  text-align: center; font-size: 48px; font-weight: 700; line-height: 1.2; z-index: 10; position: relative;
}
.orbit-item {
  position: absolute; display: flex; align-items: center; justify-content: center;
  animation: orbitSpin calc(var(--duration) * 1s) linear infinite;
  animation-delay: calc(var(--delay) * 1000ms);
}
.orbit-item--reverse { animation-direction: reverse; }
.orbit-item__path { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.orbit-item__path-circle { stroke: rgba(255, 255, 255, 0.1); stroke-width: 1; }
.orbit-item__icon { position: absolute; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.orbit-item__img { width: 100%; height: 100%; object-fit: contain; }
.orbit-item__emoji { font-size: 28px; line-height: 1; }
@keyframes orbitSpin {
  0% { transform: rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg); }
  100% { transform: rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg); }
}
</style>

<template>
  <div
    ref="eyeRef"
    class="eye-ball"
    :class="{ 'eye-ball--blinking': isBlinking }"
    :style="eyeStyle"
  >
    <div
      v-if="!isBlinking"
      class="eye-ball__pupil"
      :style="pupilStyle"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  size: { type: Number, default: 48 },
  pupilSize: { type: Number, default: 16 },
  maxDistance: { type: Number, default: 10 },
  eyeColor: { type: String, default: 'white' },
  pupilColor: { type: String, default: '#2D2D2D' },
  isBlinking: { type: Boolean, default: false },
  forceLookX: { type: Number, default: undefined },
  forceLookY: { type: Number, default: undefined }
})

const mouseX = ref(0)
const mouseY = ref(0)
const eyeRef = ref(null)

function onMouseMove(e) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
})

const pupilPosition = computed(() => {
  if (!eyeRef.value) return { x: 0, y: 0 }

  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY }
  }

  const eye = eyeRef.value.getBoundingClientRect()
  const eyeCenterX = eye.left + eye.width / 2
  const eyeCenterY = eye.top + eye.height / 2

  const deltaX = mouseX.value - eyeCenterX
  const deltaY = mouseY.value - eyeCenterY
  const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), props.maxDistance)

  const angle = Math.atan2(deltaY, deltaX)
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  }
})

const eyeStyle = computed(() => ({
  width: `${props.size}px`,
  height: props.isBlinking ? '2px' : `${props.size}px`,
  backgroundColor: props.eyeColor,
  overflow: 'hidden'
}))

const pupilStyle = computed(() => ({
  width: `${props.pupilSize}px`,
  height: `${props.pupilSize}px`,
  backgroundColor: props.pupilColor,
  borderRadius: '50%',
  transform: `translate(${pupilPosition.value.x}px, ${pupilPosition.value.y}px)`,
  transition: 'transform 0.1s ease-out'
}))
</script>

<style scoped>
.eye-ball {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.eye-ball--blinking {
  overflow: hidden;
}
</style>

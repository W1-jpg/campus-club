<template>
  <section ref="containerRef" :style="containerStyle" :class="['box-reveal', className]">
    <div ref="contentRef" class="box-reveal__content" :class="{ 'is-visible': isVisible }">
      <slot />
    </div>
    <div class="box-reveal__slider" :class="{ 'is-slid': isVisible }" :style="sliderStyle" />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  width: { type: String, default: 'fit-content' },
  boxColor: { type: String, default: '#5046e6' },
  duration: { type: Number, default: 0.5 },
  overflow: { type: String, default: 'hidden' },
  position: { type: String, default: 'relative' },
  className: { type: String, default: '' },
  delay: { type: Number, default: 0.25 }
})

const containerRef = ref(null)
const contentRef = ref(null)
const isVisible = ref(false)

const containerStyle = computed(() => ({
  position: props.position,
  width: props.width,
  overflow: props.overflow
}))

const sliderStyle = computed(() => ({
  position: 'absolute',
  top: '4px', bottom: '4px', left: 0, right: 0,
  zIndex: 20,
  background: props.boxColor || 'var(--color-primary)',
  borderRadius: '4px',
  transition: `left ${props.duration}s ease-in`
}))

onMounted(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setTimeout(() => { isVisible.value = true }, props.delay * 1000)
      observer.disconnect()
    }
  }, { threshold: 0.1 })
  if (containerRef.value) observer.observe(containerRef.value)
  setTimeout(() => { if (!isVisible.value) isVisible.value = true }, props.delay * 1000 + 100)
})
</script>

<style scoped>
.box-reveal { position: relative; }
.box-reveal__content {
  opacity: 0; transform: translateY(75px);
  transition: all v-bind('props.duration + "s"') cubic-bezier(0.4, 0, 0.2, 1);
}
.box-reveal__content.is-visible { opacity: 1; transform: translateY(0); }
.box-reveal__slider.is-slid { left: 100% !important; }
</style>

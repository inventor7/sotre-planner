<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: number
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'change'])

const isDragging = ref(false)
const startX = ref(0)
const startRotation = ref(0)
const pixelsPerDegree = 4
const totalDegrees = 360

const dialRef = ref<HTMLElement | null>(null)
const lastHapticValue = ref(props.modelValue)

const handlePointerDown = (e: PointerEvent) => {
  isDragging.value = true
  startX.value = e.clientX
  startRotation.value = props.modelValue
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  document.body.style.cursor = 'ew-resize'
}

const handlePointerMove = (e: PointerEvent) => {
  if (!isDragging.value) return

  const deltaX = e.clientX - startX.value
  const deltaRotation = -deltaX / pixelsPerDegree

  let newRotation = (startRotation.value + deltaRotation) % totalDegrees
  if (newRotation < 0) newRotation += totalDegrees

  let finalRotation = Math.round(newRotation)

  const snapTo = 45
  const distToSnap = finalRotation % snapTo
  if (distToSnap < 5) finalRotation -= distToSnap
  else if (distToSnap > snapTo - 5) finalRotation += snapTo - distToSnap

  if (finalRotation !== props.modelValue) {
    emit('update:modelValue', finalRotation)

    if (Math.abs(finalRotation - lastHapticValue.value) >= 1) {
      if ('vibrate' in navigator) {
        if (finalRotation % 45 === 0) {
          navigator.vibrate(10)
        } else {
          navigator.vibrate(2)
        }
      }
      lastHapticValue.value = finalRotation
    }
  }
}

const handlePointerUp = () => {
  if (isDragging.value) {
    isDragging.value = false
    document.body.style.cursor = ''
    emit('change', props.modelValue)
  }
}

const visibleDegrees = computed(() => {
  const current = props.modelValue
  const marks = []
  for (let i = -60; i <= 60; i++) {
    let deg = (current + i) % totalDegrees
    if (deg < 0) deg += totalDegrees
    marks.push({
      degree: Math.round(deg),
      offset: i * pixelsPerDegree,
    })
  }
  return marks
})
</script>

<template>
  <div class="flex flex-col items-center gap-1 w-full">
    <div class="relative w-full max-w-[280px] h-12 group">
      <div
        class="absolute inset-0 z-10 pointer-events-none bg-linear-to-r from-background via-transparent to-background"
      ></div>

      <div
        class="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-0.5 bg-primary z-20 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
      ></div>

      <div
        ref="dialRef"
        class="absolute inset-x-0 bottom-0 h-10 flex items-end justify-center cursor-ew-resize select-none touch-none overflow-hidden"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
      >
        <div class="relative h-full flex items-end">
          <div
            v-for="mark in visibleDegrees"
            :key="mark.degree + '-' + mark.offset"
            class="absolute flex flex-col items-center transition-transform duration-75"
            :style="{ transform: `translateX(${mark.offset}px)` }"
          >
            <div
              v-if="mark.degree % 10 === 0"
              class="w-0.5 h-6 bg-foreground/40 rounded-full"
            ></div>
            <div
              v-else-if="mark.degree % 5 === 0"
              class="w-px h-4 bg-foreground/20 rounded-full"
            ></div>
            <div v-else class="w-px h-2 bg-foreground/10 rounded-full"></div>

            <span
              v-if="mark.degree % 30 === 0"
              class="text-[8px] font-bold text-muted-foreground mt-0.5 tabular-nums transition-opacity"
              :class="Math.abs(mark.offset) < 20 ? 'opacity-0' : 'opacity-100'"
            >
              {{ mark.degree }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="h-6 px-2 rounded-full bg-muted/50 border border-border flex items-center justify-center min-w-[40px]"
    >
      <span class="text-[10px] font-bold text-foreground tabular-nums"
        >{{ Math.round(modelValue) }}°</span
      >
    </div>
  </div>
</template>

<style scoped>
/* No specific styles needed */
</style>

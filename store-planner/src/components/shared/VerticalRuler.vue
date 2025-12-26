<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  unit?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 10,
  max: 1000,
  step: 1,
  unit: 'cm',
})

const emit = defineEmits(['update:modelValue', 'change'])

const isDragging = ref(false)
const startY = ref(0)
const startValue = ref(0)
const pixelsPerUnit = 2
const lastHapticValue = ref(props.modelValue)

const handlePointerDown = (e: PointerEvent) => {
  isDragging.value = true
  startY.value = e.clientY
  startValue.value = props.modelValue
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  document.body.style.cursor = 'ns-resize'
}

const handlePointerMove = (e: PointerEvent) => {
  if (!isDragging.value) return

  const deltaY = e.clientY - startY.value
  const deltaValue = deltaY / pixelsPerUnit

  let newValue = startValue.value + deltaValue

  if (props.min !== undefined) newValue = Math.max(props.min, newValue)
  if (props.max !== undefined) newValue = Math.min(props.max, newValue)

  let finalValue = Math.round(newValue / props.step) * props.step

  const snapTo = 50
  const distToSnap = finalValue % snapTo
  if (distToSnap < 5) finalValue -= distToSnap
  else if (distToSnap > snapTo - 5) finalValue += snapTo - distToSnap

  if (finalValue !== props.modelValue) {
    emit('update:modelValue', finalValue)

    if ('vibrate' in navigator) {
      if (finalValue % 50 === 0) {
        navigator.vibrate(10)
      } else if (Math.abs(finalValue - lastHapticValue.value) >= 5) {
        navigator.vibrate(2)
        lastHapticValue.value = finalValue
      }
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

const visibleMarks = computed(() => {
  const current = props.modelValue
  const marks = []
  const range = 40

  for (let i = -range; i <= range; i++) {
    const val = current + i
    if (val < (props.min || 0) || val > (props.max || 10000)) continue

    marks.push({
      val: Math.round(val),
      offset: -i * pixelsPerUnit,
    })
  }
  return marks
})
</script>

<template>
  <div
    class="relative w-12 h-32 group select-none touch-none overflow-hidden rounded-lg bg-muted/20 border border-border/50"
  >
    <div
      class="absolute inset-x-0 inset-y-0 z-10 pointer-events-none bg-linear-to-b from-background/80 via-transparent to-background/80"
    ></div>

    <div class="absolute inset-x-0 top-1/2 -translate-y-px h-0.5 bg-primary/30 z-20"></div>

    <div
      class="absolute inset-0 cursor-ns-resize flex items-center justify-end pr-2"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
    >
      <div class="relative w-full h-full">
        <div
          v-for="mark in visibleMarks"
          :key="mark.val + '-' + mark.offset"
          class="absolute right-0 top-1/2 flex items-center transition-transform duration-75"
          :style="{ transform: `translateY(${mark.offset}px) translateY(-50%)` }"
        >
          <span
            v-if="mark.val % 10 === 0"
            class="text-[8px] font-bold text-muted-foreground mr-2 tabular-nums"
            :class="Math.abs(mark.offset) < 5 ? 'text-primary scale-110' : 'opacity-40'"
          >
            {{ mark.val }}
          </span>

          <div
            v-if="mark.val % 10 === 0"
            class="w-4 h-0.5 bg-foreground/40 rounded-full"
            :class="Math.abs(mark.offset) < 5 && 'bg-primary'"
          ></div>
          <div v-else-if="mark.val % 5 === 0" class="w-2 h-px bg-foreground/20 rounded-full"></div>
          <div v-else class="w-1.5 h-px bg-foreground/10 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-ns-resize {
  cursor: ns-resize;
}
</style>

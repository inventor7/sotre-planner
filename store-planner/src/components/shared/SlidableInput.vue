<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue: number
  label: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  sensitivity?: number
}

const props = withDefaults(defineProps<Props>(), {
  step: 1,
  min: 1,
  max: 1000,
  sensitivity: 0.5,
})

const emit = defineEmits(['update:modelValue', 'change'])

const isDragging = ref(false)
const startX = ref(0)
const startValue = ref(0)

const handlePointerDown = (e: PointerEvent) => {
  isDragging.value = true
  startX.value = e.clientX
  startValue.value = props.modelValue

  // Set pointer capture to receive events even outside the element
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

  document.body.style.cursor = 'ew-resize'
}

const handlePointerMove = (e: PointerEvent) => {
  if (!isDragging.value) return

  const delta = (e.clientX - startX.value) * props.sensitivity
  let newValue = Math.round(startValue.value + delta)

  if (props.min !== undefined) newValue = Math.max(props.min, newValue)
  if (props.max !== undefined) newValue = Math.min(props.max, newValue)

  emit('update:modelValue', newValue)
}

const handlePointerUp = () => {
  if (isDragging.value) {
    isDragging.value = false
    document.body.style.cursor = ''
    emit('change', props.modelValue)
  }
}

const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = parseInt(target.value)
  if (isNaN(val)) return

  if (props.min !== undefined) val = Math.max(props.min, val)
  if (props.max !== undefined) val = Math.min(props.max, val)

  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<template>
  <div class="space-y-1.5 group">
    <div
      class="flex items-center justify-between cursor-ew-resize select-none"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
    >
      <label
        class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pointer-events-none"
      >
        {{ label }}
      </label>
      <div v-if="isDragging" class="text-[10px] text-primary animate-pulse font-bold">SLIDING</div>
    </div>
    <div class="relative">
      <input
        type="number"
        :value="modelValue"
        @input="handleInputChange"
        class="h-10 w-full pl-3 pr-8 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div
        v-if="suffix"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground"
      >
        {{ suffix }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Hidden spin buttons already handled by Tailwind classes in input */
</style>

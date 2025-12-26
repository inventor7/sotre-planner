<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { WallSegment } from '@/types/editor'
import { useEditorStore } from '@/stores/editorStore'

interface Props {
  wall: WallSegment
}

const props = defineProps<Props>()

const editorStore = useEditorStore()
const { selectedWallId } = storeToRefs(editorStore)
const { selectWall, getWallCoordinates } = editorStore

const isSelected = computed(() => selectedWallId.value === props.wall.id)

const coords = computed(() => getWallCoordinates(props.wall))

const properties = computed(() => {
  if (!coords.value) return null
  const { x1, y1, x2, y2 } = coords.value
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  return { x1, y1, x2, y2, length, angle }
})

const handlePointerDown = (e: PointerEvent) => {
  e.stopPropagation()
  selectWall(props.wall.id)
}

const textureLinesCount = computed(() => {
  if (!properties.value) return 0
  return Math.floor(properties.value.length / 30)
})
</script>

<template>
  <g
    v-if="properties"
    @pointerdown="handlePointerDown"
    class="cursor-pointer"
    :transform="`translate(${properties.x1}, ${properties.y1}) rotate(${properties.angle}, 0, 0)`"
  >
    <!-- Door -->
    <template v-if="wall.type === 'door'">
      <!-- Door frame -->
      <rect
        :x="0"
        :y="-wall.thickness / 2"
        :width="properties.length"
        :height="wall.thickness"
        fill="#4A4A4A"
        :stroke="isSelected ? '#FACC15' : '#2F2F2F'"
        :stroke-width="isSelected ? 3 : 1"
        :stroke-dasharray="isSelected ? '5,3' : 'none'"
      />

      <!-- Door opening -->
      <rect
        :x="wall.thickness / 2"
        :y="-wall.thickness / 2 + 2"
        :width="properties.length - wall.thickness"
        :height="wall.thickness - 4"
        fill="#C4A574"
      />

      <!-- Swing arc -->
      <path
        :d="`M ${wall.thickness / 2} ${-wall.thickness / 2}
            A ${properties.length * 0.8} ${properties.length * 0.8} 0 0 ${wall.doorSwing === 'left' ? 0 : 1}
            ${wall.thickness / 2 + properties.length * 0.8} ${-wall.thickness / 2 - properties.length * 0.8}`"
        fill="none"
        stroke="#666"
        stroke-width="1"
        stroke-dasharray="4,2"
      />

      <!-- Door leaf -->
      <rect
        :x="wall.thickness / 2"
        :y="-wall.thickness / 2 - properties.length * 0.8"
        :width="properties.length * 0.8"
        :height="4"
        fill="#8B4513"
        :transform="`rotate(${wall.doorSwing === 'left' ? 45 : -45}, ${wall.thickness / 2}, ${-wall.thickness / 2})`"
      />
    </template>

    <!-- Window -->
    <template v-else-if="wall.type === 'window'">
      <!-- Window frame -->
      <rect
        :x="0"
        :y="-wall.thickness / 2"
        :width="properties.length"
        :height="wall.thickness"
        fill="#87CEEB"
        :stroke="isSelected ? '#FACC15' : '#4682B4'"
        :stroke-width="isSelected ? 3 : 2"
        :stroke-dasharray="isSelected ? '5,3' : 'none'"
      />

      <!-- Glass panes -->
      <line
        :x1="properties.length / 2"
        :y1="-wall.thickness / 2"
        :x2="properties.length / 2"
        :y2="wall.thickness / 2"
        stroke="#4682B4"
        stroke-width="2"
      />

      <!-- Reflection lines -->
      <line
        :x1="properties.length * 0.2"
        :y1="-wall.thickness / 2 + 3"
        :x2="properties.length * 0.3"
        :y2="wall.thickness / 2 - 3"
        stroke="rgba(255,255,255,0.5)"
        stroke-width="2"
      />
      <line
        :x1="properties.length * 0.7"
        :y1="-wall.thickness / 2 + 3"
        :x2="properties.length * 0.8"
        :y2="wall.thickness / 2 - 3"
        stroke="rgba(255,255,255,0.5)"
        stroke-width="2"
      />
    </template>

    <!-- Wall -->
    <template v-else>
      <rect
        :x="0"
        :y="-wall.thickness / 2"
        :width="properties.length"
        :height="wall.thickness"
        fill="#E8E0D5"
        :stroke="isSelected ? '#FACC15' : '#B8B0A5'"
        :stroke-width="isSelected ? 3 : 1"
        :stroke-dasharray="isSelected ? '5,3' : 'none'"
      />

      <!-- Wall texture lines -->
      <line
        v-for="(_, i) in textureLinesCount"
        :key="i"
        :x1="(i + 1) * 30"
        :y1="-wall.thickness / 2"
        :x2="(i + 1) * 30"
        :y2="wall.thickness / 2"
        stroke="#D0C8BD"
        stroke-width="1"
      />
    </template>
  </g>
</template>

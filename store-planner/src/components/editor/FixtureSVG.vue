<script setup lang="ts">
import { computed } from 'vue'
import type { FixtureTemplate } from '@/types/editor'

interface Props {
  template: FixtureTemplate
  width: number
  height: number
  isSelected?: boolean
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  scale: 1,
})

const strokeWidth = computed(() => 2 / props.scale)
const selectionPadding = computed(() => 4 / props.scale)

// Helper for shelf lines
const shelfLines = computed(() => {
  if (!props.template.shelves) return []
  return Array.from({ length: props.template.shelves - 1 })
})

// Helper for fridge doors
const fridgeDoors = computed(() => {
  if (!props.template.doors) return []
  return Array.from({ length: props.template.doors })
})

// Helper for checkout lines
const checkoutLinesCount = 6
</script>

<template>
  <g>
    <!-- Selection Glow/Outline -->
    <rect
      v-if="isSelected"
      :x="-selectionPadding"
      :y="-selectionPadding"
      :width="width + selectionPadding * 2"
      :height="height + selectionPadding * 2"
      fill="none"
      stroke="#FFD700"
      :stroke-width="strokeWidth * 1.5"
      :stroke-dasharray="`${6 / scale},${3 / scale}`"
      rx="4"
    />

    <!-- Shelves -->
    <g v-if="template.category === 'shelves'">
      <rect
        :x="0"
        :y="0"
        :width="width"
        :height="height"
        :fill="template.color"
        stroke="#3D3D3D"
        :stroke-width="strokeWidth"
        rx="2"
      />
      <line
        v-for="(_, i) in shelfLines"
        :key="i"
        :x1="4"
        :y1="(height / (template.shelves || 1)) * (i + 1)"
        :x2="width - 4"
        :y2="(height / (template.shelves || 1)) * (i + 1)"
        stroke="#4A4A4A"
        :stroke-width="strokeWidth * 0.5"
        :stroke-dasharray="`${4 / scale},${2 / scale}`"
      />
      <line
        :x1="width / 2"
        :y1="4"
        :x2="width / 2"
        :y2="height - 4"
        stroke="#5A5A5A"
        :stroke-width="strokeWidth * 0.8"
      />
    </g>

    <!-- Fridges -->
    <g v-else-if="template.category === 'fridges'">
      <rect
        :x="0"
        :y="0"
        :width="width"
        :height="height"
        :fill="template.color"
        stroke="#5A7A8A"
        :stroke-width="strokeWidth"
        rx="3"
      />
      <rect
        :x="4"
        :y="4"
        :width="width - 8"
        :height="height - 8"
        fill="none"
        stroke="#7AAFCF"
        :stroke-width="strokeWidth * 0.5"
        rx="2"
      />
      <g v-for="(_, i) in fridgeDoors" :key="i">
        <line
          :x1="(width / (template.doors || 1)) * (i + 1)"
          :y1="6"
          :x2="(width / (template.doors || 1)) * (i + 1)"
          :y2="height - 6"
          stroke="#5A7A8A"
          :stroke-width="strokeWidth * 0.8"
        />
        <rect
          :x="(width / (template.doors || 1)) * i + width / (template.doors || 1) - 12"
          :y="height / 2 - 8"
          :width="6"
          :height="16"
          fill="#4A6A7A"
          rx="1"
        />
      </g>
      <circle cx="12" cy="12" r="4" fill="#4FC3F7" opacity="0.7" />
    </g>

    <!-- Checkout -->
    <g v-else-if="template.category === 'checkout'">
      <rect
        :x="0"
        :y="0"
        :width="width"
        :height="height"
        :fill="template.color"
        stroke="#3A3A3A"
        :stroke-width="strokeWidth"
        rx="2"
      />
      <rect
        :x="8"
        :y="height * 0.2"
        :width="width - 40"
        :height="height * 0.4"
        fill="#2A2A2A"
        stroke="#4A4A4A"
        :stroke-width="strokeWidth * 0.5"
        rx="1"
      />
      <line
        v-for="(_, i) in checkoutLinesCount"
        :key="i"
        :x1="20 + i * ((width - 60) / 5)"
        :y1="height * 0.25"
        :x2="20 + i * ((width - 60) / 5)"
        :y2="height * 0.55"
        stroke="#5A5A5A"
        :stroke-width="strokeWidth * 0.3"
      />
      <rect
        :x="width - 30"
        :y="height * 0.15"
        :width="22"
        :height="height * 0.5"
        fill="#4A4A4A"
        rx="2"
      />
      <rect
        :x="width - 26"
        :y="height * 0.2"
        :width="14"
        :height="height * 0.25"
        fill="#1A1A3A"
        rx="1"
      />
    </g>

    <!-- Structures -->
    <g v-else-if="template.category === 'structures'">
      <!-- Window -->
      <template v-if="template.id.includes('window')">
        <rect
          :x="0"
          :y="0"
          :width="width"
          :height="height"
          fill="#A8D4E6"
          stroke="#6A6A6A"
          :stroke-width="strokeWidth"
        />
        <line
          :x1="width / 2"
          :y1="2"
          :x2="width / 2"
          :y2="height - 2"
          stroke="#6A6A6A"
          :stroke-width="strokeWidth * 0.5"
        />
        <rect
          :x="width * 0.1"
          :y="height * 0.2"
          :width="width * 0.3"
          :height="height * 0.3"
          fill="rgba(255,255,255,0.4)"
          rx="1"
        />
      </template>
      <!-- Door -->
      <template v-else>
        <rect
          :x="0"
          :y="0"
          :width="width"
          :height="height"
          :fill="template.color"
          stroke="#2A2A2A"
          :stroke-width="strokeWidth"
        />
        <path
          :d="`M ${width * 0.1} ${height * 0.5} A ${width * 0.4} ${width * 0.4} 0 0 1 ${width * 0.5} ${height * 0.1}`"
          fill="none"
          stroke="#6A6A6A"
          :stroke-width="strokeWidth * 0.5"
          :stroke-dasharray="`${3 / scale},${2 / scale}`"
        />
        <rect
          :x="width * 0.15"
          :y="height * 0.3"
          :width="width * 0.7"
          :height="height * 0.4"
          fill="#5A5A5A"
          rx="1"
        />
      </template>
    </g>

    <!-- Furniture -->
    <g v-else-if="template.category === 'furniture'">
      <rect
        :x="0"
        :y="0"
        :width="width"
        :height="height"
        :fill="template.color"
        stroke="#3A3A3A"
        :stroke-width="strokeWidth"
        :rx="template.id.includes('rack') ? height / 2 : 3"
      />
      <template v-if="!template.id.includes('rack')">
        <circle :cx="10" :cy="10" r="4" fill="#2A2A2A" />
        <circle :cx="width - 10" :cy="10" r="4" fill="#2A2A2A" />
        <circle :cx="10" :cy="height - 10" r="4" fill="#2A2A2A" />
        <circle :cx="width - 10" :cy="height - 10" r="4" fill="#2A2A2A" />
      </template>
      <circle
        v-if="template.id.includes('rack')"
        :cx="width / 2"
        :cy="height / 2"
        :r="Math.min(width, height) / 4"
        fill="none"
        stroke="#2A2A2A"
        :stroke-width="strokeWidth"
      />
    </g>

    <!-- Default -->
    <g v-else>
      <rect
        :x="0"
        :y="0"
        :width="width"
        :height="height"
        :fill="template.color"
        stroke="#3D3D3D"
        :stroke-width="strokeWidth"
        rx="2"
      />
    </g>
  </g>
</template>

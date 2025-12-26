<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editorStore'
import { getTemplateById } from '@/data/fixtureTemplates'
import type { PlacedFixture } from '@/types/editor'
import FixtureSVG from './FixtureSVG.vue'

interface Props {
  fixture: PlacedFixture
  scale: number
  isResizing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isResizing: false,
})

const emit = defineEmits<{
  (e: 'dragStart', event: PointerEvent, fixtureId: string): void
  (e: 'resizeStart', event: PointerEvent, fixtureId: string, handle: string): void
  (e: 'rotateStart', event: PointerEvent, fixtureId: string): void
}>()

const editorStore = useEditorStore()
const { selectedFixtureId } = storeToRefs(editorStore)
const { selectFixture } = editorStore

const template = computed(() => getTemplateById(props.fixture.templateId))
const isSelected = computed(() => selectedFixtureId.value === props.fixture.id)

const handleSize = 32

const resizeHandles = computed(() => [
  {
    key: 'n',
    x: props.fixture.width / 2 - handleSize / 2,
    y: -handleSize / 2,
    cursor: 'ns-resize',
  },
  {
    key: 's',
    x: props.fixture.width / 2 - handleSize / 2,
    y: props.fixture.height - handleSize / 2,
    cursor: 'ns-resize',
  },
  {
    key: 'e',
    x: props.fixture.width - handleSize / 2,
    y: props.fixture.height / 2 - handleSize / 2,
    cursor: 'ew-resize',
  },
  {
    key: 'w',
    x: -handleSize / 2,
    y: props.fixture.height / 2 - handleSize / 2,
    cursor: 'ew-resize',
  },
  { key: 'nw', x: -handleSize / 2, y: -handleSize / 2, cursor: 'nwse-resize' },
  { key: 'ne', x: props.fixture.width - handleSize / 2, y: -handleSize / 2, cursor: 'nesw-resize' },
  {
    key: 'sw',
    x: -handleSize / 2,
    y: props.fixture.height - handleSize / 2,
    cursor: 'nesw-resize',
  },
  {
    key: 'se',
    x: props.fixture.width - handleSize / 2,
    y: props.fixture.height - handleSize / 2,
    cursor: 'nwse-resize',
  },
])

const handlePointerDown = (e: PointerEvent) => {
  const target = e.target as Element
  if (target.classList.contains('resize-handle') || target.classList.contains('rotate-handle')) {
    return
  }
  e.stopPropagation()
  selectFixture(props.fixture.id)
  emit('dragStart', e, props.fixture.id)
}

const onResizePointerDown = (e: PointerEvent, handleKey: string) => {
  e.stopPropagation()
  emit('resizeStart', e, props.fixture.id, handleKey)
}

const onRotatePointerDown = (e: PointerEvent) => {
  e.stopPropagation()
  emit('rotateStart', e, props.fixture.id)
}
</script>

<template>
  <g
    v-if="template"
    :transform="`translate(${fixture.x}, ${fixture.y}) rotate(${fixture.rotation}, ${fixture.width / 2}, ${fixture.height / 2})`"
    style="cursor: move"
    @pointerdown="handlePointerDown"
  >
    <FixtureSVG
      :template="template"
      :width="fixture.width"
      :height="fixture.height"
      :isSelected="isSelected"
      :scale="scale"
    />

    <!-- Selection outline and handles -->
    <template v-if="isSelected">
      <!-- Selection rectangle -->
      <rect
        :x="-2"
        :y="-2"
        :width="fixture.width + 4"
        :height="fixture.height + 4"
        fill="none"
        stroke="var(--selection)"
        :stroke-width="2"
        stroke-dasharray="4,2"
        pointer-events="none"
      />

      <!-- Resize handles -->
      <rect
        v-for="handle in resizeHandles"
        :key="handle.key"
        class="resize-handle"
        :x="handle.x"
        :y="handle.y"
        :width="handleSize"
        :height="handleSize"
        fill="#ffffff"
        stroke="var(--selection)"
        :stroke-width="1.5"
        rx="2"
        :style="{ cursor: handle.cursor }"
        @pointerdown="onResizePointerDown($event, handle.key)"
      />

      <!-- Rotation handle -->
      <g
        class="rotate-handle"
        style="cursor: grab"
        :transform="`translate(${fixture.width / 2}, ${-55})`"
        @pointerdown="onRotatePointerDown"
      >
        <!-- Line from center top to rotation handle -->
        <line
          :x1="0"
          :y1="25"
          :x2="0"
          :y2="55"
          stroke="var(--selection)"
          :stroke-width="2"
          pointer-events="none"
        />
        <!-- Rotation circle -->
        <circle
          :cx="0"
          :cy="0"
          :r="24"
          fill="var(--selection)"
          stroke="#ffffff"
          :stroke-width="2"
        />
        <!-- Rotation icon (Lucide RotateCw simplified) -->
        <g transform="translate(-10, -10) scale(0.85)">
          <path
            d="M12 2v4m0 0a8 8 0 1 1-8 8M12 6l3-3m-3 3L9 3"
            fill="none"
            stroke="#ffffff"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
      </g>
    </template>

    <!-- Dynamic dimension labels when selected or resizing -->
    <template v-if="isSelected || isResizing">
      <!-- Width label -->
      <g
        :transform="`translate(${fixture.width / 2}, ${fixture.height + 45}) rotate(${-fixture.rotation})`"
      >
        <rect
          :x="-28"
          :y="-9"
          :width="56"
          :height="18"
          fill="var(--selection)"
          fill-opacity="0.95"
          :rx="4"
        />
        <text :x="0" :y="4" text-anchor="middle" fill="white" :font-size="11" font-weight="600">
          {{ Math.round(fixture.width) }} cm
        </text>
      </g>

      <!-- Height label -->
      <g
        :transform="`translate(${fixture.width + 45}, ${fixture.height / 2}) rotate(${-fixture.rotation})`"
      >
        <rect
          :x="-28"
          :y="-9"
          :width="56"
          :height="18"
          fill="var(--selection)"
          fill-opacity="0.95"
          :rx="4"
        />
        <text :x="0" :y="4" text-anchor="middle" fill="white" :font-size="11" font-weight="600">
          {{ Math.round(fixture.height) }} cm
        </text>
      </g>
    </template>
  </g>
</template>

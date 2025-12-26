<script setup lang="ts">
import { computed } from 'vue'
import {
  Square as LucideSquare,
  DoorOpen as LucideDoorOpen,
  PanelTop as LucidePanelTop,
  Pencil as LucidePencil,
} from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editorStore'
import { cn } from '@/lib/utils'

const editorStore = useEditorStore()

const hasFixtureSelection = computed(() => !!editorStore.selectedFixtureId)
const hasWallSelection = computed(() => !!editorStore.selectedWallId)
const hasNodeSelection = computed(() => !!editorStore.selectedNodeId)
const hasSelection = computed(
  () => hasFixtureSelection.value || hasWallSelection.value || hasNodeSelection.value,
)

const isDrawingMode = computed(() => {
  return (
    editorStore.activeTool === 'drawWall' ||
    editorStore.activeTool === 'drawDoor' ||
    editorStore.activeTool === 'drawWindow'
  )
})

const isDisabled = computed(() => hasSelection.value)
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="!hasSelection"
      class="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none"
    >
      <div
        :class="
          cn(
            'bg-background/95 backdrop-blur-sm rounded-t-xl shadow-lg border-t border-x border-border p-2 sm:p-3 flex items-center gap-1 sm:gap-2 pointer-events-auto transition-opacity duration-300',
            isDisabled && 'opacity-60',
          )
        "
      >
        <!-- Wall tool -->
        <button
          @click="editorStore.setActiveTool('drawWall')"
          :disabled="isDisabled"
          title="Wall"
          :class="
            cn(
              'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200',
              isDisabled && 'opacity-50 cursor-not-allowed',
              editorStore.activeTool === 'drawWall'
                ? 'bg-foreground text-background shadow-md'
                : 'hover:bg-muted',
            )
          "
        >
          <LucideSquare :size="16" class="sm:w-[18px] sm:h-[18px]" />
          <span class="text-[10px] sm:text-xs font-medium">Wall</span>
        </button>

        <div class="w-px h-6 sm:h-8 bg-border mx-0.5 sm:mx-1" />

        <!-- Door tool -->
        <button
          @click="editorStore.setActiveTool('drawDoor')"
          :disabled="isDisabled"
          title="Door"
          :class="
            cn(
              'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200',
              isDisabled && 'opacity-50 cursor-not-allowed',
              editorStore.activeTool === 'drawDoor'
                ? 'bg-foreground text-background shadow-md'
                : 'hover:bg-muted',
            )
          "
        >
          <LucideDoorOpen :size="16" class="sm:w-[18px] sm:h-[18px]" />
          <span class="text-[10px] sm:text-xs font-medium">Door</span>
        </button>

        <!-- Window tool -->
        <div class="w-px h-6 sm:h-8 bg-border mx-0.5 sm:mx-1" />

        <button
          @click="editorStore.setActiveTool('drawWindow')"
          :disabled="isDisabled"
          title="Window"
          :class="
            cn(
              'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200',
              isDisabled && 'opacity-50 cursor-not-allowed',
              editorStore.activeTool === 'drawWindow'
                ? 'bg-foreground text-background shadow-md'
                : 'hover:bg-muted',
            )
          "
        >
          <LucidePanelTop :size="16" class="sm:w-[18px] sm:h-[18px]" />
          <span class="text-[10px] sm:text-xs font-medium">Window</span>
        </button>

        <!-- Drawing hint -->
        <template v-if="isDrawingMode && !isDisabled">
          <div class="w-px h-6 sm:h-8 bg-border mx-0.5 sm:mx-1" />
          <div
            class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-lg"
          >
            <LucidePencil :size="12" class="sm:w-3.5 sm:h-3.5 text-primary" />
            <span class="text-[10px] sm:text-xs font-medium text-primary whitespace-nowrap">
              {{ editorStore.isDrawingWall ? 'Tap to finish' : 'Tap to draw' }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Plus as LucidePlus,
  Copy as LucideCopy,
  Trash2 as LucideTrash2,
  Eye as LucideEye,
  EyeOff as LucideEyeOff,
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

// Disable fixture tools when in drawing mode
const isDrawingMode = computed(() => {
  return (
    editorStore.activeTool === 'drawWall' ||
    editorStore.activeTool === 'drawDoor' ||
    editorStore.activeTool === 'drawWindow'
  )
})

const handleDelete = () => {
  if (editorStore.selectedFixtureId) {
    editorStore.deleteFixture(editorStore.selectedFixtureId)
  } else if (editorStore.selectedWallId) {
    editorStore.deleteWall(editorStore.selectedWallId)
  } else if (editorStore.selectedNodeId) {
    editorStore.deleteNode(editorStore.selectedNodeId)
  }
}
</script>

<template>
  <div
    :class="
      cn(
        'fixed left-0 top-0 bottom-0 z-50 w-16 sm:w-20 bg-background/95 backdrop-blur-sm border-r border-border flex flex-col items-center py-4 gap-4 overflow-y-auto overflow-x-hidden transition-opacity duration-300',
        isDrawingMode && 'opacity-60',
      )
    "
  >
    <!-- Add Button - Always visible -->
    <button
      @click="editorStore.openLibrary()"
      :disabled="isDrawingMode"
      title="Add"
      :class="
        cn(
          'flex flex-col items-center gap-0.5 rounded-lg sm:rounded-xl p-2 sm:p-3 w-10 sm:w-14 transition-all duration-200',
          'bg-foreground text-background hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed',
        )
      "
    >
      <LucidePlus :size="20" class="sm:w-6 sm:h-6" />
      <span class="font-medium text-[8px] sm:text-[10px]">Add</span>
    </button>

    <div class="h-0.5 w-12 bg-border my-0.5 sm:my-1" />

    <template v-if="hasSelection && !isDrawingMode">
      <template v-if="hasFixtureSelection">
        <button
          @click="
            editorStore.selectedFixtureId &&
            editorStore.duplicateFixture(editorStore.selectedFixtureId)
          "
          title="Copy"
          class="flex flex-col items-center gap-0.5 rounded-lg sm:rounded-xl p-2 sm:p-3 w-10 sm:w-14 transition-all duration-200 hover:bg-muted"
        >
          <LucideCopy :size="16" class="sm:w-5 sm:h-5" />
          <span class="font-medium text-[8px] sm:text-[10px]">Copy</span>
        </button>
      </template>

      <button
        @click="handleDelete"
        title="Del"
        class="flex flex-col items-center gap-0.5 rounded-lg sm:rounded-xl p-2 sm:p-3 w-10 sm:w-14 transition-all duration-200 text-destructive hover:bg-destructive/10"
      >
        <LucideTrash2 :size="16" class="sm:w-5 sm:h-5" />
        <span class="font-medium text-[8px] sm:text-[10px]">Del</span>
      </button>
    </template>

    <div class="mt-auto flex flex-col gap-1 sm:gap-2">
      <!-- View Toggle -->
      <button
        v-if="hasSelection"
        @click="editorStore.setViewModeOpen(!editorStore.isViewModeOpen)"
        class="group flex flex-col items-center justify-center gap-1 w-14 h-14 sm:w-16 sm:h-16 rounded-xl transition-all"
        :class="
          editorStore.isViewModeOpen
            ? 'bg-primary text-white shadow-lg shadow-primary/20'
            : 'hover:bg-muted text-muted-foreground'
        "
      >
        <component
          :is="editorStore.isViewModeOpen ? LucideEyeOff : LucideEye"
          :size="20"
          class="sm:w-6 sm:h-6"
        />
        <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight">View</span>
      </button>
    </div>
  </div>
</template>

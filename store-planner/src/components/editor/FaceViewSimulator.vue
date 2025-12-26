<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import { getTemplateById } from '@/data/fixtureTemplates'
import { Search as LucideSearch, X as LucideX } from 'lucide-vue-next'

const editorStore = useEditorStore()

const selectedFixture = computed(() => {
  if (!editorStore.selectedFixtureId || !editorStore.currentLayout) return null
  return (
    editorStore.currentLayout.fixtures.find((f) => f.id === editorStore.selectedFixtureId) || null
  )
})

const template = computed(() => {
  if (!selectedFixture.value) return null
  return getTemplateById(selectedFixture.value.templateId) || null
})

const baseScale = computed(() => {
  if (!selectedFixture.value) return 2.5
  const availableH = window.innerHeight * 0.7
  const fixtureH = selectedFixture.value.height3D || 200
  const scale = availableH / fixtureH
  return Math.min(scale, 5)
})

const widthPx = computed(() => (selectedFixture.value?.width || 100) * baseScale.value)
const heightPx = computed(() => (selectedFixture.value?.height3D || 200) * baseScale.value)

// Ensure levels are sorted by height for correct "stacking" logic
const levels = computed(() => {
  if (!selectedFixture.value?.contents?.levels) return []
  return [...selectedFixture.value.contents.levels].sort(
    (a, b) => (a.height || 0) - (b.height || 0),
  )
})

const getFixtureColor = computed(() => {
  return selectedFixture.value?.customColor || template.value?.color || '#8B7355'
})

const handleSpaceSelect = (id: string, e: Event) => {
  e.stopPropagation()
  // Toggle selection
  if (editorStore.selectedShelfLevelId === id) {
    editorStore.selectShelfLevel(null)
  } else {
    editorStore.selectShelfLevel(id)
  }
}

const closeView = () => {
  editorStore.setViewModeOpen(false)
}
</script>

<template>
  <div
    class="h-full w-full flex flex-col items-center justify-center p-12 overflow-hidden touch-none relative select-none"
    @click="editorStore.selectShelfLevel(null)"
  >
    <!-- Close Button -->
    <button
      @click="closeView"
      class="absolute top-4 left-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background border border-border shadow-sm transition-colors cursor-pointer"
    >
      <LucideX :size="20" class="text-foreground" />
    </button>

    <!-- Simulator Canvas Area -->
    <div
      v-if="selectedFixture && template"
      class="flex flex-col items-center gap-12 transition-all duration-300"
      @click.stop
    >
      <!-- Render Container -->
      <div class="relative group">
        <!-- 2D Fixture Render -->
        <div
          class="relative bg-background shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] rounded-sm border-t-8 border-x-4 border-black/5 transition-all duration-75 text-center"
          :style="{
            width: `${widthPx}px`,
            height: `${heightPx}px`,
            backgroundColor: getFixtureColor,
            borderColor: 'rgba(0,0,0,0.1)',
          }"
        >
          <!-- Metallic Gradient Overlay -->
          <div
            class="absolute inset-0 bg-linear-to-tr from-black/20 via-transparent to-white/10 pointer-events-none"
          ></div>

          <!-- Shelves Rendering -->
          <div class="absolute inset-0">
            <!-- Render spaces/gaps that are clickable -->
            <template v-for="(level, idx) in levels" :key="level.id">
              <!-- The actual Shelf Plate (Visual) matches 'height' (y-pos from bottom) -->
              <div
                class="absolute inset-x-0 h-1 bg-black/30 w-full z-10 pointer-events-none"
                :style="{ bottom: `${(level.height || 0) * baseScale}px` }"
              ></div>

              <!-- The Clickable 'Space' below this shelf -->
              <!-- Height is difference between this level and previous (or 0) -->
              <div
                class="absolute inset-x-0 w-full cursor-pointer transition-colors z-0 flex items-center justify-center hover:bg-white/10"
                :class="
                  editorStore.selectedShelfLevelId === level.id
                    ? 'bg-primary/20 ring-inset ring-2 ring-primary/50'
                    : ''
                "
                :style="{
                  bottom: idx === 0 ? '0px' : `${(levels[idx - 1]?.height || 0) * baseScale}px`,
                  height: `${((level.height || 0) - (idx === 0 ? 0 : levels[idx - 1]?.height || 0)) * baseScale}px`,
                }"
                @click="(e) => handleSpaceSelect(level.id, e)"
              >
                <!-- Selected Indicator (Optional) -->
                <div
                  v-if="editorStore.selectedShelfLevelId === level.id"
                  class="text-[10px] font-bold text-primary bg-background/80 px-2 py-0.5 rounded-full shadow-sm"
                >
                  {{
                    Math.round(
                      (level.height || 0) - (idx === 0 ? 0 : levels[idx - 1]?.height || 0),
                    )
                  }}cm Space
                </div>
              </div>
            </template>
          </div>

          <!-- Fridge Doors Simulation -->
          <div
            v-if="template.category === 'fridges'"
            class="absolute inset-0 flex border-4 border-black/10 pointer-events-none"
          >
            <div
              v-for="d in template.doors || 1"
              :key="d"
              class="flex-1 border-x border-white/20 bg-blue-400/5 backdrop-blur-[1px] relative group overflow-hidden"
            >
              <div
                class="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent opacity-30"
              ></div>
              <div
                class="absolute -inset-y-full inset-x-full bg-linear-to-r from-transparent via-white/5 to-transparent rotate-45 group-hover:translate-x-[-200%] transition-transform duration-1000"
              ></div>
              <div
                class="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-20 bg-zinc-400/50 rounded-full"
              ></div>
            </div>
          </div>
        </div>

        <!-- Floor / Base shadow -->
        <div
          class="h-4 bg-black/20 blur-xl rounded-full absolute -bottom-2 -left-[10%] -right-[10%] z-[-1]"
        ></div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex flex-col items-center justify-center text-center gap-6 opacity-30 px-12"
    >
      <div
        class="w-24 h-24 rounded-4xl border-4 border-dashed border-muted flex items-center justify-center animate-pulse"
      >
        <LucideSearch :size="40" class="text-muted-foreground" />
      </div>
      <div class="space-y-2">
        <h3 class="font-bold text-xl">Building Mode</h3>
        <p class="text-sm max-w-[200px] leading-relaxed">
          Select a fixture to view its structural elevation.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Clean styles */
</style>

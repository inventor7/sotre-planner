<script setup lang="ts">
import { ref, computed } from 'vue'
import { X as LucideX } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editorStore'
import { categoryLabels, getTemplatesByCategory } from '@/data/fixtureTemplates'
import type { FixtureCategory, FixtureTemplate } from '@/types/editor'
import FixtureSVG from './FixtureSVG.vue'
import { cn } from '@/lib/utils'

const categories: (FixtureCategory | 'all' | 'my-templates')[] = [
  'all',
  'my-templates',
  'shelves',
  'fridges',
  'checkout',
  'structures',
  'furniture',
]

const editorStore = useEditorStore()

const searchQuery = ref('')

const filteredTemplates = computed(() => {
  let templates: FixtureTemplate[] = []

  if (editorStore.libraryCategory === 'my-templates') {
    templates = editorStore.customTemplates
  } else {
    templates = getTemplatesByCategory(editorStore.libraryCategory)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    templates = templates.filter(
      (t) => t.name.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query),
    )
  }

  return templates
})

const handleSelectTemplate = (template: FixtureTemplate) => {
  if (!editorStore.currentLayout) return

  // Place in center of layout
  const x = (editorStore.currentLayout.width - template.width) / 2
  const y = (editorStore.currentLayout.height - template.height) / 2

  editorStore.addFixture(template.id, x, y)
}

// const handleSearchInput = (event: Event) => {
//   const target = event.target as HTMLInputElement
//   searchQuery.value = target.value
// }

const getPreviewScale = (template: FixtureTemplate) => {
  return Math.min(60 / template.width, 50 / template.height)
}
</script>

<template>
  <div v-if="editorStore.isLibraryOpen" class="absolute inset-0 z-50 bg-background flex flex-col">
    <!-- Header - compact on mobile -->
    <div class="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2">
      <h2 class="text-sm sm:text-lg font-semibold">Add an item</h2>
      <button
        @click="editorStore.closeLibrary"
        class="p-1.5 sm:p-2 hover:bg-muted rounded-full transition-colors"
      >
        <LucideX :size="20" class="sm:w-6 sm:h-6" />
      </button>
    </div>

    <!-- Search - compact on mobile -->
    <!-- <div class="px-3 sm:px-4 py-2 sm:py-2">
      <div class="flex items-center gap-2 sm:gap-3">
        <div class="flex-1 relative">
          <LucideSearch
            class="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-[18px] sm:h-[18px]"
          />
          <input
            type="text"
            placeholder="Search..."
            :value="searchQuery"
            @input="handleSearchInput"
            class="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2.5 rounded-full border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>
      </div>
    </div> -->

    <!-- Category tabs - horizontal scroll on mobile -->
    <div class="px-3 sm:px-4 py-2 sm:py-3 border-b border-border overflow-x-auto shrink-0">
      <div class="flex gap-1.5 sm:gap-2">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="editorStore.setLibraryCategory(cat)"
          :class="
            cn(
              'px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200',
              editorStore.libraryCategory === cat
                ? 'bg-foreground text-background'
                : 'bg-muted hover:bg-muted/80',
            )
          "
        >
          {{
            cat === 'my-templates' ? 'My Templates' : categoryLabels[cat as FixtureCategory | 'all']
          }}
        </button>
      </div>
    </div>

    <!-- Items grid - more columns on landscape mobile -->
    <div class="flex-1 overflow-y-auto p-2 sm:p-4">
      <div
        v-if="filteredTemplates.length === 0"
        class="text-center py-8 sm:py-12 text-muted-foreground text-sm"
      >
        No items found
      </div>
      <div
        v-else
        class="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-4"
      >
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          class="bg-background rounded-lg sm:rounded-xl border border-border p-2 sm:p-3 cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 group"
          @click="handleSelectTemplate(template)"
        >
          <!-- Preview -->
          <div
            class="h-14 sm:h-20 flex items-center justify-center mb-1.5 sm:mb-2 bg-muted/30 rounded-md sm:rounded-lg"
          >
            <svg
              :width="template.width * getPreviewScale(template)"
              :height="template.height * getPreviewScale(template)"
              :viewBox="`0 0 ${template.width} ${template.height}`"
            >
              <FixtureSVG
                :template="template"
                :width="template.width"
                :height="template.height"
                :scale="1 / getPreviewScale(template)"
              />
            </svg>
          </div>

          <!-- Name -->
          <h4 class="text-[10px] sm:text-xs font-medium text-center truncate">
            {{ template.name }}
          </h4>

          <!-- Dimensions -->
          <p class="text-[9px] sm:text-[10px] text-muted-foreground text-center">
            {{ template.width }} x {{ template.height }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight, Store } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editorStore'

interface PresetSize {
  name: string
  width: number
  height: number
}

const presetSizes: PresetSize[] = [
  { name: 'Small Store', width: 800, height: 600 },
  { name: 'Medium Store', width: 1200, height: 800 },
  { name: 'Large Store', width: 2000, height: 1200 },
  { name: 'Supermarket', width: 3000, height: 2000 },
]

interface Props {
  onComplete: () => void
}

const props = defineProps<Props>()

const editorStore = useEditorStore()

const storeName = ref('My Store')
const width = ref(1200)
const height = ref(800)
const activePreset = ref<number | null>(1)

const handlePresetSelect = (index: number) => {
  if (index >= 0 && index < presetSizes.length) {
    activePreset.value = index
    width.value = presetSizes[index]!.width
    height.value = presetSizes[index]!.height
  }
}

const handleCreate = () => {
  console.log('Creating layout with:', storeName.value, width.value, height.value)
  editorStore.createNewLayout(storeName.value, width.value, height.value)
  console.log('Layout created, calling onComplete')
  props.onComplete()
}

const handleLoadExisting = (id: string) => {
  editorStore.loadLayout(id)
  props.onComplete()
}
</script>

<template>
  <div
    class="min-h-screen bg-background flex items-start lg:items-center justify-center p-3 sm:p-6 overflow-y-auto"
  >
    <div class="max-w-2xl w-full py-4">
      <!-- Header - Compact on mobile -->
      <div class="text-center mb-4 sm:mb-8">
        <div
          class="inline-flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 mb-2 sm:mb-4"
        >
          <Store class="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
        </div>
        <h1 class="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">Store Layout Editor</h1>
        <p class="text-xs sm:text-base text-muted-foreground">
          Create a new store layout or continue editing
        </p>
      </div>

      <!-- Saved layouts -->
      <div v-if="editorStore.savedLayouts?.length > 0" class="mb-4 sm:mb-8">
        <h2
          class="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-muted-foreground uppercase tracking-wide"
        >
          Continue Editing
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <button
            v-for="layout in editorStore.savedLayouts"
            :key="layout.id"
            @click="handleLoadExisting(layout.id)"
            class="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border hover:border-primary hover:bg-muted/50 transition-all text-left group"
          >
            <div>
              <h3 class="font-medium text-sm sm:text-base">{{ layout.name }}</h3>
              <p class="text-xs sm:text-sm text-muted-foreground">
                {{ layout.width }} x {{ layout.height }} cm
              </p>
            </div>
            <ArrowRight
              class="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </button>
        </div>
      </div>

      <!-- Create new -->
      <div class="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6">
        <h2
          class="text-xs sm:text-sm font-semibold mb-3 sm:mb-4 text-muted-foreground uppercase tracking-wide"
        >
          Create New Layout
        </h2>

        <!-- Store name -->
        <div class="mb-4 sm:mb-6">
          <label class="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Store Name</label>
          <input
            v-model="storeName"
            type="text"
            class="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder="Enter store name"
          />
        </div>

        <!-- Preset sizes - 2 columns on mobile landscape -->
        <div class="mb-4 sm:mb-6">
          <label class="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Size Presets</label>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              v-for="(preset, index) in presetSizes"
              :key="preset.name"
              @click="handlePresetSelect(index)"
              :class="[
                'p-2 sm:p-3 rounded-lg sm:rounded-xl border text-center transition-all',
                activePreset === index
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50',
              ]"
            >
              <span class="block text-xs sm:text-sm font-medium">{{ preset.name }}</span>
              <span class="block text-[10px] sm:text-xs text-muted-foreground">
                {{ preset.width }} x {{ preset.height }}
              </span>
            </button>
          </div>
        </div>

        <!-- Custom dimensions -->
        <div class="mb-4 sm:mb-6">
          <label class="block text-xs sm:text-sm font-medium mb-1 sm:mb-2"
            >Custom Dimensions (cm)</label
          >
          <div class="flex gap-3 sm:gap-4">
            <div class="flex-1">
              <label class="block text-[10px] sm:text-xs text-muted-foreground mb-1">Width</label>
              <input
                v-model.number="width"
                type="number"
                @input="activePreset = null"
                class="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                :min="200"
                :max="10000"
              />
            </div>
            <div class="flex-1">
              <label class="block text-[10px] sm:text-xs text-muted-foreground mb-1">Height</label>
              <input
                v-model.number="height"
                type="number"
                @input="activePreset = null"
                class="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                :min="200"
                :max="10000"
              />
            </div>
          </div>
        </div>

        <!-- Preview - smaller on mobile -->
        <div class="mb-4 sm:mb-6">
          <label class="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Preview</label>
          <div
            class="bg-muted/30 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-center h-20 sm:h-32"
          >
            <div
              class="bg-background border-2 border-foreground/20 rounded"
              :style="{
                width: Math.min(150, (width / height) * 60) + 'px',
                height: Math.min(60, (height / width) * 150) + 'px',
              }"
            />
          </div>
          <p class="text-center text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
            {{ width }} x {{ height }} cm ({{ (width / 100).toFixed(1) }}m x
            {{ (height / 100).toFixed(1) }}m)
          </p>
        </div>

        <!-- Create button -->
        <button
          @click="handleCreate"
          class="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          Create Layout
          <ArrowRight class="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

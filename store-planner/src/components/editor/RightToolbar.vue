<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  X as LucideX,
  Save as LucideSave,
  Package as LucidePackage,
  Ruler as LucideRuler,
  Plus as LucidePlus,
  Minus as LucideMinus,
  ChevronDown as LucideChevronDown,
  ChevronUp as LucideChevronUp,
} from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editorStore'
import { getTemplateById } from '@/data/fixtureTemplates'
import type { PlacedFixture } from '@/types/editor'
import { cn } from '@/lib/utils'
import { toast } from 'vue-sonner'
import RotationDial from '../shared/RotationDial.vue'
import VerticalRuler from '../shared/VerticalRuler.vue'

interface Props {
  onExit: () => void
}

const props = defineProps<Props>()

const editorStore = useEditorStore()

const handleSave = () => {
  editorStore.saveCurrentLayout()
  toast.success('Layout saved successfully')
}

const selectedFixture = computed(() =>
  editorStore.currentLayout?.fixtures?.find((f) => f.id === editorStore.selectedFixtureId),
)
const selectedWall = computed(() =>
  editorStore.currentLayout?.walls?.find((w) => w.id === editorStore.selectedWallId),
)
const selectedNode = computed(() =>
  editorStore.currentLayout?.nodes?.find((n) => n.id === editorStore.selectedNodeId),
)
const template = computed(() =>
  selectedFixture.value ? getTemplateById(selectedFixture.value.templateId) : null,
)

const hasSelection = computed(
  () => !!selectedFixture.value || !!selectedWall.value || !!selectedNode.value,
)
const hasShelfContents = computed(() => selectedFixture.value?.contents?.levels)

const selectedShelfLevelId = computed(() => editorStore.selectedShelfLevelId)
const selectedShelfLevel = computed(() => {
  if (!selectedFixture.value?.contents?.levels || !selectedShelfLevelId.value) return null
  return selectedFixture.value.contents.levels.find((l) => l.id === selectedShelfLevelId.value)
})

const handleShelfHeightUpdate = (val: number) => {
  if (!selectedFixture.value || !selectedShelfLevelId.value || !selectedFixture.value.contents)
    return

  const levels = [...selectedFixture.value.contents.levels].sort((a, b) => a.height - b.height)
  const currentIndex = levels.findIndex((l) => l.id === selectedShelfLevelId.value)
  if (currentIndex === -1) return

  const prevHeight = currentIndex > 0 ? levels[currentIndex - 1]?.height || 0 : 0
  const nextHeight =
    currentIndex < levels.length - 1
      ? levels?.[currentIndex + 1]?.height || 0
      : selectedFixture.value.height3D || 200

  // Constraints
  const minSpacing = 10 // Minimum clear space 10cm
  const thickness = 2 // Shelf thickness 2cm

  const minAllowed = prevHeight + minSpacing + thickness
  const maxAllowed = nextHeight - minSpacing - thickness

  // Clamp value
  const newHeight = Math.max(minAllowed, Math.min(maxAllowed, val))

  const newLevels = levels.map((l) => {
    if (l.id === selectedShelfLevelId.value) return { ...l, height: newHeight }
    return l
  })

  editorStore.updateFixtureContents(selectedFixture.value.id, { levels: newLevels })
}

const colorPresets = [
  '#8B7355',
  '#A0522D',
  '#CD853F',
  '#DEB887',
  '#B0C4DE',
  '#87CEEB',
  '#4682B4',
  '#708090',
  '#696969',
  '#4A4A4A',
  '#2F2F2F',
  '#1A1A1A',
  '#C0C0C0',
  '#E8E8E8',
  '#FFFFFF',
  '#FFD700',
]

const handleColorChange = (color: string) => {
  if (editorStore.selectedFixtureId) {
    editorStore.updateFixture(editorStore.selectedFixtureId, { customColor: color })
  }
}

const handleWallThicknessChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const num = parseInt(target.value)
  if (!isNaN(num) && num > 0 && editorStore.selectedWallId) {
    editorStore.updateWall(editorStore.selectedWallId, { thickness: num })
  }
}

const handleDoorSwingChange = (value: string) => {
  if (editorStore.selectedWallId) {
    editorStore.updateWall(editorStore.selectedWallId, {
      doorSwing: value as 'left' | 'right' | 'sliding',
    })
  }
}

const handleNodeXChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const num = parseInt(target.value)
  if (!isNaN(num) && editorStore.selectedNodeId) {
    editorStore.updateNode(editorStore.selectedNodeId, { x: num })
  }
}

const handleNodeYChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const num = parseInt(target.value)
  if (!isNaN(num) && editorStore.selectedNodeId) {
    editorStore.updateNode(editorStore.selectedNodeId, { y: num })
  }
}

const handleShelfRowsChange = (delta: number) => {
  if (!selectedFixture.value?.contents || !editorStore.selectedFixtureId) return

  const currentLevels = [...selectedFixture.value.contents.levels].sort(
    (a, b) => (a.height || 0) - (b.height || 0),
  )
  const totalHeight = selectedFixture.value.height3D || 200

  let newLevels = []

  if (delta > 0) {
    if (currentLevels.length >= 10) return

    // Add logic: Redistribute
    const newCount = currentLevels.length + 1
    const spacing = totalHeight / (newCount + 1)

    const newLevel = {
      id: Math.random().toString(36).substr(2, 9),
      slots: [
        {
          id: Math.random().toString(36).substr(2, 9),
          productId: null,
          facings: 1,
          priceLabel: false,
        },
      ],
      height: 0, // Will be set below
    }

    // Append to end
    newLevels = [...currentLevels, newLevel]

    // Redistribute
    newLevels = newLevels.map((l, index) => ({
      ...l,
      height: Math.round((index + 1) * spacing),
    }))
  } else {
    if (currentLevels.length <= 1) return

    // Remove last one (top-most)
    newLevels = currentLevels.slice(0, -1)

    // Redistribute remaining to fill space
    const newCount = newLevels.length
    const spacing = totalHeight / (newCount + 1)
    newLevels = newLevels.map((l, index) => ({
      ...l,
      height: Math.round((index + 1) * spacing),
    }))
  }

  editorStore.updateFixtureContents(selectedFixture.value.id, { levels: newLevels })
}

const handleUpdate = (id: string, updates: Partial<PlacedFixture>) => {
  editorStore.updateFixture(id, updates)
}

const handleRotate = (id: string | undefined, value: number) => {
  if (!id) return
  editorStore.updateFixture(id, { rotation: value })
}

const handleSaveTemplate = () => {
  if (!selectedFixture.value) return
  const name = window.prompt('Enter a name for this template:', 'My Custom Fixture')
  if (name) {
    editorStore.saveCustomTemplate(selectedFixture.value, name)
    toast.success('Template saved to library')
  }
}

const isExpanded = ref(true)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="fixed right-0 top-0 bottom-0 z-50 pointer-events-none">
    <!-- Action Sidebar (Save/Exit) - Shown when nothing is selected -->
    <Transition name="slide-right" :appear="false">
      <div
        v-if="!hasSelection"
        class="absolute right-0 top-0 bottom-0 w-16 sm:w-20 bg-background/95 backdrop-blur-sm border-l border-border flex flex-col items-center py-4 gap-4 overflow-y-auto pointer-events-auto shadow-xl"
      >
        <button
          @click="handleSave"
          class="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-all text-primary"
          title="Save Layout"
        >
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LucideSave :size="20" />
          </div>
          <span class="text-[10px] font-bold uppercase tracking-tight">Save</span>
        </button>

        <button
          @click="props.onExit"
          class="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
          title="Exit Editor"
        >
          <div class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <LucideX :size="20" />
          </div>
          <span class="text-[10px] font-bold uppercase tracking-tight">Exit</span>
        </button>
      </div>
    </Transition>

    <!-- Property Sidebar - Shown when an item is selected -->
    <Transition name="slide-side">
      <div
        v-if="hasSelection"
        class="absolute right-0 top-0 bottom-0 w-64 sm:w-72 bg-background/95 rounded-2xl backdrop-blur-md border-l border-border flex flex-col shadow-2xl overflow-hidden pointer-events-auto"
        :class="{ 'h-fit': !isExpanded }"
      >
        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto p-2 space-y-6">
          <!-- Selection Header / Accordion Trigger -->
          <div
            @click="toggleExpanded"
            class="flex items-center justify-between cursor-pointer group"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"
              >
                <LucidePackage v-if="selectedFixture" :size="18" />
                <LucideRuler v-else :size="18" />
              </div>
              <div>
                <h3 class="text-sm font-bold leading-none">
                  {{ selectedFixture ? template?.name : selectedWall ? 'Wall' : 'Wall Node' }}
                </h3>
                <p
                  v-if="selectedFixture"
                  class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1"
                >
                  {{ selectedFixture.width }}w × {{ selectedFixture.height3D || 0 }}h cm
                </p>
              </div>
            </div>
            <component
              :is="isExpanded ? LucideChevronUp : LucideChevronDown"
              :size="18"
              class="text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>

          <div v-if="isExpanded" class="space-y-6 animate-in slide-in-from-top-2 duration-300">
            <!-- Fixture Properties -->
            <div v-if="selectedFixture && template" class="space-y-6">
              <!-- Dimensions Grid -->
              <div class="grid grid-cols-3 gap-3">
                <!-- Width -->
                <div
                  class="flex flex-col items-center gap-2"
                  :class="{ 'opacity-30 pointer-events-none': selectedShelfLevelId }"
                >
                  <div class="relative w-full">
                    <input
                      type="number"
                      :value="selectedFixture.width"
                      @input="
                        (e) =>
                          selectedFixture &&
                          handleUpdate(selectedFixture.id, {
                            width: parseInt((e.target as HTMLInputElement).value) || 0,
                          })
                      "
                      class="w-full h-9 bg-muted/50 border border-border rounded-lg text-xs font-bold text-center outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all tabular-nums"
                    />
                    <span
                      class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground uppercase pointer-events-none"
                      >w</span
                    >
                  </div>
                  <VerticalRuler
                    :model-value="selectedFixture.width"
                    @update:model-value="
                      (val: number) =>
                        selectedFixture && handleUpdate(selectedFixture.id, { width: val })
                    "
                    :min="10"
                    :max="1000"
                  />
                  <span class="text-[8px] font-bold text-muted-foreground uppercase tracking-widest"
                    >Width</span
                  >
                </div>

                <!-- Depth -->
                <div
                  class="flex flex-col items-center gap-2"
                  :class="{ 'opacity-30 pointer-events-none': selectedShelfLevelId }"
                >
                  <div class="relative w-full">
                    <input
                      type="number"
                      :value="selectedFixture.height"
                      @input="
                        (e) =>
                          selectedFixture &&
                          handleUpdate(selectedFixture.id, {
                            height: parseInt((e.target as HTMLInputElement).value) || 0,
                          })
                      "
                      class="w-full h-9 bg-muted/50 border border-border rounded-lg text-xs font-bold text-center outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all tabular-nums"
                    />
                    <span
                      class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground uppercase pointer-events-none"
                      >d</span
                    >
                  </div>
                  <VerticalRuler
                    :model-value="selectedFixture.height"
                    @update:model-value="
                      (val: number) =>
                        selectedFixture && handleUpdate(selectedFixture.id, { height: val })
                    "
                    :min="10"
                    :max="1000"
                  />
                  <span class="text-[8px] font-bold text-muted-foreground uppercase tracking-widest"
                    >Depth</span
                  >
                </div>

                <!-- Height -->
                <div class="flex flex-col items-center gap-2">
                  <div class="relative w-full">
                    <input
                      type="number"
                      :value="
                        selectedShelfLevelId
                          ? Math.round(selectedShelfLevel?.height || 0)
                          : selectedFixture.height3D
                      "
                      @input="
                        (e) => {
                          const val = parseInt((e.target as HTMLInputElement).value) || 0
                          if (selectedShelfLevelId) handleShelfHeightUpdate(val)
                          else
                            selectedFixture && handleUpdate(selectedFixture.id, { height3D: val })
                        }
                      "
                      class="w-full h-9 bg-muted/50 border border-border rounded-lg text-xs font-bold text-center outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all tabular-nums"
                    />
                    <span
                      class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground uppercase pointer-events-none"
                      >h</span
                    >
                  </div>
                  <VerticalRuler
                    :model-value="
                      selectedShelfLevelId
                        ? selectedShelfLevel?.height || 0
                        : selectedFixture.height3D
                    "
                    @update:model-value="
                      (val: number) => {
                        if (selectedShelfLevelId) handleShelfHeightUpdate(val)
                        else selectedFixture && handleUpdate(selectedFixture.id, { height3D: val })
                      }
                    "
                    :min="selectedShelfLevelId ? 0 : 10"
                    :max="selectedShelfLevelId ? selectedFixture.height3D || 300 : 300"
                  />
                  <span
                    class="text-[8px] font-bold text-muted-foreground uppercase tracking-widest"
                    >{{ selectedShelfLevelId ? 'Level Y' : 'Height' }}</span
                  >
                </div>
              </div>

              <!-- Rotation Dial -->
              <div class="space-y-2">
                <RotationDial
                  :model-value="selectedFixture.rotation"
                  @update:model-value="(val: number) => handleRotate(selectedFixture?.id, val)"
                />
              </div>

              <!-- Shelf Controls -->
              <div
                v-if="hasShelfContents"
                class="p-3 rounded-xl bg-muted/30 border border-border/50"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >Shelf Levels</span
                  >
                  <span
                    class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold"
                  >
                    {{ selectedFixture.contents!.levels.length }} Rows
                  </span>
                </div>
                <div class="flex gap-2">
                  <button
                    class="flex-1 h-9 rounded-lg border border-border hover:bg-background flex items-center justify-center transition-colors disabled:opacity-40"
                    @click="handleShelfRowsChange(-1)"
                    :disabled="selectedFixture.contents!.levels.length <= 1"
                  >
                    <LucideMinus :size="14" />
                  </button>
                  <button
                    class="flex-1 h-9 rounded-lg border border-border hover:bg-background flex items-center justify-center transition-colors disabled:opacity-40"
                    @click="handleShelfRowsChange(1)"
                    :disabled="selectedFixture.contents!.levels.length >= 10"
                  >
                    <LucidePlus :size="14" />
                  </button>
                </div>
              </div>

              <!-- Color Palette -->
              <div class="space-y-2">
                <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                  >Appearance</label
                >
                <div class="grid grid-cols-5 gap-2">
                  <button
                    v-for="color in colorPresets"
                    :key="color"
                    @click="handleColorChange(color)"
                    :class="
                      cn(
                        'aspect-square rounded-lg border-2 transition-all relative group',
                        (selectedFixture.customColor || template.color) === color
                          ? 'border-primary shadow-md scale-105'
                          : 'border-transparent hover:border-border',
                      )
                    "
                    :style="{ backgroundColor: color }"
                  >
                    <div
                      v-if="(selectedFixture.customColor || template.color) === color"
                      class="absolute inset-0 flex items-center justify-center"
                    >
                      <div class="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                    </div>
                  </button>
                </div>
              </div>

              <div class="pt-4 border-t border-border">
                <button
                  @click="handleSaveTemplate"
                  class="w-full h-9 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LucideSave :size="14" />
                  Save as Template
                </button>
              </div>
            </div>

            <!-- Wall Properties -->
            <div v-if="selectedWall" class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                  >Thickness (cm)</label
                >
                <input
                  type="number"
                  :value="selectedWall.thickness"
                  @input="handleWallThicknessChange"
                  class="h-10 w-full px-3 rounded-lg border border-border bg-background outline-none text-sm"
                />
              </div>
              <div v-if="selectedWall.type === 'door'" class="space-y-1.5">
                <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                  >Door Swing</label
                >
                <select
                  :value="selectedWall.doorSwing || 'left'"
                  @change="(e) => handleDoorSwingChange((e.target as HTMLSelectElement).value)"
                  class="h-10 w-full px-3 rounded-lg border border-border bg-background outline-none text-sm appearance-none"
                >
                  <option value="left">Left Swing</option>
                  <option value="right">Right Swing</option>
                  <option value="sliding">Sliding</option>
                </select>
              </div>
            </div>

            <!-- Node Properties -->
            <div v-if="selectedNode" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label
                    class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                    >Position X</label
                  >
                  <input
                    type="number"
                    :value="Math.round(selectedNode.x)"
                    @input="handleNodeXChange"
                    class="h-10 w-full px-3 rounded-lg border border-border bg-background outline-none text-sm"
                  />
                </div>
                <div class="space-y-1.5">
                  <label
                    class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
                    >Position Y</label
                  >
                  <input
                    type="number"
                    :value="Math.round(selectedNode.y)"
                    @input="handleNodeYChange"
                    class="h-10 w-full px-3 rounded-lg border border-border bg-background outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-side-enter-active,
.slide-side-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.3s ease;
}

.slide-side-enter-from,
.slide-side-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  X as LucideX,
  Plus as LucidePlus,
  Minus as LucideMinus,
  Tag as LucideTag,
  Package as LucidePackage,
  Trash2 as LucideTrash2,
} from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editorStore'
import { getTemplateById } from '@/data/fixtureTemplates'
import { sampleProducts, productCategories, getProductById } from '@/data/products'
import { cn } from '@/lib/utils'

const editorStore = useEditorStore()

const selectedCategory = ref('all')
const searchQuery = ref('')
const activeSlot = ref<{ level: number; slot: number } | null>(null)

const fixture = computed(() =>
  editorStore.currentLayout?.fixtures.find((f) => f.id === editorStore.editingFixtureId),
)
const template = computed(() => (fixture.value ? getTemplateById(fixture.value.templateId) : null))

const contents = computed(() => fixture.value?.contents)

const filteredProducts = computed(() => {
  const products = sampleProducts.filter((p) => {
    const matchesCategory =
      selectedCategory.value === 'all' || p.category === selectedCategory.value
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return products
})

const handleProductSelect = (productId: string | null) => {
  if (activeSlot.value && editorStore.editingFixtureId) {
    editorStore.updateShelfSlot(
      editorStore.editingFixtureId,
      activeSlot.value.level,
      activeSlot.value.slot,
      { productId },
    )
    activeSlot.value = null
  }
}

const handleTogglePriceLabel = (levelIndex: number, slotIndex: number) => {
  if (editorStore.editingFixtureId && contents.value) {
    const slot = contents.value.levels[levelIndex]?.slots[slotIndex]
    if (slot) {
      editorStore.updateShelfSlot(editorStore.editingFixtureId, levelIndex, slotIndex, {
        priceLabel: !slot.priceLabel,
      })
    }
  }
}

const handleFacingsChange = (levelIndex: number, slotIndex: number, delta: number) => {
  if (editorStore.editingFixtureId && contents.value) {
    const slot = contents.value.levels[levelIndex]?.slots[slotIndex]
    if (slot) {
      const newFacings = Math.max(1, Math.min(10, slot.facings + delta))
      editorStore.updateShelfSlot(editorStore.editingFixtureId, levelIndex, slotIndex, {
        facings: newFacings,
      })
    }
  }
}
</script>

<template>
  <div
    v-if="editorStore.isProductEditorOpen && fixture && template && contents"
    class="fixed inset-0 z-50 bg-background"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <LucidePackage :size="20" />
          {{ template.name }} - Product Editor
        </h2>
        <button
          @click="editorStore.closeProductEditor"
          class="p-1.5 hover:bg-muted rounded-full transition-colors"
        >
          <LucideX :size="20" />
        </button>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <!-- Shelf visualization -->
        <div class="flex-1 p-4 overflow-y-auto">
          <div class="space-y-2">
            <div v-for="(level, levelIndex) in contents.levels" :key="level.id">
              <div class="relative">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium text-muted-foreground">
                    Level {{ contents.levels.length - levelIndex }}
                  </span>
                  <button
                    class="h-6 w-6 p-0 border rounded flex items-center justify-center hover:bg-muted"
                    @click="
                      editorStore.editingFixtureId &&
                      editorStore.addShelfSlot(editorStore.editingFixtureId, levelIndex)
                    "
                  >
                    <LucidePlus :size="14" />
                  </button>
                </div>

                <!-- Shelf bar -->
                <div class="bg-amber-800 h-2 w-full rounded-sm shadow-md" />

                <!-- Slots container -->
                <div class="flex gap-1 min-h-[80px] bg-muted/30 rounded-b p-2">
                  <div
                    v-for="(slot, slotIndex) in level.slots"
                    :key="slot.id"
                    @click="activeSlot = { level: levelIndex, slot: slotIndex }"
                    :class="
                      cn(
                        'relative flex-1 min-w-[60px] max-w-[120px] h-[70px] rounded border-2 cursor-pointer transition-all',
                        activeSlot?.level === levelIndex && activeSlot?.slot === slotIndex
                          ? 'border-primary bg-primary/10'
                          : slot.productId
                            ? 'border-border bg-background hover:border-primary/50'
                            : 'border-dashed border-muted-foreground/30 hover:border-muted-foreground',
                      )
                    "
                  >
                    <div v-if="slot.productId" class="p-1 h-full flex flex-col">
                      <!-- Product visualization -->
                      <div
                        class="flex-1 rounded flex items-center justify-center text-[10px] font-medium text-white"
                        :style="{ backgroundColor: getProductById(slot.productId)?.color }"
                      >
                        x{{ slot.facings }}
                      </div>
                      <div class="text-[8px] truncate mt-1 text-center">
                        {{ getProductById(slot.productId)?.name }}
                      </div>
                      <div
                        v-if="slot.priceLabel"
                        class="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[8px] px-1 rounded"
                      >
                        ${{ getProductById(slot.productId)?.price.toFixed(2) }}
                      </div>
                    </div>
                    <div
                      v-else
                      class="h-full flex items-center justify-center text-muted-foreground/50"
                    >
                      <LucidePlus :size="20" />
                    </div>

                    <!-- Slot controls -->
                    <div
                      v-if="activeSlot?.level === levelIndex && activeSlot?.slot === slotIndex"
                      class="absolute -top-2 -right-2 flex gap-1"
                    >
                      <button
                        @click.stop="handleTogglePriceLabel(levelIndex, slotIndex)"
                        :class="
                          cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-white',
                            slot.priceLabel ? 'bg-yellow-500' : 'bg-muted-foreground',
                          )
                        "
                      >
                        <LucideTag :size="10" />
                      </button>
                      <button
                        v-if="level.slots.length > 1"
                        @click.stop="
                          () => {
                            if (editorStore.editingFixtureId) {
                              editorStore.removeShelfSlot(
                                editorStore.editingFixtureId,
                                levelIndex,
                                slotIndex,
                              )
                            }
                            activeSlot = null
                          }
                        "
                        class="w-5 h-5 rounded-full bg-destructive flex items-center justify-center text-white"
                      >
                        <LucideTrash2 :size="10" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Product selection panel -->
        <div class="w-72 flex flex-col bg-muted/20">
          <div class="p-3 border-b space-y-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search products..."
              class="w-full px-3 py-2 rounded-full border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />

            <div class="flex gap-1 overflow-x-auto">
              <button
                @click="selectedCategory = 'all'"
                :class="
                  cn(
                    'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                    selectedCategory === 'all'
                      ? 'bg-foreground text-background'
                      : 'bg-muted hover:bg-muted/80',
                  )
                "
              >
                All
              </button>
              <button
                v-for="cat in productCategories"
                :key="cat"
                @click="selectedCategory = cat"
                :class="
                  cn(
                    'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                    selectedCategory === cat
                      ? 'bg-foreground text-background'
                      : 'bg-muted hover:bg-muted/80',
                  )
                "
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div class="p-2 space-y-1">
              <!-- Empty space option -->
              <button
                @click="handleProductSelect(null)"
                :disabled="!activeSlot"
                :class="
                  cn(
                    'w-full p-2 rounded border border-dashed flex items-center gap-2 transition-colors',
                    activeSlot
                      ? 'border-muted-foreground/50 hover:bg-muted cursor-pointer'
                      : 'opacity-50 cursor-not-allowed',
                  )
                "
              >
                <div class="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <LucideX :size="16" class="text-muted-foreground" />
                </div>
                <div class="text-left">
                  <div class="text-xs font-medium">Empty Space</div>
                  <div class="text-[10px] text-muted-foreground">Remove product</div>
                </div>
              </button>

              <button
                v-for="product in filteredProducts"
                :key="product.id"
                @click="handleProductSelect(product.id)"
                :disabled="!activeSlot"
                :class="
                  cn(
                    'w-full p-2 rounded border flex items-center gap-2 transition-colors',
                    activeSlot
                      ? 'border-border hover:bg-muted cursor-pointer'
                      : 'opacity-50 cursor-not-allowed',
                  )
                "
              >
                <div
                  class="w-8 h-8 rounded flex items-center justify-center text-white text-[10px] font-bold"
                  :style="{ backgroundColor: product.color }"
                >
                  {{ product.name.charAt(0) }}
                </div>
                <div class="text-left flex-1 min-w-0">
                  <div class="text-xs font-medium truncate">{{ product.name }}</div>
                  <div class="text-[10px] text-muted-foreground flex justify-between">
                    <span>{{ product.sku }}</span>
                    <span class="font-medium">${{ product.price.toFixed(2) }}</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Facings control when slot selected -->
          <div
            v-if="
              activeSlot && contents.levels[activeSlot.level]?.slots[activeSlot.slot]?.productId
            "
            class="p-3 border-t bg-background"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium">Facings</span>
              <div class="flex items-center gap-2">
                <button
                  class="h-7 w-7 p-0 border rounded flex items-center justify-center hover:bg-muted"
                  @click="handleFacingsChange(activeSlot.level, activeSlot.slot, -1)"
                >
                  <LucideMinus :size="14" />
                </button>
                <span class="text-sm font-medium w-6 text-center">
                  {{ contents.levels[activeSlot.level]?.slots[activeSlot.slot]?.facings }}
                </span>
                <button
                  class="h-7 w-7 p-0 border rounded flex items-center justify-center hover:bg-muted"
                  @click="handleFacingsChange(activeSlot.level, activeSlot.slot, 1)"
                >
                  <LucidePlus :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

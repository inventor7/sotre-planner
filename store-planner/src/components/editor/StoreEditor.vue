<script setup lang="ts">
import { ref, watch } from 'vue'
import StoreSetup from './StoreSetup.vue'
import EditorCanvas from './EditorCanvas.vue'
import LeftToolbar from './LeftToolbar.vue'
import RightToolbar from './RightToolbar.vue'
import StructureToolbar from './StructureToolbar.vue'
import ItemLibrary from './ItemLibrary.vue'
import ProductEditor from './ProductEditor.vue'
import OrientationOverlay from './OrientationOverlay.vue'
import { useEditorStore } from '@/stores/editorStore'

const editorStore = useEditorStore()

const showSetup = ref(true)

const handleCompleteSetup = () => {
  showSetup.value = false
}

const handleExit = () => {
  editorStore.saveCurrentLayout()
  showSetup.value = true
}

// Watch for currentLayout changes from the store
watch(
  () => editorStore.currentLayout,
  (newValue) => {
    showSetup.value = !newValue
  },
  { immediate: true },
)
</script>

<template>
  <!-- Setup screen -->
  <StoreSetup v-if="showSetup || !editorStore.currentLayout" :on-complete="handleCompleteSetup" />

  <!-- Main editor -->
  <div v-else class="h-dvh w-screen overflow-hidden bg-black/10 relative touch-none">
    <OrientationOverlay />
    <!-- Main canvas -->
    <EditorCanvas class="absolute inset-0 z-0" />

    <!-- Toolbars -->
    <LeftToolbar />
    <RightToolbar :on-exit="handleExit" />
    <StructureToolbar />

    <!-- Item library modal -->
    <ItemLibrary />

    <!-- Product editor modal -->
    <ProductEditor v-if="editorStore.isProductEditorOpen" />

    <!-- Layout name indicator -->
    <div class="absolute top-1 left-1/2 -translate-x-1/2 z-30">
      <div
        class="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border shadow-sm flex items-center gap-2"
      >
        <span
          v-if="editorStore.currentLayout"
          class="text-[10px] font-bold uppercase tracking-wider text-primary"
          >{{ editorStore.currentLayout.name }}</span
        >
        <div class="w-px h-3 bg-border" />
        <span
          v-if="editorStore.currentLayout"
          class="text-[10px] text-muted-foreground font-medium"
        >
          {{ editorStore.currentLayout.width }} x {{ editorStore.currentLayout.height }} cm
        </span>
      </div>
    </div>
  </div>
</template>

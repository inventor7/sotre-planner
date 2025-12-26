<script setup lang="ts">
import { ref, watch } from 'vue'
import StoreSetup from './StoreSetup.vue'
import EditorCanvas from './EditorCanvas.vue'
import LeftToolbar from './LeftToolbar.vue'
import RightToolbar from './RightToolbar.vue'
import StructureToolbar from './StructureToolbar.vue'
import ItemLibrary from './ItemLibrary.vue'
import ProductEditor from './ProductEditor.vue'
import FaceViewSimulator from './FaceViewSimulator.vue'
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
  <div v-else class="h-dvh w-screen overflow-hidden bg-black/10 relative flex touch-none">
    <OrientationOverlay />

    <!-- Left Side Panel Area -->
    <div class="relative h-full flex shrink-0 z-50">
      <!-- Standard Left Toolstrip -->
      <Transition
        name="slide-left-strip"
        enter-active-class="transition-transform duration-500 ease-in-out"
        leave-active-class="transition-transform duration-500 ease-in-out"
        enter-from-class="-translate-x-full"
        leave-to-class="-translate-x-full"
      >
        <LeftToolbar v-if="!editorStore.isViewModeOpen" />
      </Transition>
    </div>

    <!-- Main Workspace Area -->
    <div class="flex-1 relative h-full flex overflow-hidden">
      <!-- Canvas Area + Toolbars (Always visible relative to full space) -->
      <div class="flex-1 relative h-full flex">
        <!-- Main canvas -->
        <EditorCanvas class="flex-1" />

        <!-- Canvas Toolbars -->
        <StructureToolbar />

        <!-- Realistic Face View Overlay -->
        <Transition
          enter-active-class="transition-opacity duration-300"
          leave-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div
            v-if="editorStore.isViewModeOpen"
            class="absolute inset-0 md:pr-72 bg-background/95 backdrop-blur-sm z-20 flex items-center justify-center"
          >
            <FaceViewSimulator />
          </div>
        </Transition>
      </div>

      <!-- Right Toolbar (Always there, but handles internal selection) -->
      <RightToolbar :on-exit="handleExit" />

      <div
        v-if="!editorStore.isViewModeOpen"
        class="absolute top-1 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-300"
      >
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

    <!-- Modals -->
    <ItemLibrary />
    <ProductEditor v-if="editorStore.isProductEditorOpen" />
  </div>
</template>

<style>
/* Global transition classes if needed, but using tailwind classes in Component */
</style>

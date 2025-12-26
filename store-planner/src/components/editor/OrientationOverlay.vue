<script setup lang="ts">
import { useScreenOrientation } from '@vueuse/core'
import { computed } from 'vue'
import { RefreshCw as LucideRotate } from 'lucide-vue-next'

const { orientation } = useScreenOrientation()
const isPortrait = computed(() => orientation.value?.startsWith('portrait'))
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isPortrait"
      class="fixed inset-0 z-100 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
    >
      <div
        class="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 animate-bounce"
      >
        <LucideRotate :size="32" class="text-primary" />
      </div>
      <h2 class="text-xl font-bold mb-2">Rotate Your Device</h2>
      <p class="text-muted-foreground max-w-[250px]">
        For the best experience, please rotate your device to landscape mode.
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

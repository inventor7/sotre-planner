<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import DraggableFixture from './DraggableFixture.vue'
import WallRenderer from './WallRenderer.vue'

// Define types
type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | null

const editorStore = useEditorStore()

const svgRef = ref<SVGSVGElement | null>(null)

const isDragging = ref(false)
const isPanning = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const resizeHandle = ref<ResizeHandle>(null)
const dragStart = ref({ x: 0, y: 0 })
const lastPointerPos = ref({ x: 0, y: 0 })
const dragFixtureId = ref<string | null>(null)
const dragNodeId = ref<string | null>(null)
const mousePos = ref({ x: 0, y: 0 })
const resizeStartDimensions = ref({ width: 0, height: 0, x: 0, y: 0 })

// Multi-touch tracking
const activePointers = ref(new Map<number, { x: number; y: number }>())
const lastPinchDistance = ref<number | null>(null)
const lastPinchCenter = ref<{ x: number; y: number } | null>(null)

const viewBoxPadding = 100
const viewBoxWidth = computed(() => (editorStore.currentLayout?.width || 0) + viewBoxPadding * 2)
const viewBoxHeight = computed(() => (editorStore.currentLayout?.height || 0) + viewBoxPadding * 2)

const nodes = computed(() => editorStore.currentLayout?.nodes || [])
const walls = computed(() => editorStore.currentLayout?.walls || [])
const fixtures = computed(() => editorStore.currentLayout?.fixtures || [])

const isDrawingMode = computed(() => {
  return (
    editorStore.activeTool === 'drawWall' ||
    editorStore.activeTool === 'drawDoor' ||
    editorStore.activeTool === 'drawWindow'
  )
})

// Convert screen coordinates to canvas coordinates
const screenToCanvas = (screenX: number, screenY: number) => {
  if (!svgRef.value) return { x: 0, y: 0 }
  const rect = svgRef.value.getBoundingClientRect()

  // Account for zoom transform
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  // Adjust for zoom scaling from center
  const adjustedScreenX =
    centerX +
    (screenX - rect.left - centerX) / editorStore.zoom -
    editorStore.panOffset.x / editorStore.zoom
  const adjustedScreenY =
    centerY +
    (screenY - rect.top - centerY) / editorStore.zoom -
    editorStore.panOffset.y / editorStore.zoom

  // Calculate the scale factor from SVG viewBox to screen
  const scaleX = viewBoxWidth.value / rect.width
  const scaleY = viewBoxHeight.value / rect.height
  const scale = Math.min(scaleX, scaleY)

  // Calculate offset for centered viewBox
  const offsetX = (rect.width - viewBoxWidth.value / scale) / 2
  const offsetY = (rect.height - viewBoxHeight.value / scale) / 2

  return {
    x: (adjustedScreenX - offsetX) * scale - viewBoxPadding,
    y: (adjustedScreenY - offsetY) * scale - viewBoxPadding,
  }
}

const getPointerPos = (e: PointerEvent | MouseEvent | TouchEvent) => {
  if ('clientX' in e) {
    return { x: e.clientX, y: e.clientY }
  }
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY }
  }
  return { x: 0, y: 0 }
}

const handleCanvasClick = (e: MouseEvent) => {
  const canvasPos = screenToCanvas(e.clientX, e.clientY)

  // Snap to grid
  const gridSize = 10
  const snappedX = Math.round(canvasPos.x / gridSize) * gridSize
  const snappedY = Math.round(canvasPos.y / gridSize) * gridSize

  if (isDrawingMode.value) {
    // Check for nearby existing node
    const nearbyNode = editorStore.findNearbyNode(snappedX, snappedY, 25)

    if (editorStore.isDrawingWall) {
      // Finish drawing
      if (nearbyNode) {
        editorStore.finishDrawingWall(nearbyNode.id)
      } else {
        const newNodeId = editorStore.addNode(snappedX, snappedY)
        editorStore.finishDrawingWall(newNodeId)
      }
    } else {
      // Start drawing
      if (nearbyNode) {
        editorStore.startDrawingWall(nearbyNode.id)
      } else {
        const newNodeId = editorStore.addNode(snappedX, snappedY)
        editorStore.startDrawingWall(newNodeId)
      }
    }
    return
  }

  // Normal selection mode
  const target = e.target as Element
  if (
    target === svgRef.value ||
    target.classList.contains('floor') ||
    target.classList.contains('canvas-bg')
  ) {
    editorStore.selectFixture(null)
    editorStore.selectWall(null)
    editorStore.selectNode(null)
    if (editorStore.isViewModeOpen) {
      editorStore.setViewModeOpen(false)
    }
  }
}

const handleNodeClick = (e: MouseEvent, nodeId: string) => {
  e.stopPropagation()

  if (isDrawingMode.value) {
    if (editorStore.isDrawingWall) {
      editorStore.finishDrawingWall(nodeId)
    } else {
      editorStore.startDrawingWall(nodeId)
    }
    return
  }

  editorStore.selectNode(nodeId)
}

const handleNodePointerDown = (e: PointerEvent, nodeId: string) => {
  if (isDrawingMode.value) return

  e.stopPropagation()
  const pos = getPointerPos(e)
  const canvasPos = screenToCanvas(pos.x, pos.y)
  const node = nodes.value.find((n) => n.id === nodeId)
  if (!node) return

  dragStart.value = { x: canvasPos.x - node.x, y: canvasPos.y - node.y }
  lastPointerPos.value = pos
  dragNodeId.value = nodeId
  isDragging.value = true
  editorStore.selectNode(nodeId)
}

const handleFixtureDragStart = (e: PointerEvent, fixtureId: string) => {
  const fixture = fixtures.value.find((f) => f.id === fixtureId)
  if (!fixture) return

  const pos = getPointerPos(e)
  const canvasPos = screenToCanvas(pos.x, pos.y)
  dragStart.value = {
    x: canvasPos.x - fixture.x,
    y: canvasPos.y - fixture.y,
  }
  lastPointerPos.value = pos
  dragFixtureId.value = fixtureId
  isDragging.value = true
}

const handleResizeStart = (e: PointerEvent, fixtureId: string, handle: string) => {
  e.stopPropagation()
  const fixture = fixtures.value.find((f) => f.id === fixtureId)
  if (!fixture) return

  const pos = getPointerPos(e)
  const canvasPos = screenToCanvas(pos.x, pos.y)
  dragStart.value = { x: canvasPos.x, y: canvasPos.y }
  lastPointerPos.value = pos
  resizeStartDimensions.value = {
    width: fixture.width,
    height: fixture.height,
    x: fixture.x,
    y: fixture.y,
  }
  dragFixtureId.value = fixtureId
  resizeHandle.value = handle as ResizeHandle
  isResizing.value = true
}

const handleRotateStart = (e: PointerEvent, fixtureId: string) => {
  e.stopPropagation()
  const fixture = fixtures.value.find((f) => f.id === fixtureId)
  if (!fixture) return

  const pos = getPointerPos(e)
  lastPointerPos.value = pos
  dragFixtureId.value = fixtureId
  isRotating.value = true
  editorStore.selectFixture(fixtureId)
}

const handlePointerMove = (e: PointerEvent) => {
  const pos = getPointerPos(e)
  const canvasPos = screenToCanvas(pos.x, pos.y)
  mousePos.value = canvasPos

  if (isResizing.value && dragFixtureId.value && resizeHandle.value) {
    const dx = canvasPos.x - dragStart.value.x
    const dy = canvasPos.y - dragStart.value.y
    const gridSize = 10

    let newWidth = resizeStartDimensions.value.width
    let newHeight = resizeStartDimensions.value.height
    let newX = resizeStartDimensions.value.x
    let newY = resizeStartDimensions.value.y

    if (resizeHandle.value.includes('e')) {
      newWidth = Math.max(
        20,
        Math.round((resizeStartDimensions.value.width + dx) / gridSize) * gridSize,
      )
    }
    if (resizeHandle.value.includes('w')) {
      const widthChange = Math.round(dx / gridSize) * gridSize
      newWidth = Math.max(20, resizeStartDimensions.value.width - widthChange)
      newX = resizeStartDimensions.value.x + widthChange
    }
    if (resizeHandle.value.includes('s')) {
      newHeight = Math.max(
        20,
        Math.round((resizeStartDimensions.value.height + dy) / gridSize) * gridSize,
      )
    }
    if (resizeHandle.value.includes('n')) {
      const heightChange = Math.round(dy / gridSize) * gridSize
      newHeight = Math.max(20, resizeStartDimensions.value.height - heightChange)
      newY = resizeStartDimensions.value.y + heightChange
    }

    editorStore.updateFixture(dragFixtureId.value, {
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY,
    })
  } else if (isRotating.value && dragFixtureId.value) {
    const fixture = fixtures.value.find((f) => f.id === dragFixtureId.value)
    if (fixture) {
      const centerX = fixture.x + fixture.width / 2
      const centerY = fixture.y + fixture.height / 2
      const angle = Math.atan2(canvasPos.y - centerY, canvasPos.x - centerX)
      let degrees = (angle * 180) / Math.PI + 90
      degrees = Math.round(degrees / 15) * 15
      editorStore.updateFixture(dragFixtureId.value, { rotation: degrees })
    }
  } else if (isDragging.value && dragFixtureId.value) {
    let newX = canvasPos.x - dragStart.value.x
    let newY = canvasPos.y - dragStart.value.y
    const gridSize = 10
    newX = Math.round(newX / gridSize) * gridSize
    newY = Math.round(newY / gridSize) * gridSize
    editorStore.updateFixture(dragFixtureId.value, { x: newX, y: newY })
  } else if (isDragging.value && dragNodeId.value) {
    const gridSize = 10
    const snappedX = Math.round(canvasPos.x / gridSize) * gridSize
    const snappedY = Math.round(canvasPos.y / gridSize) * gridSize
    editorStore.updateNode(dragNodeId.value, { x: snappedX, y: snappedY })
  } else if (isPanning.value && activePointers.value.size < 2) {
    const dx = pos.x - lastPointerPos.value.x
    const dy = pos.y - lastPointerPos.value.y
    editorStore.setPanOffset({ x: editorStore.panOffset.x + dx, y: editorStore.panOffset.y + dy })
  }

  // Handle Pinch-to-Zoom
  if (activePointers.value.size === 2) {
    const points = Array.from(activePointers.value.values())
    const p1 = points[0]!
    const p2 = points[1]!

    const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
    const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }

    if (lastPinchDistance.value !== null && lastPinchCenter.value !== null) {
      const zoomDelta = (distance - lastPinchDistance.value) / 100
      editorStore.setZoom(Math.max(0.1, Math.min(5, editorStore.zoom + zoomDelta)))

      const dx = center.x - lastPinchCenter.value.x
      const dy = center.y - lastPinchCenter.value.y
      editorStore.setPanOffset({ x: editorStore.panOffset.x + dx, y: editorStore.panOffset.y + dy })
    }

    lastPinchDistance.value = distance
    lastPinchCenter.value = center
  }

  activePointers.value.set(e.pointerId, pos)
  lastPointerPos.value = pos
}

const handlePointerUp = (e: PointerEvent) => {
  activePointers.value.delete(e.pointerId)

  if (activePointers.value.size < 2) {
    lastPinchDistance.value = null
    lastPinchCenter.value = null
  }

  if (isPanning.value || isDragging.value || isResizing.value || isRotating.value) {
    isDragging.value = false
    isPanning.value = false
    isResizing.value = false
    isRotating.value = false
    dragFixtureId.value = null
    dragNodeId.value = null
    resizeHandle.value = null
  }
}

const handleCanvasPointerDown = (e: PointerEvent) => {
  activePointers.value.set(e.pointerId, getPointerPos(e))

  const target = e.target as Element
  if (
    target === svgRef.value ||
    target.classList.contains('floor') ||
    target.classList.contains('canvas-bg')
  ) {
    if (e.button === 0 && !isDrawingMode.value) {
      isPanning.value = true
      lastPointerPos.value = getPointerPos(e)
    }
  }
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  editorStore.setZoom(editorStore.zoom + delta)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && editorStore.isDrawingWall) {
    editorStore.cancelDrawingWall()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const viewBox = computed(
  () => `${-viewBoxPadding} ${-viewBoxPadding} ${viewBoxWidth.value} ${viewBoxHeight.value}`,
)

const floorPolygon = computed(() => editorStore.getFloorPolygon())
const hasClosedFloor = computed(() => editorStore.isFloorClosed)

const cursor = computed(() => {
  if (isDrawingMode.value) return 'crosshair'
  if (isPanning.value) return 'grabbing'
  if (isDragging.value) return 'move'
  return 'default'
})

const drawingStartPos = computed(() =>
  editorStore.drawingStartNodeId
    ? editorStore.getNodePosition(editorStore.drawingStartNodeId)
    : null,
)
</script>

<template>
  <div v-if="editorStore.currentLayout" class="w-full h-full overflow-hidden bg-muted/50">
    <svg
      ref="svgRef"
      class="w-full h-full"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      @click="handleCanvasClick"
      @pointerdown="handleCanvasPointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointerleave="handlePointerUp"
      @wheel="handleWheel"
      :style="{
        transform: `scale(${editorStore.zoom}) translate(${editorStore.panOffset.x / editorStore.zoom}px, ${editorStore.panOffset.y / editorStore.zoom}px)`,
        transformOrigin: 'center center',
        cursor: cursor,
        touchAction: 'none',
      }"
    >
      <defs>
        <!-- Wood floor pattern -->
        <pattern id="woodFloor" patternUnits="userSpaceOnUse" width="60" height="20">
          <rect width="60" height="20" fill="#C4A574" />
          <rect x="0" y="0" width="28" height="9" fill="#B8956C" rx="1" />
          <rect x="32" y="0" width="28" height="9" fill="#BFA07A" rx="1" />
          <rect x="15" y="11" width="28" height="9" fill="#B8956C" rx="1" />
          <rect x="47" y="11" width="13" height="9" fill="#C9AD7E" rx="1" />
          <rect x="0" y="11" width="13" height="9" fill="#C9AD7E" rx="1" />
        </pattern>

        <!-- Grid pattern -->
        <pattern id="grid" patternUnits="userSpaceOnUse" width="50" height="50">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#94a3b8" stroke-width="0.5" />
        </pattern>

        <!-- Small grid -->
        <pattern id="smallGrid" patternUnits="userSpaceOnUse" width="10" height="10">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#cbd5e1" stroke-width="0.25" />
        </pattern>

        <!-- Shadow filter -->
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      <!-- Canvas background with grid -->
      <rect
        class="canvas-bg"
        :x="-viewBoxPadding"
        :y="-viewBoxPadding"
        :width="viewBoxWidth"
        :height="viewBoxHeight"
        fill="#f1f5f9"
      />

      <!-- Small grid -->
      <rect
        class="canvas-bg"
        :x="-viewBoxPadding"
        :y="-viewBoxPadding"
        :width="viewBoxWidth"
        :height="viewBoxHeight"
        fill="url(#smallGrid)"
      />

      <!-- Large grid -->
      <rect
        class="canvas-bg"
        :x="-viewBoxPadding"
        :y="-viewBoxPadding"
        :width="viewBoxWidth"
        :height="viewBoxHeight"
        fill="url(#grid)"
      />

      <!-- Floor polygon if walls form a closed shape -->
      <polygon
        v-if="hasClosedFloor && floorPolygon"
        class="floor"
        :points="floorPolygon.map((p) => `${p.x},${p.y}`).join(' ')"
        fill="url(#woodFloor)"
        stroke="#8B7355"
        stroke-width="2"
      />

      <!-- Walls -->
      <g>
        <WallRenderer v-for="wall in walls" :key="wall.id" :wall="wall" />
      </g>

      <!-- Wall nodes -->
      <g>
        <g v-for="node in nodes" :key="node.id">
          <!-- Node circle -->
          <circle
            :cx="node.x"
            :cy="node.y"
            :r="
              editorStore.selectedNodeId === node.id || editorStore.drawingStartNodeId === node.id
                ? 10
                : 8
            "
            :fill="
              editorStore.drawingStartNodeId === node.id
                ? '#22c55e'
                : editorStore.selectedNodeId === node.id
                  ? '#FACC15'
                  : '#ffffff'
            "
            :stroke="
              editorStore.drawingStartNodeId === node.id
                ? '#16a34a'
                : editorStore.selectedNodeId === node.id
                  ? '#eab308'
                  : '#64748b'
            "
            stroke-width="2"
            @click="(e) => handleNodeClick(e as any, node.id)"
            @pointerdown="(e) => handleNodePointerDown(e, node.id)"
            class="cursor-pointer"
            :style="{
              filter:
                editorStore.selectedNodeId === node.id || editorStore.drawingStartNodeId === node.id
                  ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))'
                  : undefined,
            }"
          />

          <!-- Node label -->
          <text
            v-if="editorStore.selectedNodeId === node.id"
            :x="node.x"
            :y="node.y - 18"
            text-anchor="middle"
            fill="#64748b"
            font-size="10"
            font-weight="500"
          >
            {{ Math.round(node.x) }}, {{ Math.round(node.y) }}
          </text>
        </g>
      </g>

      <!-- Drawing preview line -->
      <line
        v-if="editorStore.isDrawingWall && drawingStartPos"
        :x1="drawingStartPos.x"
        :y1="drawingStartPos.y"
        :x2="mousePos.x"
        :y2="mousePos.y"
        stroke="#22c55e"
        stroke-width="2"
        stroke-dasharray="8,4"
        pointer-events="none"
      />

      <!-- Fixtures -->
      <g>
        <DraggableFixture
          v-for="fixture in fixtures"
          :key="fixture.id"
          :fixture="fixture"
          :scale="editorStore.zoom"
          @dragStart="handleFixtureDragStart"
          @resizeStart="handleResizeStart"
          @rotateStart="handleRotateStart"
          :isResizing="isResizing && dragFixtureId === fixture.id"
        />
      </g>

      <!-- Canvas dimension labels -->
      <g class="dimensions" fill="#64748b" font-size="12" font-weight="500" pointer-events="none">
        <text
          :x="editorStore.currentLayout.width / 2"
          :y="-viewBoxPadding + 20"
          text-anchor="middle"
        >
          {{ editorStore.currentLayout.width }} cm
        </text>
        <text
          :x="-viewBoxPadding + 20"
          :y="editorStore.currentLayout.height / 2"
          text-anchor="middle"
          :transform="`rotate(-90, ${-viewBoxPadding + 20}, ${editorStore.currentLayout.height / 2})`"
        >
          {{ editorStore.currentLayout.height }} cm
        </text>
      </g>

      <!-- Drawing mode hint -->
      <text
        v-if="isDrawingMode && !editorStore.isDrawingWall && nodes.length === 0"
        :x="editorStore.currentLayout.width / 2"
        :y="editorStore.currentLayout.height / 2"
        text-anchor="middle"
        fill="#64748b"
        font-size="16"
        font-weight="500"
        pointer-events="none"
      >
        Click anywhere to start drawing walls
      </text>
    </svg>
  </div>
</template>

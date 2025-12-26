import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  StoreLayout,
  PlacedFixture,
  ToolType,
  FixtureCategory,
  WallSegment,
  FixtureContents,
  ShelfLevel,
  ShelfSlot,
  WallNode,
  StructureType,
} from '@/types/editor'
import { getTemplateById } from '@/data/fixtureTemplates'

const generateId = () => Math.random().toString(36).substr(2, 9)

const createDefaultLayout = (name: string, width: number, height: number): StoreLayout => ({
  id: generateId(),
  name,
  width,
  height,
  nodes: [],
  walls: [],
  fixtures: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const createDefaultContents = (shelves: number = 4): FixtureContents => ({
  levels: Array.from({ length: shelves }, (_, i) => ({
    id: generateId(),
    slots: [{ id: generateId(), productId: null, facings: 1, priceLabel: false }],
  })),
})

export const useEditorStore = defineStore(
  'editor',
  () => {
    // State
    const currentLayout = ref<StoreLayout | null>(null)
    const savedLayouts = ref<StoreLayout[]>([])

    const selectedFixtureId = ref<string | null>(null)
    const selectedWallId = ref<string | null>(null)
    const selectedNodeId = ref<string | null>(null)
    const activeTool = ref<ToolType>('select')

    const isDrawingWall = ref(false)
    const drawingStartNodeId = ref<string | null>(null)

    const zoom = ref(1)
    const panOffset = ref({ x: 0, y: 0 })

    const isLibraryOpen = ref(false)
    const libraryCategory = ref<FixtureCategory | 'all'>('all')

    const isProductEditorOpen = ref(false)
    const editingFixtureId = ref<string | null>(null)

    // Layout actions
    const createNewLayout = (name: string, width: number, height: number) => {
      const layout = createDefaultLayout(name, width, height)
      currentLayout.value = layout
      savedLayouts.value.push(layout)
      selectedFixtureId.value = null
      selectedWallId.value = null
      selectedNodeId.value = null
    }

    const loadLayout = (id: string) => {
      const layout = savedLayouts.value.find((l) => l.id === id)
      if (layout) {
        currentLayout.value = { ...layout }
        selectedFixtureId.value = null
        selectedWallId.value = null
        selectedNodeId.value = null
      }
    }

    const saveCurrentLayout = () => {
      if (!currentLayout.value) return

      const updated = { ...currentLayout.value, updatedAt: new Date().toISOString() }
      currentLayout.value = updated
      savedLayouts.value = savedLayouts.value.map((l) => (l.id === updated.id ? updated : l))
    }

    const deleteLayout = (id: string) => {
      savedLayouts.value = savedLayouts.value.filter((l) => l.id !== id)
      if (currentLayout.value?.id === id) {
        currentLayout.value = null
      }
    }

    const updateLayoutDimensions = (width: number, height: number) => {
      if (!currentLayout.value) return
      currentLayout.value.width = width
      currentLayout.value.height = height
    }

    // Node actions
    const addNode = (x: number, y: number): string => {
      const nodeId = generateId()
      const node: WallNode = { id: nodeId, x, y }
      if (currentLayout.value) {
        currentLayout.value.nodes.push(node)
      }
      return nodeId
    }

    const updateNode = (id: string, updates: Partial<WallNode>) => {
      if (!currentLayout.value) return
      const node = currentLayout.value.nodes.find((n) => n.id === id)
      if (node) {
        Object.assign(node, updates)
      }
    }

    const deleteNode = (id: string) => {
      if (!currentLayout.value) return
      // Also delete walls connected to this node
      currentLayout.value.walls = currentLayout.value.walls.filter(
        (w) => w.startNodeId !== id && w.endNodeId !== id,
      )
      currentLayout.value.nodes = currentLayout.value.nodes.filter((n) => n.id !== id)
      if (selectedNodeId.value === id) {
        selectedNodeId.value = null
      }
    }

    const selectNode = (id: string | null) => {
      selectedNodeId.value = id
      selectedWallId.value = null
      selectedFixtureId.value = null
    }

    const findNearbyNode = (x: number, y: number, threshold = 20): WallNode | null => {
      if (!currentLayout.value) return null

      for (const node of currentLayout.value.nodes) {
        const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2)
        if (dist < threshold) return node
      }
      return null
    }

    // Wall drawing
    const startDrawingWall = (nodeId: string) => {
      isDrawingWall.value = true
      drawingStartNodeId.value = nodeId
    }

    const finishDrawingWall = (endNodeId: string) => {
      if (!drawingStartNodeId.value || drawingStartNodeId.value === endNodeId) {
        isDrawingWall.value = false
        drawingStartNodeId.value = null
        return
      }

      let wallType: StructureType = 'wall'
      if (activeTool.value === 'drawDoor') wallType = 'door'
      else if (activeTool.value === 'drawWindow') wallType = 'window'

      addWall(drawingStartNodeId.value, endNodeId, wallType)
      isDrawingWall.value = false
      drawingStartNodeId.value = null
    }

    const cancelDrawingWall = () => {
      isDrawingWall.value = false
      drawingStartNodeId.value = null
    }

    // Wall actions
    const addWall = (startNodeId: string, endNodeId: string, type: StructureType) => {
      const wall: WallSegment = {
        id: generateId(),
        startNodeId,
        endNodeId,
        thickness: type === 'wall' ? 15 : 10,
        type,
        doorSwing: type === 'door' ? 'left' : undefined,
      }
      if (currentLayout.value) {
        currentLayout.value.walls.push(wall)
        selectedWallId.value = wall.id
      }
    }

    const updateWall = (id: string, updates: Partial<WallSegment>) => {
      if (!currentLayout.value) return
      const wall = currentLayout.value.walls.find((w) => w.id === id)
      if (wall) {
        Object.assign(wall, updates)
      }
    }

    const deleteWall = (id: string) => {
      if (!currentLayout.value) return
      currentLayout.value.walls = currentLayout.value.walls.filter((w) => w.id !== id)
      if (selectedWallId.value === id) {
        selectedWallId.value = null
      }
    }

    const selectWall = (id: string | null) => {
      selectedWallId.value = id
      selectedFixtureId.value = null
      selectedNodeId.value = null
    }

    // Fixture actions
    const addFixture = (templateId: string, x: number, y: number) => {
      const template = getTemplateById(templateId)
      if (!template) return

      const fixture: PlacedFixture = {
        id: generateId(),
        templateId,
        x,
        y,
        rotation: 0,
        width: template.width,
        height: template.height,
        contents:
          template.category === 'shelves' || template.category === 'fridges'
            ? createDefaultContents(template.shelves || 4)
            : undefined,
      }

      if (currentLayout.value) {
        currentLayout.value.fixtures.push(fixture)
        selectedFixtureId.value = fixture.id
        isLibraryOpen.value = false
      }
    }

    const updateFixture = (id: string, updates: Partial<PlacedFixture>) => {
      if (!currentLayout.value) return
      const fixture = currentLayout.value.fixtures.find((f) => f.id === id)
      if (fixture) {
        Object.assign(fixture, updates)
      }
    }

    const deleteFixture = (id: string) => {
      if (!currentLayout.value) return
      currentLayout.value.fixtures = currentLayout.value.fixtures.filter((f) => f.id !== id)
      if (selectedFixtureId.value === id) {
        selectedFixtureId.value = null
      }
    }

    const duplicateFixture = (id: string) => {
      if (!currentLayout.value) return

      const fixture = currentLayout.value.fixtures.find((f) => f.id === id)
      if (!fixture) return

      const newFixture: PlacedFixture = {
        ...fixture,
        id: generateId(),
        x: fixture.x + 20,
        y: fixture.y + 20,
      }

      currentLayout.value.fixtures.push(newFixture)
      selectedFixtureId.value = newFixture.id
    }

    const rotateFixture = (id: string) => {
      if (!currentLayout.value) return
      const fixture = currentLayout.value.fixtures.find((f) => f.id === id)
      if (fixture) {
        const newRotation = (fixture.rotation + 90) % 360
        fixture.rotation = newRotation
        const temp = fixture.width
        fixture.width = fixture.height
        fixture.height = temp
      }
    }

    // Product editor actions
    const openProductEditor = (fixtureId: string) => {
      isProductEditorOpen.value = true
      editingFixtureId.value = fixtureId
    }

    const closeProductEditor = () => {
      isProductEditorOpen.value = false
      editingFixtureId.value = null
    }

    const updateFixtureContents = (fixtureId: string, contents: FixtureContents) => {
      if (!currentLayout.value) return
      const fixture = currentLayout.value.fixtures.find((f) => f.id === fixtureId)
      if (fixture) {
        fixture.contents = contents
      }
    }

    const updateShelfSlot = (
      fixtureId: string,
      levelIndex: number,
      slotIndex: number,
      updates: Partial<ShelfSlot>,
    ) => {
      if (!currentLayout.value) return
      const fixture = currentLayout.value.fixtures.find((f) => f.id === fixtureId)
      if (!fixture?.contents) return

      const slot = fixture.contents.levels[levelIndex]?.slots[slotIndex]
      if (slot) {
        Object.assign(slot, updates)
      }
    }

    const addShelfSlot = (fixtureId: string, levelIndex: number) => {
      if (!currentLayout.value) return
      const fixture = currentLayout.value.fixtures.find((f) => f.id === fixtureId)
      if (!fixture?.contents) return

      const level = fixture.contents.levels[levelIndex]
      if (level) {
        level.slots.push({
          id: generateId(),
          productId: null,
          facings: 1,
          priceLabel: false,
        })
      }
    }

    const removeShelfSlot = (fixtureId: string, levelIndex: number, slotIndex: number) => {
      if (!currentLayout.value) return
      const fixture = currentLayout.value.fixtures.find((f) => f.id === fixtureId)
      if (!fixture?.contents) return

      const level = fixture.contents.levels[levelIndex]
      if (level) {
        level.slots = level.slots.filter((_, i) => i !== slotIndex)
      }
    }

    const moveFixtureToBack = (fixtureId: string) => {
      if (!currentLayout.value) return
      const index = currentLayout.value.fixtures.findIndex((f) => f.id === fixtureId)
      if (index > 0) {
        const [fixture] = currentLayout.value.fixtures.splice(index, 1)
        if (fixture) currentLayout.value.fixtures.unshift(fixture)
      }
    }

    const moveFixtureToFront = (fixtureId: string) => {
      if (!currentLayout.value) return
      const index = currentLayout.value.fixtures.findIndex((f) => f.id === fixtureId)
      if (index !== -1 && index < currentLayout.value.fixtures.length - 1) {
        const [fixture] = currentLayout.value.fixtures.splice(index, 1)
        if (fixture) currentLayout.value.fixtures.push(fixture)
      }
    }

    const selectFixture = (id: string | null) => {
      selectedFixtureId.value = id
      selectedWallId.value = null
      selectedNodeId.value = null
    }

    const setActiveTool = (tool: ToolType) => {
      activeTool.value = tool
      isDrawingWall.value = false
      drawingStartNodeId.value = null
    }

    const setZoom = (value: number) => {
      zoom.value = Math.max(0.25, Math.min(3, value))
    }

    const setPanOffset = (offset: { x: number; y: number }) => {
      panOffset.value = offset
    }

    const openLibrary = (category: FixtureCategory | 'all' = 'all') => {
      isLibraryOpen.value = true
      libraryCategory.value = category
    }

    const closeLibrary = () => {
      isLibraryOpen.value = false
    }

    const setLibraryCategory = (category: FixtureCategory | 'all') => {
      libraryCategory.value = category
    }

    // Helpers
    const getNodePosition = (nodeId: string): { x: number; y: number } | null => {
      if (!currentLayout.value) return null
      const node = currentLayout.value.nodes.find((n) => n.id === nodeId)
      return node ? { x: node.x, y: node.y } : null
    }

    const getWallCoordinates = (
      wall: WallSegment,
    ): { x1: number; y1: number; x2: number; y2: number } | null => {
      if (!currentLayout.value) return null
      const startNode = currentLayout.value.nodes.find((n) => n.id === wall.startNodeId)
      const endNode = currentLayout.value.nodes.find((n) => n.id === wall.endNodeId)
      if (!startNode || !endNode) return null
      return { x1: startNode.x, y1: startNode.y, x2: endNode.x, y2: endNode.y }
    }

    const isFloorClosed = computed(() => {
      if (!currentLayout.value || currentLayout.value.walls.length < 3) return false

      // Build adjacency map
      const adjacency: Record<string, string[]> = {}
      for (const wall of currentLayout.value.walls) {
        if (!adjacency[wall.startNodeId]) adjacency[wall.startNodeId] = []
        if (!adjacency[wall.endNodeId]) adjacency[wall.endNodeId] = []
        adjacency[wall.startNodeId]?.push(wall.endNodeId)
        adjacency[wall.endNodeId]?.push(wall.startNodeId)
      }

      // Check if all nodes have at least 2 connections
      for (const nodeId of Object.keys(adjacency)) {
        if (adjacency[nodeId]?.length ?? 0 < 2) return false
      }

      return true
    })

    const getFloorPolygon = (): { x: number; y: number }[] | null => {
      if (!currentLayout.value || !isFloorClosed.value) return null

      const visited = new Set<string>()
      const polygon: { x: number; y: number }[] = []

      if (currentLayout.value.nodes.length === 0) return null

      let currentNodeId = currentLayout.value.nodes[0]?.id
      if (!currentNodeId) return null

      while (!visited.has(currentNodeId)) {
        visited.add(currentNodeId)
        const node = currentLayout.value.nodes.find((n) => n.id === currentNodeId)
        if (!node) break
        polygon.push({ x: node.x, y: node.y })

        // Find next connected node
        const connectedWall = currentLayout.value.walls.find(
          (w) =>
            (w.startNodeId === currentNodeId && !visited.has(w.endNodeId)) ||
            (w.endNodeId === currentNodeId && !visited.has(w.startNodeId)),
        )

        if (!connectedWall) break
        currentNodeId =
          connectedWall.startNodeId === currentNodeId
            ? connectedWall.endNodeId
            : connectedWall.startNodeId
      }

      return polygon.length >= 3 ? polygon : null
    }

    return {
      // State
      currentLayout,
      savedLayouts,
      selectedFixtureId,
      selectedWallId,
      selectedNodeId,
      activeTool,
      isDrawingWall,
      drawingStartNodeId,
      zoom,
      panOffset,
      isLibraryOpen,
      libraryCategory,
      isProductEditorOpen,
      editingFixtureId,

      // Layout actions
      createNewLayout,
      loadLayout,
      saveCurrentLayout,
      deleteLayout,
      updateLayoutDimensions,

      // Node actions
      addNode,
      updateNode,
      deleteNode,
      selectNode,
      findNearbyNode,

      // Wall drawing
      startDrawingWall,
      finishDrawingWall,
      cancelDrawingWall,

      // Wall actions
      addWall,
      updateWall,
      deleteWall,
      selectWall,

      // Fixture actions
      addFixture,
      updateFixture,
      deleteFixture,
      duplicateFixture,
      rotateFixture,
      moveFixtureToBack,
      moveFixtureToFront,

      // Product editor actions
      openProductEditor,
      closeProductEditor,
      updateFixtureContents,
      updateShelfSlot,
      addShelfSlot,
      removeShelfSlot,

      // Selection & tool actions
      selectFixture,
      setActiveTool,
      setZoom,
      setPanOffset,

      // Library actions
      openLibrary,
      closeLibrary,
      setLibraryCategory,

      // Helpers
      getNodePosition,
      getWallCoordinates,
      isFloorClosed,
      getFloorPolygon,
    }
  },
  {
    persist: {
      pick: ['savedLayouts'],
    },
  },
)

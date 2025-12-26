export type FixtureCategory = 'shelves' | 'fridges' | 'checkout' | 'structures' | 'furniture'

export type StructureType = 'wall' | 'door' | 'window'

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  color: string
  width: number // in cm on shelf
  category: string
}

export interface ShelfSlot {
  id: string
  productId: string | null // null = empty space
  facings: number // how many product units side by side
  priceLabel: boolean
}

export interface ShelfLevel {
  id: string
  slots: ShelfSlot[]
}

export interface FixtureContents {
  levels: ShelfLevel[]
}

export interface FixtureTemplate {
  id: string
  name: string
  category: FixtureCategory
  width: number // in cm
  height: number // in cm (depth for top view)
  color: string
  shelves?: number
  doors?: number
  description?: string
}

export interface PlacedFixture {
  id: string
  templateId: string
  x: number
  y: number
  rotation: number // 0, 90, 180, 270
  width: number
  height: number
  customColor?: string
  contents?: FixtureContents
}

// Wall node for node-based building
export interface WallNode {
  id: string
  x: number
  y: number
}

export interface WallSegment {
  id: string
  startNodeId: string
  endNodeId: string
  thickness: number
  type: StructureType
  doorSwing?: 'left' | 'right' | 'sliding'
}

export interface StoreLayout {
  id: string
  name: string
  width: number // canvas width in cm
  height: number // canvas height in cm
  nodes: WallNode[]
  walls: WallSegment[]
  fixtures: PlacedFixture[]
  createdAt: string
  updatedAt: string
}

export type ToolType =
  | 'select'
  | 'move'
  | 'rotate'
  | 'duplicate'
  | 'delete'
  | 'drawWall'
  | 'drawWindow'
  | 'drawDoor'

export interface EditorState {
  currentLayout: StoreLayout | null
  selectedFixtureId: string | null
  selectedWallId: string | null
  selectedNodeId: string | null
  activeTool: ToolType
  zoom: number
  panOffset: { x: number; y: number }
  isLibraryOpen: boolean
  libraryCategory: FixtureCategory | 'all'
  savedLayouts: StoreLayout[]
  isProductEditorOpen: boolean
  editingFixtureId: string | null
  isDrawingWall: boolean
  drawingStartNodeId: string | null
}

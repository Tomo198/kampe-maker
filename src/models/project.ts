import type { Asset } from './asset'
import type { CanvasElement } from './element'
import type { ElementGroup } from './group'

export type CanvasSettings = {
  width: number
  height: number
  backgroundColor: string
  transparent: boolean
  gridEnabled: boolean
  gridSize: number
  snapEnabled: boolean
}

export type Project = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  formatVersion: number
  canvas: CanvasSettings
  assets: Asset[]
  elements: CanvasElement[]
  groups: ElementGroup[]
}

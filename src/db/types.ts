// Database record types — separated from domain models
// These represent the shape stored in IndexedDB via Dexie

import type { CanvasSettings } from '../models/project'
import type { Asset } from '../models/asset'
import type { CanvasElement } from '../models/element'
import type { ElementGroup } from '../models/group'

export type ProjectRecordV1 = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  data: string
}

export type ProjectRecord = {
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

export type ProjectPreviewRecord = {
  projectId: string
  updatedAt: string
  blob: Blob
}

export type BlobRecord = {
  key: string
  projectId: string
  assetId: string
  kind: 'original' | 'preview' | 'thumbnail'
  blob: Blob
  createdAt: string
  deletedAt?: string
}

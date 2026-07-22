// Database record types — separated from domain models
// These represent the shape stored in IndexedDB via Dexie

export type ProjectRecord = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  // Serialized project data (canvas settings, elements, groups, assets metadata)
  data: string
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

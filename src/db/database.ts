import Dexie from 'dexie'
import type { ProjectRecord, BlobRecord } from './types'

export class KampeDB extends Dexie {
  projects!: Dexie.Table<ProjectRecord, string>
  blobs!: Dexie.Table<BlobRecord, string>

  constructor() {
    super('KampeDB')

    this.version(1).stores({
      projects: 'id, updatedAt, createdAt, name',
      blobs: 'key, projectId, assetId, kind, [projectId+assetId]',
    })
  }
}

export const db = new KampeDB()

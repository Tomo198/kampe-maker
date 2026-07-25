import Dexie from 'dexie'
import type { ProjectRecord, BlobRecord, ProjectPreviewRecord } from './types'

export class KampeDB extends Dexie {
  projects!: Dexie.Table<ProjectRecord, string>
  blobs!: Dexie.Table<BlobRecord, string>
  projectPreviews!: Dexie.Table<ProjectPreviewRecord, string>

  constructor() {
    super('KampeDB')

    this.version(1).stores({
      projects: 'id, updatedAt, createdAt, name',
      blobs: 'key, projectId, assetId, kind, [projectId+assetId]',
    })

    this.version(2)
      .stores({
        projectPreviews: 'projectId, updatedAt',
      })
      .upgrade((tx) => {
        // Migrate v1 data strings to v2 objects
        return tx
          .table('projects')
          .toCollection()
          .modify((project: Record<string, unknown>) => {
            if (typeof project.data === 'string') {
              try {
                const parsed = JSON.parse(project.data)
                project.formatVersion = parsed.formatVersion || 1
                project.canvas = parsed.canvas || {
                  width: 1920,
                  height: 1080,
                  backgroundColor: '#ffffff',
                  transparent: false,
                  gridEnabled: false,
                  gridSize: 20,
                  snapEnabled: true,
                }
                project.assets = parsed.assets || []
                project.elements = parsed.elements || []
                project.groups = parsed.groups || []
                delete project.data
              } catch (e) {
                console.error('Failed to parse v1 project data', e)
              }
            }
          })
      })
  }
}

export const db = new KampeDB()

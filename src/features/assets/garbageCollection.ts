import { db } from '../../db/database'
import { useProjectStore } from '../../store/projectStore'
import type { Asset } from '../../models/asset'

function collectAssetBlobKeys(assets: Asset[], set: Set<string>) {
  for (const asset of assets) {
    if (asset.originalBlobKey) set.add(asset.originalBlobKey)
    if (asset.previewBlobKey) set.add(asset.previewBlobKey)
    if (asset.thumbnailBlobKey) set.add(asset.thumbnailBlobKey)
  }
}

export async function cleanupOrphanedBlobs() {
  try {
    const referencedKeys = new Set<string>()

    // 1. Collect from saved projects in DB
    const projects = await db.projects.toArray()
    for (const project of projects) {
      try {
        const parsedData = JSON.parse(project.data)
        const assets = parsedData.assets || []
        collectAssetBlobKeys(assets, referencedKeys)
      } catch (e) {
        console.warn('Failed to parse project data during garbage collection', e)
      }
    }

    // 2. Collect from active in-memory session (past, future, current project)
    const state = useProjectStore.getState()
    if (state.project) collectAssetBlobKeys(state.project.assets, referencedKeys)
    state.past.forEach((p) => collectAssetBlobKeys(p.assets, referencedKeys))
    state.future.forEach((p) => collectAssetBlobKeys(p.assets, referencedKeys))

    // 3. Find orphaned blobs and delete them within a transaction
    await db.transaction('rw', db.blobs, async () => {
      const blobs = await db.blobs.toArray()
      const keysToDelete: string[] = []

      for (const blob of blobs) {
        if (!referencedKeys.has(blob.key)) {
          keysToDelete.push(blob.key)
        }
      }

      if (keysToDelete.length > 0) {
        await db.blobs.bulkDelete(keysToDelete)
        console.log(`Garbage collected ${keysToDelete.length} orphaned blobs.`)
      }
    })
  } catch (err) {
    console.error('Failed to run garbage collection', err)
  }
}

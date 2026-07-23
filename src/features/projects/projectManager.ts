import { db } from '../../db/database'
import type { ProjectRecord } from '../../db/types'
import { cleanupOrphanedBlobs } from '../assets/garbageCollection'

export async function deleteProject(projectId: string): Promise<void> {
  await db.transaction('rw', db.projects, db.projectPreviews, db.blobs, async () => {
    // 1. Delete project and preview
    await db.projects.delete(projectId)
    await db.projectPreviews.delete(projectId)

    // 2. Delete all blobs associated with this project
    const blobsToDelete = await db.blobs.where('projectId').equals(projectId).primaryKeys()
    if (blobsToDelete.length > 0) {
      await db.blobs.bulkDelete(blobsToDelete)
    }
  })

  // Optionally trigger GC
  cleanupOrphanedBlobs().catch(console.error)
}

export async function duplicateProject(originalId: string, newName: string): Promise<string> {
  return await db.transaction('rw', db.projects, db.projectPreviews, db.blobs, async () => {
    const original = await db.projects.get(originalId)
    if (!original) throw new Error(`Project ${originalId} not found`)

    const newProjectId = crypto.randomUUID()
    const now = new Date().toISOString()

    // Create maps for old ID -> new ID
    const assetIdMap = new Map<string, string>()
    const elementIdMap = new Map<string, string>()
    const groupIdMap = new Map<string, string>()
    const blobKeyMap = new Map<string, string>() // old blob key -> new blob key

    // Generate new Asset IDs and Blob Keys
    const newAssets = original.assets.map(asset => {
      const newAssetId = crypto.randomUUID()
      assetIdMap.set(asset.id, newAssetId)

      const newOriginalKey = crypto.randomUUID()
      const newPreviewKey = crypto.randomUUID()
      const newThumbnailKey = crypto.randomUUID()

      blobKeyMap.set(asset.originalBlobKey, newOriginalKey)
      if (asset.previewBlobKey) blobKeyMap.set(asset.previewBlobKey, newPreviewKey)
      if (asset.thumbnailBlobKey) blobKeyMap.set(asset.thumbnailBlobKey, newThumbnailKey)

      return {
        ...asset,
        id: newAssetId,
        originalBlobKey: newOriginalKey,
        previewBlobKey: asset.previewBlobKey ? newPreviewKey : '',
        thumbnailBlobKey: asset.thumbnailBlobKey ? newThumbnailKey : ''
      }
    })

    // Generate new Element IDs and replace references (groupId, assetId)
    const newElements = original.elements.map(el => {
      const newElementId = crypto.randomUUID()
      elementIdMap.set(el.id, newElementId)

      const copied = { ...el, id: newElementId }
      if (copied.type === 'image' && copied.assetId) {
        const newAssetId = assetIdMap.get(copied.assetId)
        if (newAssetId) copied.assetId = newAssetId
      }
      return copied
    })

    // Generate new Group IDs and replace elementIds
    const newGroups = original.groups.map(g => {
      const newGroupId = crypto.randomUUID()
      groupIdMap.set(g.id, newGroupId)

      const newElementIds = g.elementIds
        .map(eid => elementIdMap.get(eid))
        .filter(Boolean) as string[]

      return {
        ...g,
        id: newGroupId,
        elementIds: newElementIds
      }
    })

    // Final pass on elements to update groupId
    newElements.forEach(el => {
      if (el.groupId) {
        const newGroupId = groupIdMap.get(el.groupId)
        if (newGroupId) el.groupId = newGroupId
      }
    })

    // Create new ProjectRecord
    const newProject: ProjectRecord = {
      ...original,
      id: newProjectId,
      name: newName,
      createdAt: now,
      updatedAt: now,
      assets: newAssets,
      elements: newElements,
      groups: newGroups,
    }

    // Duplicate Blobs
    const originalBlobs = await db.blobs.where('projectId').equals(originalId).toArray()
    const newBlobs = originalBlobs.map(blobRec => {
      const newKey = blobKeyMap.get(blobRec.key)
      const newAssetId = assetIdMap.get(blobRec.assetId)
      
      // If we somehow didn't map the key, keep the old one (shouldn't happen)
      if (!newKey || !newAssetId) return null

      return {
        ...blobRec,
        key: newKey,
        projectId: newProjectId,
        assetId: newAssetId,
        createdAt: now
      }
    }).filter(Boolean) as typeof originalBlobs

    // Save
    await db.projects.put(newProject)
    if (newBlobs.length > 0) {
      await db.blobs.bulkPut(newBlobs)
    }

    // Copy thumbnail if exists
    const originalPreview = await db.projectPreviews.get(originalId)
    if (originalPreview) {
      await db.projectPreviews.put({
        projectId: newProjectId,
        updatedAt: now,
        blob: originalPreview.blob
      })
    }

    return newProjectId
  })
}

export async function renameProject(projectId: string, newName: string): Promise<void> {
  const trimmed = newName.trim()
  if (!trimmed) return
  await db.projects.update(projectId, { name: trimmed, updatedAt: new Date().toISOString() })
}
